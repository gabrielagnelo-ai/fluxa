import { prisma } from "@/lib/prisma";
import { hashSensitiveIdentifier } from "@/lib/security/crypto";
import { getServerEnv, requireServerEnv } from "@/lib/security/env";
import { secureLogger } from "@/lib/security/logger";
import { redact } from "@/lib/security/redaction";
import { formatCurrency } from "@/lib/utils";
import { parseWhatsAppTransaction } from "@/lib/whatsapp/parser";
import { ensureDefaultCategories } from "@/services/finance-data-service";

export function verifyWhatsAppWebhook(mode: string | null, token: string | null, challenge: string | null) {
  const verifyToken = getServerEnv().WHATSAPP_VERIFY_TOKEN;
  if (mode === "subscribe" && token && verifyToken && token === verifyToken && challenge) {
    return challenge;
  }
  return null;
}

async function sendWhatsAppText(to: string, body: string) {
  const phoneNumberId = requireServerEnv("WHATSAPP_PHONE_NUMBER_ID");
  const token = requireServerEnv("WHATSAPP_ACCESS_TOKEN");

  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body }
    })
  });

  if (!response.ok) {
    secureLogger.error("WhatsApp send failed", { status: response.status, body: await response.text() });
  }
}

async function findUserByPhone(phone: string) {
  const phoneHash = hashSensitiveIdentifier(phone);
  const link = await prisma.whatsAppLink.findFirst({
    where: { phoneHash, enabled: true },
    include: { user: true }
  });

  return { phoneHash, user: link?.user ?? null };
}

async function getFallbackUser() {
  const fallbackEmail = getServerEnv().WHATSAPP_DEFAULT_USER_EMAIL;
  if (!fallbackEmail) return null;
  return prisma.user.findUnique({ where: { email: fallbackEmail } });
}

async function ensureWhatsAppLink(userId: string, phone: string, displayName?: string) {
  const phoneHash = hashSensitiveIdentifier(phone);
  await prisma.whatsAppLink.upsert({
    where: { phoneHash },
    update: {
      userId,
      displayName,
      phoneLast4: phone.slice(-4),
      enabled: true
    },
    create: {
      userId,
      phoneHash,
      phoneLast4: phone.slice(-4),
      displayName,
      enabled: true
    }
  });
}

async function saveTransactionFromText(userId: string, text: string) {
  const parsed = parseWhatsAppTransaction(text);
  if (!parsed) return null;

  await ensureDefaultCategories(userId);
  const categories = await prisma.category.findMany({ where: { userId } });
  const category = categories.find((item) => item.name === parsed.category) ?? categories.find((item) => item.name === "Outros");

  return prisma.transaction.create({
    data: {
      userId,
      categoryId: category?.id,
      date: parsed.date,
      description: `WhatsApp - ${parsed.description}`,
      amount: parsed.amount,
      type: parsed.type,
      source: "WHATSAPP",
      categoryLocked: false
    }
  });
}

type WhatsAppPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
        messages?: Array<{ id?: string; from?: string; type?: string; text?: { body?: string } }>;
      };
    }>;
  }>;
};

export async function processWhatsAppWebhook(payload: WhatsAppPayload) {
  const changes = payload.entry?.flatMap((entry) => entry.changes ?? []) ?? [];

  for (const change of changes) {
    const value = change.value;
    const contact = value?.contacts?.[0];
    const messages = value?.messages ?? [];

    for (const message of messages) {
      if (!message.id || !message.from) continue;
      const { phoneHash, user } = await findUserByPhone(message.from);
      const fallbackUser = user ?? (await getFallbackUser());
      const text = message.type === "text" ? message.text?.body?.trim() : undefined;

      const existing = await prisma.whatsAppMessage.findUnique({ where: { providerMessageId: message.id } });
      if (existing) continue;

      if (!fallbackUser) {
        await prisma.whatsAppMessage.create({
          data: {
            providerMessageId: message.id,
            phoneHash,
            direction: "INBOUND",
            textRedacted: text ? String(redact(text)) : null,
            status: "IGNORED",
            error: "Número não vinculado a usuário."
          }
        });
        await sendWhatsAppText(message.from, "Seu número ainda não está vinculado ao Fluxa. Configure o vínculo antes de registrar gastos.");
        continue;
      }

      await ensureWhatsAppLink(fallbackUser.id, message.from, contact?.profile?.name);

      if (!text) {
        await prisma.whatsAppMessage.create({
          data: {
            userId: fallbackUser.id,
            providerMessageId: message.id,
            phoneHash,
            direction: "INBOUND",
            status: "IGNORED",
            error: "Mensagem sem texto."
          }
        });
        await sendWhatsAppText(message.from, "Por enquanto eu entendo apenas texto. Exemplo: Gastei 32 reais no iFood hoje.");
        continue;
      }

      try {
        const transaction = await saveTransactionFromText(fallbackUser.id, text);
        await prisma.whatsAppMessage.create({
          data: {
            userId: fallbackUser.id,
            providerMessageId: message.id,
            phoneHash,
            direction: "INBOUND",
            textRedacted: String(redact(text)),
            status: transaction ? "PROCESSED" : "FAILED",
            transactionId: transaction?.id,
            error: transaction ? null : "Não foi possível extrair valor.",
            processedAt: new Date()
          }
        });

        if (!transaction) {
          await sendWhatsAppText(message.from, "Não consegui identificar o valor. Tente: Gastei 32 reais no iFood hoje.");
          continue;
        }

        await sendWhatsAppText(message.from, `Registrado no Fluxa: ${transaction.type === "INCOME" ? "entrada" : "gasto"} de ${formatCurrency(Number(transaction.amount))}.`);
      } catch (error) {
        secureLogger.error("WhatsApp message processing failed", { error });
        await sendWhatsAppText(message.from, "Não consegui registrar agora. Tente novamente em alguns minutos.");
      }
    }
  }
}
