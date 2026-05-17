import crypto from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSensitiveIdentifier } from "@/lib/security/crypto";
import { getServerEnv, requireServerEnv } from "@/lib/security/env";
import { secureLogger } from "@/lib/security/logger";
import { redact } from "@/lib/security/redaction";
import { formatCurrency } from "@/lib/utils";
import { parseWhatsAppTransaction } from "@/lib/whatsapp/parser";
import { ensureDefaultCategories } from "@/services/finance-data-service";

type ReplyHandler = (message: string) => Promise<void>;

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

export function verifyWhatsAppWebhook(mode: string | null, token: string | null, challenge: string | null) {
  const verifyToken = getServerEnv().WHATSAPP_VERIFY_TOKEN;
  if (mode === "subscribe" && token && verifyToken && token === verifyToken && challenge) {
    return challenge;
  }
  return null;
}

function normalizeWhatsAppPhone(phone: string) {
  return phone.replace(/^whatsapp:/i, "").trim();
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function twiml(message?: string) {
  if (!message) return "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>";
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
}

function timingSafeEqualText(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getTwilioValidationUrls(request: NextRequest) {
  const env = getServerEnv();
  const urls = new Set<string>([request.url]);
  const configuredBaseUrl = env.NEXT_PUBLIC_SITE_URL ?? env.NEXT_PUBLIC_APP_URL;

  if (configuredBaseUrl) {
    urls.add(`${configuredBaseUrl.replace(/\/$/, "")}${request.nextUrl.pathname}${request.nextUrl.search}`);
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (forwardedProto && forwardedHost) {
    urls.add(`${forwardedProto}://${forwardedHost}${request.nextUrl.pathname}${request.nextUrl.search}`);
  }

  return [...urls];
}

export function verifyTwilioSignature(request: NextRequest, form: URLSearchParams) {
  const authToken = getServerEnv().TWILIO_AUTH_TOKEN;
  if (!authToken) {
    secureLogger.warn("TWILIO_AUTH_TOKEN not configured; accepting Twilio webhook without signature validation");
    return true;
  }

  const signature = request.headers.get("x-twilio-signature");
  if (!signature) return false;

  const entries = [...form.entries()].sort(([left], [right]) => left.localeCompare(right));
  return getTwilioValidationUrls(request).some((url) => {
    const data = entries.reduce((acc, [key, value]) => `${acc}${key}${value}`, url);
    const expected = crypto.createHmac("sha1", authToken).update(data).digest("base64");
    return timingSafeEqualText(expected, signature);
  });
}

async function sendMetaWhatsAppText(to: string, body: string) {
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
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  const phoneHash = hashSensitiveIdentifier(normalizedPhone);
  const link = await prisma.whatsAppLink.findFirst({
    where: { phoneHash, enabled: true },
    include: { user: true }
  });

  return { phoneHash, user: link?.user ?? null };
}

async function getFallbackUser() {
  const fallbackEmail = getServerEnv().WHATSAPP_DEFAULT_USER_EMAIL;
  if (!fallbackEmail) return null;
  return prisma.user.findFirst({
    where: {
      email: {
        equals: fallbackEmail.toLowerCase(),
        mode: "insensitive"
      }
    }
  });
}

async function ensureWhatsAppLink(userId: string, phone: string, displayName?: string) {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  const phoneHash = hashSensitiveIdentifier(normalizedPhone);
  await prisma.whatsAppLink.upsert({
    where: { phoneHash },
    update: {
      userId,
      displayName,
      phoneLast4: normalizedPhone.slice(-4),
      enabled: true
    },
    create: {
      userId,
      phoneHash,
      phoneLast4: normalizedPhone.slice(-4),
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
    },
    include: { category: true }
  });
}

async function processInboundTextMessage({
  providerMessageId,
  from,
  displayName,
  text,
  reply
}: {
  providerMessageId: string;
  from: string;
  displayName?: string;
  text?: string;
  reply: ReplyHandler;
}) {
  const normalizedFrom = normalizeWhatsAppPhone(from);
  const { phoneHash, user } = await findUserByPhone(normalizedFrom);
  const fallbackUser = user ?? (await getFallbackUser());

  const existing = await prisma.whatsAppMessage.findUnique({ where: { providerMessageId } });
  if (existing) return;

  if (!fallbackUser) {
    await prisma.whatsAppMessage.create({
      data: {
        providerMessageId,
        phoneHash,
        direction: "INBOUND",
        textRedacted: text ? String(redact(text)) : null,
        status: "IGNORED",
        error: "Numero nao vinculado a usuario."
      }
    });
    await reply("Seu numero ainda nao esta vinculado ao Fluxa. Configure WHATSAPP_DEFAULT_USER_EMAIL para testar o registro automatico.");
    return;
  }

  await ensureWhatsAppLink(fallbackUser.id, normalizedFrom, displayName);

  if (!text) {
    await prisma.whatsAppMessage.create({
      data: {
        userId: fallbackUser.id,
        providerMessageId,
        phoneHash,
        direction: "INBOUND",
        status: "IGNORED",
        error: "Mensagem sem texto."
      }
    });
    await reply("Por enquanto eu entendo apenas texto. Exemplo: Gastei 32 reais no iFood hoje.");
    return;
  }

  try {
    const transaction = await saveTransactionFromText(fallbackUser.id, text);
    await prisma.whatsAppMessage.create({
      data: {
        userId: fallbackUser.id,
        providerMessageId,
        phoneHash,
        direction: "INBOUND",
        textRedacted: String(redact(text)),
        status: transaction ? "PROCESSED" : "FAILED",
        transactionId: transaction?.id,
        error: transaction ? null : "Nao foi possivel extrair valor.",
        processedAt: new Date()
      }
    });

    if (!transaction) {
      await reply("Nao consegui identificar o valor. Tente: Gastei 32 reais no iFood hoje.");
      return;
    }

    const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(transaction.date);
    const categoryName = transaction.category?.name ?? "Outros";
    await reply(
      `Registrado no Fluxa: ${transaction.type === "INCOME" ? "entrada" : "gasto"} de ${formatCurrency(Number(transaction.amount))} em ${categoryName} (${date}).`
    );
  } catch (error) {
    secureLogger.error("WhatsApp message processing failed", { error });
    await reply("Nao consegui registrar agora. Tente novamente em alguns minutos.");
  }
}

export async function processTwilioWhatsAppWebhook(form: URLSearchParams) {
  const providerMessageId = form.get("MessageSid") ?? form.get("SmsMessageSid");
  const from = form.get("From");
  const text = form.get("Body")?.trim();
  const displayName = form.get("ProfileName") ?? undefined;
  let replyText: string | undefined;

  if (!providerMessageId || !from) {
    return twiml("Nao consegui identificar a mensagem recebida.");
  }

  await processInboundTextMessage({
    providerMessageId,
    from,
    displayName,
    text,
    reply: async (message) => {
      replyText = message;
    }
  });

  return twiml(replyText);
}

export async function processWhatsAppWebhook(payload: WhatsAppPayload) {
  const changes = payload.entry?.flatMap((entry) => entry.changes ?? []) ?? [];

  for (const change of changes) {
    const value = change.value;
    const contact = value?.contacts?.[0];
    const messages = value?.messages ?? [];

    for (const message of messages) {
      if (!message.id || !message.from) continue;
      const from = message.from;
      const text = message.type === "text" ? message.text?.body?.trim() : undefined;

      await processInboundTextMessage({
        providerMessageId: message.id,
        from,
        displayName: contact?.profile?.name,
        text,
        reply: (replyText) => sendMetaWhatsAppText(from, replyText)
      });
    }
  }
}
