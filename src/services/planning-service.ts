import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/utils";
import { salaryAdvanceCredits } from "@/services/dashboard-service";
import { getCurrentUserId } from "@/services/finance-data-service";

const hiddenPlanningCategories = new Set(["RECEITA", "SALARIO"]);
const fixedPlanningCategories = new Set(["ALUGUEL", "ENERGIA", "AGUA", "CONDOMINIO", "ACADEMIA", "ASSINATURA"]);

function categoryKey(categoryName: string) {
  return normalizeText(categoryName);
}

function inferLimitType(categoryName: string) {
  const key = categoryKey(categoryName);

  if (fixedPlanningCategories.has(key)) return "FIXED" as const;
  return "VARIABLE" as const;
}

function groupCategoryByLimit(type?: "FIXED" | "VARIABLE" | "GOAL", categoryName?: string | null) {
  if (type === "FIXED") return "needs" as const;
  if (!type && categoryName && inferLimitType(categoryName) === "FIXED") return "needs" as const;
  return "wants" as const;
}

function emptyOverview(month: number, year: number) {
  const selectedMonth = new Date(year, month - 1, 1);

  return {
    month,
    year,
    monthLabel: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(selectedMonth),
    planSource: null,
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
    },
    paymentPlan: {
      fixedPlanned: 0,
      variablePlanned: 0,
      totalPlanned: 0,
      paid: 0,
      remaining: 0,
      availableForGoals: 0
    },
    plannedItems: [],
    goals: [],
    nextMonthImpact: {
      monthLabel: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(selectedMonth),
      baseIncome: 0,
      salaryAdvanceTotal: 0,
      salaryAdvanceCount: 0,
      adjustedIncome: 0,
      plannedExpenses: 0,
      plannedCount: 0,
      leftoverAfterPlanned: 0,
      hasSalaryAdvance: false
    }
  };
}

async function findPreviousPlan(userId: string, month: number, year: number) {
  return prisma.spendingPlan.findFirst({
    where: {
      userId,
      OR: [{ year: { lt: year } }, { year, month: { lt: month } }]
    },
    orderBy: [{ year: "desc" }, { month: "desc" }]
  });
}

async function findPreviousLimitPeriod(userId: string, month: number, year: number) {
  const latestLimit = await prisma.categoryLimit.findFirst({
    where: {
      userId,
      OR: [{ year: { lt: year } }, { year, month: { lt: month } }]
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { month: true, year: true }
  });

  if (!latestLimit) return { limits: [], source: null as string | null };

  const limits = await prisma.categoryLimit.findMany({
    where: { userId, month: latestLimit.month, year: latestLimit.year },
    select: { categoryId: true, amount: true, type: true }
  });

  const source = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(latestLimit.year, latestLimit.month - 1, 1));

  return { limits, source };
}

async function findPreviousPlannedExpensePeriod(userId: string, month: number, year: number) {
  const latestExpense = await prisma.plannedExpense.findFirst({
    where: {
      userId,
      amount: { gt: 0 },
      OR: [{ year: { lt: year } }, { year, month: { lt: month } }]
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { month: true, year: true }
  });

  if (!latestExpense) return { expenses: [], source: null as string | null };

  const expenses = await prisma.plannedExpense.findMany({
    where: { userId, month: latestExpense.month, year: latestExpense.year },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, amount: true, type: true, note: true, month: true, year: true }
  });

  const source = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(latestExpense.year, latestExpense.month - 1, 1));

  return { expenses, source };
}

export async function getPlanningOverview(date = new Date()) {
  const userId = await getCurrentUserId();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  if (!userId) return emptyOverview(month, year);

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const previousStart = new Date(year, month - 2, 1);
  const previousEnd = new Date(year, month - 1, 1);
  const [plan, fallbackPlan, transactions, previousTransactions, contributions, categories, limits, fallbackLimitPeriod, plannedExpenses, fallbackPlannedExpensePeriod, goals] = await Promise.all([
    prisma.spendingPlan.findUnique({ where: { userId_month_year: { userId, month, year } } }),
    findPreviousPlan(userId, month, year),
    prisma.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      include: { category: true }
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: previousStart, lt: previousEnd } },
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
    }),
    findPreviousLimitPeriod(userId, month, year),
    prisma.plannedExpense.findMany({
      where: { userId, month, year },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, amount: true, type: true, note: true, month: true, year: true }
    }),
    findPreviousPlannedExpensePeriod(userId, month, year),
    prisma.goal.findMany({
      where: { userId, status: "ACTIVE" },
      include: { contributions: true },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const actualIncome = transactions.filter((transaction) => transaction.type === "INCOME").reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const salaryAdvance = salaryAdvanceCredits(
    previousTransactions.map((transaction) => ({
      date: transaction.date.toISOString(),
      description: transaction.description,
      amount: Number(transaction.amount),
      type: transaction.type,
      category: transaction.category?.name,
      source: transaction.source ?? undefined
    }))
  );
  const effectivePlan = plan ?? fallbackPlan;
  const monthlyIncome = effectivePlan ? Number(effectivePlan.monthlyIncome) : actualIncome;
  const needsPercent = effectivePlan?.needsPercent ?? 50;
  const wantsPercent = effectivePlan?.wantsPercent ?? 30;
  const savingsPercent = effectivePlan?.savingsPercent ?? 20;
  const savingsTransactionIds = new Set(contributions.map((contribution) => contribution.transactionId));
  const actual = {
    needs: 0,
    wants: 0,
    savings: contributions.reduce((sum, contribution) => sum + Number(contribution.amount), 0)
  };
  const actualByCategory = new Map<string, number>();
  const limitByCategory = new Map(limits.map((limit) => [limit.categoryId, limit]));
  const fallbackLimitByCategory = new Map(fallbackLimitPeriod.limits.map((limit) => [limit.categoryId, limit]));

  transactions
    .filter((transaction) => transaction.type === "EXPENSE")
    .forEach((transaction) => {
      const amount = Number(transaction.amount);
      if (transaction.categoryId) {
        actualByCategory.set(transaction.categoryId, (actualByCategory.get(transaction.categoryId) ?? 0) + amount);
      }

      if (!savingsTransactionIds.has(transaction.id)) {
        const group = groupCategoryByLimit(
          transaction.categoryId ? (limitByCategory.get(transaction.categoryId) ?? fallbackLimitByCategory.get(transaction.categoryId))?.type : undefined,
          transaction.category?.name
        );
        actual[group] += amount;
      }
    });

  const categoryLimits = categories
    .filter((category) => !hiddenPlanningCategories.has(categoryKey(category.name)))
    .map((category) => {
      const limit = limitByCategory.get(category.id);
      const fallbackLimit = fallbackLimitByCategory.get(category.id);
      const effectiveLimit = limit ?? fallbackLimit;
      const planned = Number(effectiveLimit?.amount ?? 0);
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
        type: effectiveLimit?.type ?? inferLimitType(category.name)
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
  const plannedNextMonthLimits = categoryLimits.filter((item) => item.planned > 0);
  const currentPlannedExpenseByName = new Map(plannedExpenses.map((item) => [normalizeText(item.name), item]));
  const effectivePlannedExpenses = [
    ...fallbackPlannedExpensePeriod.expenses.filter((item) => !currentPlannedExpenseByName.has(normalizeText(item.name))),
    ...plannedExpenses
  ].filter((item) => Number(item.amount) > 0);
  const plannedExpenseItems = effectivePlannedExpenses.map((item) => ({
    id: item.id,
    name: item.name,
    planned: Number(item.amount),
    actual: 0,
    difference: Number(item.amount),
    usage: 0,
    type: item.type === "FIXED" ? ("FIXED" as const) : ("VARIABLE" as const),
    source: "manual" as const,
    sourceMonth: item.month,
    sourceYear: item.year,
    inherited: item.month !== month || item.year !== year,
    note: item.note ?? undefined
  }));
  const plannedCategoryItems = plannedNextMonthLimits.map((item) => ({
    id: item.categoryId,
    name: item.categoryName,
    planned: item.planned,
    actual: item.actual,
    difference: item.difference,
    usage: item.usage,
    type: item.type === "FIXED" ? ("FIXED" as const) : ("VARIABLE" as const),
    source: "category" as const,
    sourceMonth: month,
    sourceYear: year,
    inherited: false,
    note: undefined
  }));
  const plannedItems = [...plannedCategoryItems, ...plannedExpenseItems];
  const plannedExpensesTotal = plannedItems.reduce((sum, item) => sum + item.planned, 0);
  const adjustedIncome = Math.max(0, monthlyIncome - salaryAdvance.total);
  const fixedPlanned = plannedItems.filter((item) => item.type === "FIXED").reduce((sum, item) => sum + item.planned, 0);
  const variablePlanned = plannedItems.filter((item) => item.type !== "FIXED").reduce((sum, item) => sum + item.planned, 0);
  const availableForGoals = adjustedIncome - fixedPlanned - variablePlanned;
  const selectedMonth = new Date(year, month - 1, 1);
  const planSource = plan
    ? "salvo neste mes"
    : fallbackPlan
      ? `copiado de ${new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(fallbackPlan.year, fallbackPlan.month - 1, 1))}`
      : fallbackLimitPeriod.source || fallbackPlannedExpensePeriod.source
        ? `copiado de ${fallbackLimitPeriod.source ?? fallbackPlannedExpensePeriod.source}`
        : null;

  return {
    month,
    year,
    monthLabel: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(selectedMonth),
    planSource,
    plan: effectivePlan
      ? {
          id: effectivePlan.id,
          monthlyIncome,
          model: effectivePlan.model,
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
    limitSummary,
    paymentPlan: {
      fixedPlanned,
      variablePlanned,
      totalPlanned: plannedExpensesTotal,
      paid: plannedItems.reduce((sum, item) => sum + item.actual, 0),
      remaining: plannedItems.reduce((sum, item) => sum + Math.max(0, item.planned - item.actual), 0),
      availableForGoals
    },
    plannedItems,
    goals: goals.map((goal) => {
      const contributedAmount = goal.contributions.reduce((sum, contribution) => sum + Number(contribution.amount), 0);
      const savedAmount = Number(goal.currentAmount) + contributedAmount;

      return {
        id: goal.id,
        name: goal.name,
        targetAmount: Number(goal.targetAmount),
        savedAmount,
        remainingAmount: Math.max(0, Number(goal.targetAmount) - savedAmount)
      };
    }),
    nextMonthImpact: {
      monthLabel: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(selectedMonth),
      baseIncome: monthlyIncome,
      salaryAdvanceTotal: salaryAdvance.total,
      salaryAdvanceCount: salaryAdvance.count,
      adjustedIncome,
      plannedExpenses: plannedExpensesTotal,
      plannedCount: plannedItems.length,
      leftoverAfterPlanned: adjustedIncome - plannedExpensesTotal,
      hasSalaryAdvance: salaryAdvance.total > 0
    }
  };
}
