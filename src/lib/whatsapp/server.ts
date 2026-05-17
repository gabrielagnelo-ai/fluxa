import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSensitiveIdentifier, legacyHashSensitiveIdentifier } from "@/lib/security/crypto";
import { getServerEnv, requireServerEnv } from "@/lib/security/env";
import { secureLogger } from "@/lib/security/logger";
import { redact } from "@/lib/security/redaction";
import { formatCurrency, normalizeText } from "@/lib/utils";
import { parseWhatsAppTransaction } from "@/lib/whatsapp/parser";
import { ensureDefaultCategories } from "@/services/finance-data-service";

type ReplyHandler = (message: string) => Promise<void>;

type GoalMatchResult =
  | { status: "MATCHED"; goal: { id: string; name: string } }
  | { status: "NOT_FOUND" }
  | { status: "AMBIGUOUS"; goals: { id: string; name: string }[] };

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
    const isProduction = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
    if (isProduction) {
      secureLogger.error("Twilio webhook rejected because TWILIO_AUTH_TOKEN is not configured in production");
      return false;
    }

    secureLogger.warn("TWILIO_AUTH_TOKEN not configured; accepting Twilio webhook without signature validation outside production");
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
  const legacyPhoneHash = legacyHashSensitiveIdentifier(normalizedPhone);
  const link = await prisma.whatsAppLink.findFirst({
    where: {
      phoneHash: {
        in: Array.from(new Set([phoneHash, legacyPhoneHash]))
      },
      enabled: true
    },
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

function significantGoalTokens(value: string) {
  const ignored = new Set(["META", "RESERVA", "OBJETIVO", "GUARDAR", "GUARDEI", "APORTE", "APORTEI", "DE", "DA", "DO", "DAS", "DOS", "PARA", "PRA"]);
  return normalizeText(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !ignored.has(token));
}

function scoreGoalMatch(query: string, goal: { name: string; markers: { keyword: string }[] }) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return 0;

  const candidates = [goal.name, ...goal.markers.map((marker) => marker.keyword)]
    .map((candidate) => normalizeText(candidate))
    .filter(Boolean);

  for (const candidate of candidates) {
    if (candidate === normalizedQuery) return 100;
  }

  for (const candidate of candidates) {
    if (candidate.length >= 3 && (candidate.includes(normalizedQuery) || normalizedQuery.includes(candidate))) return 85;
  }

  const queryTokens = significantGoalTokens(query);
  if (queryTokens.length === 0) return 0;

  return candidates.reduce((best, candidate) => {
    const candidateTokens = significantGoalTokens(candidate);
    if (candidateTokens.length === 0) return best;

    const matches = queryTokens.filter((token) => candidateTokens.includes(token)).length;
    if (matches === 0) return best;

    const coverage = matches / queryTokens.length;
    const candidateCoverage = matches / candidateTokens.length;
    const score = Math.round(45 + coverage * 35 + candidateCoverage * 20);
    return Math.max(best, score);
  }, 0);
}

async function findGoalForContribution(userId: string, goalQuery: string): Promise<GoalMatchResult> {
  const goals = await prisma.goal.findMany({
    where: {
      userId,
      status: { in: ["ACTIVE", "PAUSED"] }
    },
    include: { markers: true }
  });

  const scored = goals
    .map((goal) => ({
      goal: { id: goal.id, name: goal.name },
      score: scoreGoalMatch(goalQuery, goal)
    }))
    .filter((item) => item.score >= 70)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { status: "NOT_FOUND" };

  const bestScore = scored[0].score;
  const tied = scored.filter((item) => item.score === bestScore);
  if (tied.length > 1 && bestScore < 100) {
    return { status: "AMBIGUOUS", goals: tied.map((item) => item.goal) };
  }

  return { status: "MATCHED", goal: scored[0].goal };
}

async function getGoalContributionCategory(userId: string) {
  return prisma.category.upsert({
    where: { userId_name: { userId, name: "Metas e reserva" } },
    update: {},
    create: {
      userId,
      name: "Metas e reserva",
      color: "#2563eb",
      icon: "Flag",
      keywords: ["META", "RESERVA", "APORTE"]
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

  if (parsed.goalQuery) {
    const goalMatch = await findGoalForContribution(userId, parsed.goalQuery);
    if (goalMatch.status !== "MATCHED") {
      return {
        status: goalMatch.status,
        goalQuery: parsed.goalQuery,
        goals: goalMatch.status === "AMBIGUOUS" ? goalMatch.goals : []
      } as const;
    }

    const category = await getGoalContributionCategory(userId);
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        categoryId: category.id,
        date: parsed.date,
        description: `WhatsApp - Aporte meta ${goalMatch.goal.name}`,
        amount: parsed.amount,
        type: "EXPENSE",
        source: "WHATSAPP",
        categoryLocked: true,
        goalContributions: {
          create: {
            userId,
            goalId: goalMatch.goal.id,
            amount: parsed.amount,
            date: parsed.date
          }
        }
      },
      include: { category: true, goalContributions: { include: { goal: true } } }
    });

    revalidatePath("/dashboard");
    revalidatePath("/goals");
    revalidatePath("/transactions");

    return { status: "PROCESSED", transaction, goal: goalMatch.goal } as const;
  }

  const categories = await prisma.category.findMany({ where: { userId } });
  const category = categories.find((item) => item.name === parsed.category) ?? categories.find((item) => item.name === "Outros");

  const transaction = await prisma.transaction.create({
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

  revalidatePath("/dashboard");
  revalidatePath("/transactions");

  return { status: "PROCESSED", transaction } as const;
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
    const result = await saveTransactionFromText(fallbackUser.id, text);
    const transaction = result?.status === "PROCESSED" ? result.transaction : null;
    await prisma.whatsAppMessage.create({
      data: {
        userId: fallbackUser.id,
        providerMessageId,
        phoneHash,
        direction: "INBOUND",
        textRedacted: String(redact(text)),
        status: transaction ? "PROCESSED" : "FAILED",
        transactionId: transaction?.id,
        error: transaction
          ? null
          : result?.status === "NOT_FOUND"
            ? `Meta nao encontrada: ${result.goalQuery}`
            : result?.status === "AMBIGUOUS"
              ? `Meta ambigua: ${result.goalQuery}`
              : "Nao foi possivel extrair valor.",
        processedAt: new Date()
      }
    });

    if (result?.status === "NOT_FOUND") {
      await reply(`Nao encontrei a meta "${result.goalQuery}" no Fluxa. Crie essa meta primeiro ou use o mesmo nome cadastrado.`);
      return;
    }

    if (result?.status === "AMBIGUOUS") {
      const names = result.goals.map((goal) => goal.name).join(", ");
      await reply(`Encontrei mais de uma meta parecida (${names}). Envie o nome completo da meta para eu registrar o aporte.`);
      return;
    }

    if (!transaction) {
      await reply("Nao consegui identificar o valor. Tente: Gastei 32 reais no iFood hoje.");
      return;
    }

    const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(transaction.date);
    const categoryName = transaction.category?.name ?? "Outros";
    const goalName = result?.status === "PROCESSED" && "goal" in result ? result.goal?.name ?? null : null;
    if (goalName) {
      await reply(`Registrado no Fluxa: aporte de ${formatCurrency(Number(transaction.amount))} na meta ${goalName} (${date}).`);
      return;
    }

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
