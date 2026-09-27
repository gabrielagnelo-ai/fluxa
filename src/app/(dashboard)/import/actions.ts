"use server";

import { createHash } from "node:crypto";
import { Prisma, TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { secureLogger } from "@/lib/security/logger";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sanitizeTransactionForAI } from "@/lib/security/redaction";
import { normalizeText } from "@/lib/utils";
import { categorizeDescription, defaultCategoryRules } from "@/services/category-service";
import { ensureDefaultCategories } from "@/services/finance-data-service";
import { isGoalContributionExcluded, matchGoalMarker } from "@/services/goal-marker-service";
import { ensureUserFromAuthUser } from "@/services/user-service";
import { reviewImport } from "@/lib/import-deduplication";
import { isCalendarDate, isTransactionDate, transactionAmountSchema, transactionDate } from "@/lib/transaction-validation";

const transactionSchema = z.object({
  date: z.string().refine(isTransactionDate),
  description: z.string().trim().min(1).max(300),
  amount: transactionAmountSchema,
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().optional(),
  categoryLocked: z.boolean().optional(),
  goalId: z.string().optional(),
  source: z.string().max(300).optional()
});

const importPayloadSchema = z.object({
  account: z.string().trim().min(2).max(80),
  transactions: z.array(transactionSchema.extend({
    fileHash: z.string().regex(/^[a-f0-9]{64}$/),
    rowIndex: z.number().int().min(0).max(100000),
    forceImport: z.boolean().optional()
  })).min(1).max(5000)
});

function prepareImport(input: z.infer<typeof importPayloadSchema>) {
  const account = input.account.normalize("NFKC").replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
  const accountHash = createHash("sha256").update(account).digest("hex").slice(0, 20);
  return input.transactions.map((item) => ({
    ...item, source: `Extrato · ${account}`,
    importId: `statement:v1:${accountHash}:${item.fileHash}:${item.rowIndex}`
  }));
}

async function existingImportRows(tx: Prisma.TransactionClient, userId: string, transactions: ReturnType<typeof prepareImport>) {
  const dates = transactions.map((item) => item.date.slice(0, 10)).sort();
  const rows = await tx.transaction.findMany({
    where: { userId, OR: [
      { date: { gte: new Date(`${dates[0]}T00:00:00.000Z`), lte: new Date(`${dates[dates.length - 1]}T23:59:59.999Z`) } },
      { importId: { in: transactions.map((item) => item.importId) } }
    ] },
    select: { date: true, description: true, amount: true, type: true, source: true, importId: true }
  });
  return rows.map((row) => ({ ...row, date: row.date.toISOString(), amount: Number(row.amount) }));
}

export async function previewImportedTransactions(payload: unknown) {
  const parsed = importPayloadSchema.safeParse(payload);
  if (!parsed.success) return { error: "Informe a conta de origem e confira data, descrição e valor de todas as linhas (até 5.000 por lote)." };
  try {
    if (!isDatabaseConfigured() || !isSupabaseConfigured()) return { error: "Entre na sua conta para conferir duplicadas e salvar extratos." };
    const { data } = await (await createClient()).auth.getUser();
    if (!data.user) return { error: "Faça login para conferir as transações já importadas." };
    const user = await ensureUserFromAuthUser(data.user);
    const transactions = prepareImport(parsed.data);
    return { review: reviewImport(transactions, await existingImportRows(prisma, user.id, transactions)) };
  } catch (error) {
    secureLogger.error("Import preview failed", { error });
    return { error: "Não foi possível verificar duplicadas. Sua prévia foi mantida; tente novamente." };
  }
}

const aiClassificationSchema = z.array(
  z.object({
    index: z.number().int().min(0),
    category: z.string().optional(),
    goalId: z.string().optional(),
    suggestedKeywords: z.array(z.string()).optional()
  })
);

function parseCurrency(value: string) {
  const normalized = value.replace(/\s/g, "").replace(/[R$]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseBrazilianDate(value: string) {
  const [day, month, year] = value.split("/");
  const date = `${year}-${month}-${day}`;
  if (!isCalendarDate(date)) throw new Error("Data inválida no PDF.");
  return transactionDate(date).toISOString();
}

function normalizePdfDescription(value: string) {
  return value.replace(/\s+/g, " ").replace(/^[-–—\s]+/, "").trim();
}

function toParsedPdfTransaction(date: string, description: string, rawAmount: string) {
  const amount = parseCurrency(rawAmount);
  if (!amount) return null;

  const normalizedDescription = normalizePdfDescription(description);

  return {
    date: parseBrazilianDate(date),
    description: normalizedDescription,
    amount: Math.abs(amount),
    type: amount >= 0 ? ("INCOME" as const) : ("EXPENSE" as const),
    category: categorizeDescription(normalizedDescription),
    source: "PDF"
  };
}

function parsePdfTransactions(text: string) {
  const lineTransactions = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const match = line.match(/(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-?(?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+,\d{2})$/);
      if (!match) return [];

      const transaction = toParsedPdfTransaction(match[1], match[2], match[3]);
      return transaction ? [transaction] : [];
    });

  if (lineTransactions.length > 0) return lineTransactions;

  const compactText = text.replace(/\r?\n/g, " ");
  return Array.from(
    compactText.matchAll(/(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-?(?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+,\d{2})(?=\s+\d{2}\/\d{2}\/\d{4}|\s*$)/g)
  ).flatMap((match) => {
    const transaction = toParsedPdfTransaction(match[1], match[2], match[3]);
    return transaction ? [transaction] : [];
  });
}

async function createPdfParser(file: File) {
  const { PDFParse } = await import("pdf-parse");
  return new PDFParse({ data: new Uint8Array(await file.arrayBuffer()) });
}

export async function parsePdfStatement(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Arquivo PDF não encontrado." };
  if (file.size > 6 * 1024 * 1024) return { error: "O PDF deve ter até 6 MB. Exporte em CSV/XLSX ou divida o período." };

  let parser: Awaited<ReturnType<typeof createPdfParser>> | undefined;

  try {
    parser = await createPdfParser(file);
    const result = await parser.getText();
    const transactions = parsePdfTransactions(result.text);

    if (!transactions.length) {
      return { error: "Não foi possível reconhecer transações neste PDF. Use CSV/XLSX ou crie um adaptador para o banco." };
    }

    return { transactions };
  } catch (error) {
    secureLogger.error("Import action failed", { error });
    return { error: "Não foi possível ler este PDF. Se ele for digitalizado por imagem, protegido por senha ou tiver layout fora do padrão, exporte o extrato em CSV/XLSX." };
  } finally {
    await parser?.destroy();
  }
}

function extractClassifications(value: string) {
  const cleaned = value.replace(/```json|```/gi, "").trim();
  const candidates = [cleaned];
  const objectStart = cleaned.indexOf("{");
  const objectEnd = cleaned.lastIndexOf("}");
  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");

  if (objectStart !== -1 && objectEnd > objectStart) candidates.push(cleaned.slice(objectStart, objectEnd + 1));
  if (arrayStart !== -1 && arrayEnd > arrayStart) candidates.push(cleaned.slice(arrayStart, arrayEnd + 1));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed.classifications)) return parsed.classifications;
      if (Array.isArray(parsed.transactions)) return parsed.transactions;
    } catch {
      // Try next candidate.
    }
  }

  return null;
}

function chunkTransactions<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function sanitizeAiCategoryName(value?: string) {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;

  return cleaned.slice(0, 40);
}

async function callGeminiClassifier({
  apiKey,
  model,
  categories,
  goalOptions,
  transactionChunk
}: {
  apiKey: string;
  model: string;
  categories: { name: string; keywords: string[]; color: string; icon: string }[];
  goalOptions: { id: string; name: string; markers: string[] }[];
  transactionChunk: { transaction: z.infer<typeof transactionSchema>; index: number }[];
}) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: JSON.stringify({
                  instruction:
                    "Classifique transações bancárias brasileiras. Prefira categorias existentes. Regras fortes do usuário: APLICAÇÃO RDB ou LIMITE GARANTIDO = Limite Garantido e nunca deve ter goalId; COPEL = Energia; SANEPAR/AGUA = Água; ALUGUEL = Aluguel; CONDOMINIO = Condomínio; TRANSFERÊNCIA ENVIADA PELO PIX só deve ser Pagamento Pix quando não houver sinal mais específico no texto; MP *BAKANASLANCHO = Restaurante; IFD* = iFood; AMI SERVICOS = RU UTFPR; CENTRO DE TREINAMENTOS = Academia; APPLE = Assinatura; IFOOD CLUB = Assinatura; SPOTIFY = Assinatura; TB SOLAR = Receita; QSM ou QMS = Outros. Se várias transações parecidas não couberem em nenhuma categoria existente, crie uma categoria curta e específica para agrupar esses lançamentos. Exemplos bons: Farmácia, Padaria, Banco. Não crie categoria para um único item muito específico se uma categoria existente servir. goalId só deve ser usado quando a transação representar aporte para a meta. suggestedKeywords deve conter 1 a 5 identificadores encontrados nas descrições para a categoria sugerida.",
                outputFormat: { classifications: [{ index: 0, category: "Farmácia", goalId: "id-opcional", suggestedKeywords: ["RAIA", "FARMACIA"] }] },
                categories,
                goals: goalOptions,
                transactions: transactionChunk.map(({ transaction, index }) => ({
                  index,
                  ...sanitizeTransactionForAI(transaction),
                  currentCategory: transaction.category
                }))
              })
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            classifications: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  index: { type: "INTEGER" },
                  category: { type: "STRING" },
                  goalId: { type: "STRING" },
                  suggestedKeywords: {
                    type: "ARRAY",
                    items: { type: "STRING" }
                  }
                },
                required: ["index", "category"]
              }
            }
          },
          required: ["classifications"]
        }
      }
    })
  });
}

async function callOpenRouterClassifier({
  categories,
  goalOptions,
  transactionChunk
}: {
  categories: { name: string; keywords: string[]; color: string; icon: string }[];
  goalOptions: { id: string; name: string; markers: string[] }[];
  transactionChunk: { transaction: z.infer<typeof transactionSchema>; index: number }[];
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "Fluxa"
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL ?? "openrouter/free",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Você classifica transações bancárias brasileiras. Responda apenas JSON válido no formato {\"classifications\":[{\"index\":0,\"category\":\"Farmácia\",\"goalId\":\"\",\"suggestedKeywords\":[\"RAIA\"]}]}. Use categorias existentes quando possível e crie categorias curtas quando houver grupos parecidos."
        },
        {
          role: "user",
          content: JSON.stringify({
            categories,
            goals: goalOptions,
            transactions: transactionChunk.map(({ transaction, index }) => ({
              index,
              ...sanitizeTransactionForAI(transaction),
              currentCategory: transaction.category
            }))
          })
        }
      ],
      temperature: 0,
      max_tokens: 2200
    })
  });
}

async function responseText(response: Response, provider: "gemini" | "openrouter") {
  const result = await response.json();
  if (provider === "gemini") return result?.candidates?.[0]?.content?.parts?.[0]?.text;
  return result?.choices?.[0]?.message?.content;
}

export async function classifyImportedTransactions(payload: unknown) {
  try {
    const transactions = z.array(transactionSchema).safeParse(payload);
    if (!transactions.success) return { error: "Transações inválidas para classificar com IA." };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { error: "Configure GEMINI_API_KEY para usar classificação por IA." };

    const data = isSupabaseConfigured() ? (await (await createClient()).auth.getUser()).data : { user: null };
    if (isSupabaseConfigured() && !data.user) return { error: "Faça login para classificar importações com IA." };

    const user = data.user ? await ensureUserFromAuthUser(data.user) : null;

    if (!user) return { error: "Faça login antes de classificar importações com IA." };
    const rateLimit = checkRateLimit(`ai-classify:${user.id}`, { limit: 10, windowMs: 10 * 60 * 1000 });
    if (!rateLimit.allowed) return { error: "Muitas classificações em sequência. Aguarde alguns minutos e tente novamente." };

    await ensureDefaultCategories(user.id);

  const [categories, goals] = await Promise.all([
    prisma.category.findMany({ where: { userId: user.id }, select: { name: true, keywords: true, color: true, icon: true } }),
    prisma.goal.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, markers: { select: { keyword: true } } }
    })
  ]);
  const goalIds = new Set(goals.map((goal) => goal.id));
  const model = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

  const goalOptions = goals.map((goal) => ({
    id: goal.id,
    name: goal.name,
    markers: goal.markers.map((marker) => marker.keyword)
  }));
  const allClassifications: z.infer<typeof aiClassificationSchema> = [];
  const categoryNames = new Set(categories.map((category) => category.name));
  const transactionsForAi = transactions.data
    .map((transaction, index) => ({ transaction, index }))
    .filter(({ transaction }) => !transaction.category || transaction.category === "Outros");

  if (transactionsForAi.length === 0) {
    return {
      classifications: [],
      createdCategories: [],
      skipped: transactions.data.length
    };
  }

  for (const transactionChunk of chunkTransactions(transactionsForAi, 25)) {
    let provider: "gemini" | "openrouter" = "gemini";
    let response = await callGeminiClassifier({ apiKey, model, categories, goalOptions, transactionChunk });

    if (response.status === 429) {
      const fallback = await callOpenRouterClassifier({ categories, goalOptions, transactionChunk });
      if (fallback) {
        response = fallback;
        provider = "openrouter";
      }
    }

    if (!response.ok) {
      const errorBody = await response.text();
      const quotaMessage = response.status === 429 ? "Limite gratuito da IA atingido. Aguarde alguns minutos ou troque o modelo/chave." : "A IA não respondeu agora.";
      return { error: `${quotaMessage} Detalhe: ${errorBody.slice(0, 180)}` };
    }

    const content = await responseText(response, provider);
    const parsedJson = typeof content === "string" ? extractClassifications(content) : null;
    const classifications = aiClassificationSchema.safeParse(parsedJson);

    if (!classifications.success) {
      return { error: "A IA respondeu em formato inválido. Tente novamente ou reduza a quantidade de transações na prévia." };
    }

    allClassifications.push(...classifications.data);
  }

  const createdCategories = new Map<string, string[]>();
  const normalizedExisting = new Map(Array.from(categoryNames).map((name) => [normalizeText(name), name]));

  for (const classification of allClassifications) {
    const rawName = sanitizeAiCategoryName(classification.category);
    if (!rawName) continue;

    const existingName = normalizedExisting.get(normalizeText(rawName));
    if (existingName) {
      classification.category = existingName;
      continue;
    }

    const keywords = Array.from(new Set((classification.suggestedKeywords ?? [rawName]).map((keyword) => keyword.trim().toUpperCase()).filter(Boolean))).slice(0, 5);
    const category = await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: rawName } },
      update: {
        keywords: {
          set: keywords
        }
      },
      create: {
        userId: user.id,
        name: rawName,
        color: "#94A3B8",
        icon: "Tag",
        keywords
      }
    });

    categoryNames.add(category.name);
    normalizedExisting.set(normalizeText(category.name), category.name);
    createdCategories.set(category.name, keywords);
    classification.category = category.name;
  }

    return {
      classifications: allClassifications.map((classification) => ({
        index: classification.index,
        category: classification.category && categoryNames.has(classification.category) ? classification.category : undefined,
        goalId: classification.goalId && goalIds.has(classification.goalId) ? classification.goalId : undefined
      })),
      createdCategories: Array.from(createdCategories.entries()).map(([name, keywords]) => ({ name, keywords }))
    };
  } catch (error) {
    secureLogger.error("Import action failed", { error });
    return { error: "Não foi possível classificar agora. Verifique a conexão com Supabase/Gemini e tente novamente." };
  }
}

export async function saveImportedTransactions(payload: unknown) {
  const parsed = importPayloadSchema.safeParse(payload);
  if (!parsed.success) return { error: "Confira a conta de origem, as datas e os valores antes de salvar." };
  try {
    if (!isDatabaseConfigured() || !isSupabaseConfigured()) return { error: "Entre na sua conta para salvar extratos. Nenhum dado foi gravado." };
    const { data } = await (await createClient()).auth.getUser();
    if (!data.user) return { error: "Faça login para salvar extratos no seu usuário." };
    const user = await ensureUserFromAuthUser(data.user);
    await ensureDefaultCategories(user.id);
    const incoming = prepareImport(parsed.data);

    // Read, compare, insert and link goals atomically. Retry serialization conflicts
    // so two tabs uploading the same statement cannot both insert the same rows.
    const persist = () => prisma.$transaction(async (tx) => {
      const [existing, categories, goals, markers] = await Promise.all([
        existingImportRows(tx, user.id, incoming),
        tx.category.findMany({ where: { userId: user.id } }),
        tx.goal.findMany({ where: { userId: user.id }, select: { id: true } }),
        tx.goalMarker.findMany({ where: { userId: user.id } })
      ]);
      const review = reviewImport(incoming, existing);
      const selected = review.filter((row) => row.include).map((row) => incoming[row.index]);
      const goalIds = new Set(goals.map((goal) => goal.id));
      const rules = categories.map(({ name, color, icon, keywords }) => ({ name, color, icon, keywords }));
      const records = selected.map((item) => {
        const categoryName = item.category ?? categorizeDescription(item.description, rules.length ? rules : defaultCategoryRules);
        return { id: crypto.randomUUID(), userId: user.id, categoryId: categories.find((category) => category.name === categoryName)?.id,
          date: transactionDate(item.date), description: item.description, amount: item.amount,
          type: item.type as TransactionType, source: item.source, importId: item.importId, categoryLocked: Boolean(item.categoryLocked) };
      });
      if (records.length) await tx.transaction.createMany({ data: records });
      const contributions = records.flatMap((item, index) => {
        const original = selected[index];
        if (item.type !== "EXPENSE" || isGoalContributionExcluded(item.description)) return [];
        const goalId = original.goalId && goalIds.has(original.goalId) ? original.goalId : matchGoalMarker(item.description, markers)?.goalId;
        return goalId ? [{ userId: user.id, goalId, transactionId: item.id, amount: item.amount, date: item.date }] : [];
      });
      if (contributions.length) await tx.goalContribution.createMany({ data: contributions, skipDuplicates: true });
      return { saved: records.length, skipped: incoming.length - records.length, contributions: contributions.length };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 20000 });

    let result: Awaited<ReturnType<typeof persist>> | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      try { result = await persist(); break; } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2034" || attempt === 2) throw error;
      }
    }
    if (!result) return { error: "Não foi possível salvar. Tente novamente." };
    for (const path of ["/dashboard", "/transactions", "/goals", "/planning", "/insights", "/import"]) revalidatePath(path);
    return { success: `${result.saved} transação(ões) salva(s). ${result.skipped} repetida(s) ignorada(s). ${result.contributions} aporte(s) relacionado(s) a metas.` };
  } catch (error) {
    secureLogger.error("Statement save failed", { error });
    return { error: "Não foi possível concluir a importação. A prévia foi mantida; tente novamente. A conferência de duplicadas também protege novas tentativas." };
  }
}
