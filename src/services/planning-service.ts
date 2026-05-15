import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/services/finance-data-service";

const essentialCategories = new Set(["iFood", "RU UTFPR", "Restaurante", "Mercado", "Transporte", "Combustível", "Moradia", "Energia", "Água", "Aluguel", "Condomínio"]);

function groupCategory(categoryName: string) {
  if (essentialCategories.has(categoryName)) return "needs" as const;
  return "wants" as const;
}

export async function getPlanningOverview(date = new Date()) {
  const userId = await getCurrentUserId();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  if (!userId) {
    return {
      month,
      year,
      plan: null,
      actualIncome: 0,
      groups: [
        { key: "needs" as const, name: "Necessidades", planned: 0, actual: 0, percent: 0 },
        { key: "wants" as const, name: "Desejos", planned: 0, actual: 0, percent: 0 },
        { key: "savings" as const, name: "Metas e reserva", planned: 0, actual: 0, percent: 0 }
      ]
    };
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const [plan, transactions, contributions] = await Promise.all([
    prisma.spendingPlan.findUnique({ where: { userId_month_year: { userId, month, year } } }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      include: { category: true, goalContributions: true }
    }),
    prisma.goalContribution.findMany({
      where: { userId, date: { gte: start, lt: end } },
      select: { amount: true, transactionId: true }
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

  transactions
    .filter((transaction) => transaction.type === "EXPENSE" && !savingsTransactionIds.has(transaction.id))
    .forEach((transaction) => {
      const group = groupCategory(transaction.category?.name ?? "Outros");
      actual[group] += Number(transaction.amount);
    });

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
    ]
  };
}
