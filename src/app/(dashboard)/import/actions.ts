"use server";

import { TransactionType } from "@prisma/client";
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

const transactionSchema = z.object({
  date: z.string(),
  description: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().optional(),
  categoryLocked: z.boolean().optional(),
  goalId: z.string().optional(),
  source: z.string().optional()
});

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
  const [day, month, year] = value.split("/").map(Number);
  return new Date(year, month - 1, day).toISOString();
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

    const user = data.user
      ? await prisma.user.upsert({
          where: { supabaseId: data.user.id },
          update: { email: data.user.email ?? "sem-email@local" },
          create: {
            supabaseId: data.user.id,
            email: data.user.email ?? "sem-email@local",
            name: data.user.user_metadata?.name
          }
        })
      : null;

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
  const transactions = z.array(transactionSchema).safeParse(payload);
  if (!transactions.success) return { error: "Arquivo inválido ou sem transações reconhecidas." };

  if (!isDatabaseConfigured()) {
    return {
      success: `${transactions.data.length} transações processadas em modo demo. Configure DATABASE_URL para salvar no PostgreSQL.`
    };
  }

  const data = isSupabaseConfigured() ? (await (await createClient()).auth.getUser()).data : { user: null };

  if (isSupabaseConfigured() && !data.user) {
    return { error: "Faça login para salvar extratos no seu usuário." };
  }

  const user = data.user
    ? await prisma.user.upsert({
        where: { supabaseId: data.user.id },
        update: { email: data.user.email ?? "sem-email@local" },
        create: {
          supabaseId: data.user.id,
          email: data.user.email ?? "sem-email@local",
          name: data.user.user_metadata?.name
        }
      })
    : null;

  if (!user) return { error: "Configure o banco e faça login antes de salvar importações." };

  await ensureDefaultCategories(user.id);

  const categories = await prisma.category.findMany({ where: { userId: user.id } });
  const goals = await prisma.goal.findMany({ where: { userId: user.id }, select: { id: true } });
  const goalIds = new Set(goals.map((goal) => goal.id));
  const goalMarkers = await prisma.goalMarker.findMany({ where: { userId: user.id } });
  const rules = categories.map((category) => ({
    name: category.name,
    color: category.color,
    icon: category.icon,
    keywords: category.keywords
  }));
  const importId = crypto.randomUUID();

  const savedTransactions = await prisma.$transaction(
    transactions.data.map((transaction) => {
      const categoryByTag = categorizeDescription(transaction.description, rules.length ? rules : defaultCategoryRules);
      const categoryName = transaction.category ?? (categoryByTag !== "Outros" ? categoryByTag : "Outros");

      return prisma.transaction.create({
        data: {
          userId: user.id,
          categoryId: categories.find((category) => category.name === categoryName)?.id,
          date: new Date(transaction.date),
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type as TransactionType,
          source: transaction.source ?? "Upload",
          importId,
          categoryLocked: Boolean(transaction.categoryLocked)
        }
      });
    })
  );

  const contributions = savedTransactions.flatMap((transaction, index) => {
    const originalTransaction = transactions.data[index];
    const marker = matchGoalMarker(transaction.description, goalMarkers);
    const goalId = !isGoalContributionExcluded(transaction.description) && originalTransaction?.goalId && goalIds.has(originalTransaction.goalId)
      ? originalTransaction.goalId
      : marker?.goalId;

    if (!goalId || transaction.type !== TransactionType.EXPENSE) return [];

    return {
      userId: user.id,
      goalId,
      transactionId: transaction.id,
      amount: transaction.amount,
      date: transaction.date
    };
  });

  if (contributions.length > 0) {
    await prisma.goalContribution.createMany({
      data: contributions,
      skipDuplicates: true
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/goals");
  revalidatePath("/planning");
  revalidatePath("/insights");
  revalidatePath("/import");
  return { success: `${transactions.data.length} transações importadas. ${contributions.length} aporte(s) relacionado(s) a metas.` };
}
