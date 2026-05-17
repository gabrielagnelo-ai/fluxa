import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/utils";
import { getCurrentUserId } from "@/services/finance-data-service";

const hiddenPlanningCategories = new Set(["RECEITA", "SALARIO"]);
const fixedPlanningCategories = new Set(["ALUGUEL", "ENERGIA", "AGUA", "CONDOMINIO", "ACADEMIA", "ASSINATURA"]);
const goalPlanningCategories = new Set(["RESERVA", "META", "INVESTIMENTO", "METAS E RESERVA"]);

function categoryKey(categoryName: string) {
  return normalizeText(categoryName);
}

function inferLimitType(categoryName: string) {
  const key = categoryKey(categoryName);

  if (fixedPlanningCategories.has(key)) return "FIXED" as const;
  if (goalPlanningCategories.has(key) || key.includes("META") || key.includes("RESERVA")) return "GOAL" as const;
  return "VARIABLE" as const;
}

function groupCategoryByLimit(type?: "FIXED" | "VARIABLE" | "GOAL") {
  if (type === "FIXED") return "needs" as const;
  return "wants" as const;
}

function emptyOverview(month: number, year: number) {
  return {
    month,
    year,
    plan: null,
    actualIncome: 0,
    groups: [
      { key: "needs" as const, name: "Necessidades", planned: 0, actual: 0, percent: 0 },
      { key: "wants" as const, name: "Desejos", planned: 0, actual: 0, percent: 0 },
      { key: "savings" as const, name: "Metas e reserva", planned: 0, actual: 0, percent: 0 }
    ],
    categoryLimits: [],
    limitSummary: {
      plannedTotal: 0,
      actualWithLimit: 0,
      difference: 0,
      overLimitCount: 0,
      plannedCount: 0,
      spentCount: 0
    }
  };
}

export async function getPlanningOverview(date = new Date()) {
  const userId = await getCurrentUserId();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  if (!userId) return emptyOverview(month, year);

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const [plan, transactions, contributions, categories, limits] = await Promise.all([
    prisma.spendingPlan.findUnique({ where: { userId_month_year: { userId, month, year } } }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      include: { category: true }
    }),
    prisma.goalContribution.findMany({
      where: { userId, date: { gte: start, lt: end } },
      select: { amount: true, transactionId: true }
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    prisma.categoryLimit.findMany({
      where: { userId, month, year },
      select: { categoryId: true, amount: true, type: true }
    })
  ]);

  const actualIncome = transactions.filter((transaction) => transaction.type === "INCOME").reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const monthlyIncome = plan ? Number(plan.monthlyIncome) : actualIncome;
  const needsPercent = plan?.needsPercent ?? 50;
  const wantsPercent = plan?.wantsPercent ?? 30;
  const savingsPercent = plan?.savingsPercent ?? 20;
  const savingsTransactionIds = new Set(contributions.map((contribution) => contribution.transactionId));
  const actual = {
    needs: 0,
    wants: 0,
    savings: contributions.reduce((sum, contribution) => sum + Number(contribution.amount), 0)
  };
  const actualByCategory = new Map<string, number>();
  const limitByCategory = new Map(limits.map((limit) => [limit.categoryId, limit]));

  transactions
    .filter((transaction) => transaction.type === "EXPENSE")
    .forEach((transaction) => {
      const amount = Number(transaction.amount);
      if (transaction.categoryId) {
        actualByCategory.set(transaction.categoryId, (actualByCategory.get(transaction.categoryId) ?? 0) + amount);
      }

      if (!savingsTransactionIds.has(transaction.id)) {
        const group = groupCategoryByLimit(transaction.categoryId ? limitByCategory.get(transaction.categoryId)?.type : undefined);
        actual[group] += amount;
      }
    });

  const categoryLimits = categories
    .filter((category) => !hiddenPlanningCategories.has(categoryKey(category.name)))
    .map((category) => {
      const limit = limitByCategory.get(category.id);
      const planned = Number(limit?.amount ?? 0);
      const actualAmount = actualByCategory.get(category.id) ?? 0;
      const difference = planned - actualAmount;
      const usage = planned > 0 ? Math.round((actualAmount / planned) * 100) : 0;

      return {
        categoryId: category.id,
        categoryName: category.name,
        planned,
        actual: actualAmount,
        difference,
        usage,
        type: limit?.type ?? inferLimitType(category.name)
      };
    });
  const plannedLimits = categoryLimits.filter((item) => item.planned > 0);
  const limitSummary = {
    plannedTotal: plannedLimits.reduce((sum, item) => sum + item.planned, 0),
    actualWithLimit: plannedLimits.reduce((sum, item) => sum + item.actual, 0),
    difference: plannedLimits.reduce((sum, item) => sum + item.difference, 0),
    overLimitCount: plannedLimits.filter((item) => item.actual > item.planned).length,
    plannedCount: plannedLimits.length,
    spentCount: categoryLimits.filter((item) => item.actual > 0).length
  };

  return {
    month,
    year,
    plan: plan
      ? {
          id: plan.id,
          monthlyIncome,
          model: plan.model,
          needsPercent,
          wantsPercent,
          savingsPercent
        }
      : null,
    actualIncome,
    groups: [
      {
        key: "needs" as const,
        name: "Necessidades",
        planned: (monthlyIncome * needsPercent) / 100,
        actual: actual.needs,
        percent: needsPercent
      },
      {
        key: "wants" as const,
        name: "Desejos",
        planned: (monthlyIncome * wantsPercent) / 100,
        actual: actual.wants,
        percent: wantsPercent
      },
      {
        key: "savings" as const,
        name: "Metas e reserva",
        planned: (monthlyIncome * savingsPercent) / 100,
        actual: actual.savings,
        percent: savingsPercent
      }
    ],
    categoryLimits,
    limitSummary
  };
}
