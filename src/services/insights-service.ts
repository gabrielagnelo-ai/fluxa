import { prisma } from "@/lib/prisma";
import { secureLogger } from "@/lib/security/logger";
import { redact } from "@/lib/security/redaction";
import { formatCurrency } from "@/lib/utils";
import { creditOrigins } from "@/services/dashboard-service";
import { getCurrentUserId } from "@/services/finance-data-service";
import { getPlanningOverview } from "@/services/planning-service";
import { getPeriodLabel, type PeriodRange } from "@/utils/period";

type InsightContext = {
  periodLabel: string;
  income: number;
  expenses: number;
  net: number;
  categoryExpenses: { category: string; amount: number }[];
  creditOrigins: { name: string; amount: number; count: number; share: number; recurring: boolean }[];
  planningGroups: { name: string; planned: number; actual: number; percent: number }[];
  goals: { name: string; targetAmount: number; contributedAmount: number; progress: number }[];
};

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "danger" | "success";
};

export async function getInsightContext(period: PeriodRange): Promise<InsightContext> {
  const userId = await getCurrentUserId();
  const label = getPeriodLabel(period);
  const emptyContext = {
    periodLabel: label,
    income: 0,
    expenses: 0,
    net: 0,
    categoryExpenses: [],
    creditOrigins: [],
    planningGroups: [],
    goals: []
  };

  if (!userId) {
    return emptyContext;
  }

  try {
    const [transactions, goals, planning] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId, date: { gte: period.start, lte: period.end } },
        include: { category: true }
      }),
      prisma.goal.findMany({
        where: { userId },
        include: {
          contributions: {
            where: { date: { gte: period.start, lte: period.end } }
          }
        }
      }),
      getPlanningOverview(period.start)
    ]);

    const income = transactions.filter((transaction) => transaction.type === "INCOME").reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const expenses = transactions.filter((transaction) => transaction.type === "EXPENSE").reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const categoryMap = new Map<string, number>();

    transactions
      .filter((transaction) => transaction.type === "EXPENSE")
      .forEach((transaction) => {
        const name = transaction.category?.name ?? "Outros";
        categoryMap.set(name, (categoryMap.get(name) ?? 0) + Number(transaction.amount));
      });

    return {
      periodLabel: label,
      income,
      expenses,
      net: income - expenses,
      categoryExpenses: Array.from(categoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
      creditOrigins: creditOrigins(transactions.map((transaction) => ({
        id: transaction.id,
        date: transaction.date.toISOString(),
        description: String(redact(transaction.description)),
        amount: Number(transaction.amount),
        type: transaction.type,
        category: transaction.category?.name ?? "Outros"
      }))),
      planningGroups: planning.groups,
      goals: goals.map((goal) => {
        const targetAmount = Number(goal.targetAmount);
        const contributedAmount = goal.contributions.reduce((sum, contribution) => sum + Number(contribution.amount), 0);
        const progress = targetAmount > 0 ? Math.min(100, Math.round((contributedAmount / targetAmount) * 100)) : 0;

        return {
          name: goal.name,
          targetAmount,
          contributedAmount,
          progress
        };
      })
    };
  } catch (error) {
    secureLogger.error("Insight context failed", { error });
    return emptyContext;
  }
}

export function buildLocalInsights(context: InsightContext) {
  const topCategory = context.categoryExpenses[0];
  const topCreditOrigin = context.creditOrigins[0];
  const lines = [
    `Análise do período ${context.periodLabel}: receitas de ${formatCurrency(context.income)}, despesas de ${formatCurrency(context.expenses)} e saldo líquido de ${formatCurrency(context.net)}.`
  ];

  if (topCategory) {
    lines.push(`A maior concentração de gastos está em ${topCategory.category}, com ${formatCurrency(topCategory.amount)} no período.`);
  }

  if (topCreditOrigin) {
    lines.push(`A principal origem de crédito foi ${topCreditOrigin.name}, representando ${topCreditOrigin.share}% das entradas do período.`);
  }

  const overBudget = context.planningGroups.filter((group) => group.planned > 0 && group.actual > group.planned);
  if (overBudget.length > 0) {
    lines.push(`Atenção para ${overBudget.map((group) => group.name).join(", ")}: o gasto real passou do limite recomendado.`);
  } else if (context.planningGroups.length > 0) {
    lines.push("Nenhum grupo do planejamento passou do limite recomendado até agora.");
  }

  const activeGoal = [...context.goals].sort((a, b) => b.progress - a.progress)[0];
  if (activeGoal) {
    lines.push(`Meta mais avançada: ${activeGoal.name}, com ${activeGoal.progress}% concluído por aportes identificados.`);
  }

  return lines.join("\n\n");
}

export function buildNotifications(context: InsightContext): NotificationItem[] {
  const notifications: NotificationItem[] = [];

  if (context.net < 0) {
    notifications.push({
      id: "negative-net",
      title: "Despesas acima das receitas",
      description: `O saldo líquido do período está em ${formatCurrency(context.net)}.`,
      severity: "danger"
    });
  }

  context.planningGroups.forEach((group) => {
    if (group.planned <= 0) return;
    const usage = Math.round((group.actual / group.planned) * 100);
    if (usage >= 100) {
      notifications.push({
        id: `budget-${group.name}`,
        title: `${group.name} passou do limite`,
        description: `${usage}% do limite recomendado já foi usado.`,
        severity: "warning"
      });
    } else if (usage >= 80) {
      notifications.push({
        id: `budget-near-${group.name}`,
        title: `${group.name} perto do limite`,
        description: `${usage}% do limite recomendado já foi usado.`,
        severity: "info"
      });
    }
  });

  context.goals
    .filter((goal) => goal.contributedAmount > 0)
    .forEach((goal) => {
      notifications.push({
        id: `goal-${goal.name}`,
        title: `Aporte relacionado: ${goal.name}`,
        description: `${formatCurrency(goal.contributedAmount)} identificados, ${goal.progress}% da meta.`,
        severity: goal.progress >= 100 ? "success" : "info"
      });
    });

  if (notifications.length === 0) {
    notifications.push({
      id: "no-alerts",
      title: "Nenhum alerta crítico",
      description: "Os dados atuais não indicam estouro de orçamento ou saldo mensal negativo.",
      severity: "success"
    });
  }

  return notifications;
}

export async function generateAiInsights(context: InsightContext) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

  if (!apiKey) {
    return {
      provider: "local",
      text: buildLocalInsights(context)
    };
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
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
              text: `Você é um analista financeiro pessoal. Analise exatamente o mesmo fluxo financeiro definido no dashboard: período filtrado, receitas, despesas, saldo líquido, origens de crédito, categorias, planejamento e metas. Responda em português do Brasil, de forma objetiva e completa, sem prometer rentabilidade. Use apenas os dados agregados fornecidos. Estruture em: Resumo executivo, Entradas de crédito, Fluxo do período, Categorias, Planejamento, Metas, Recomendações práticas e Próximos passos. Na seção Entradas de crédito, avalie concentração, recorrência provável e dependência de poucas fontes. Termine a resposta com a frase "Fim da análise."\n\nDados agregados:\n${JSON.stringify(context)}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096
      }
    })
  });

  if (!response.ok) {
    return {
      provider: "local",
      text: `${buildLocalInsights(context)}\n\nA IA externa não respondeu agora. Verifique a chave GEMINI_API_KEY ou limite do modelo.`
    };
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];
  const text = Array.isArray(candidate?.content?.parts)
    ? candidate.content.parts.map((part: { text?: string }) => part.text ?? "").join("\n")
    : "";
  const truncated = candidate?.finishReason === "MAX_TOKENS";

  return {
    provider: "gemini",
    text: typeof text === "string" && text.trim()
      ? `${text}${truncated ? "\n\nA resposta foi interrompida pelo limite do modelo. Gere novamente para uma versão mais curta ou aumente o limite de saída." : ""}`
      : buildLocalInsights(context)
  };
}
