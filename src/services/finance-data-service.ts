import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { normalizeText } from "@/lib/utils";
import { defaultCategoryRules } from "@/services/category-service";
import { cache } from "react";
import type { ParsedTransaction } from "@/types/finance";
import type { PeriodRange } from "@/utils/period";

export const getCurrentUserId = cache(async () => {
  if (!isDatabaseConfigured()) return null;

  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { supabaseId: data.user.id },
              { email: data.user.email ?? "sem-email@local" }
            ]
          }
        });

        if (existingUser) {
          const nextEmail = data.user.email ?? existingUser.email;
          const nextName = data.user.user_metadata?.name ?? existingUser.name;
          const needsUpdate = existingUser.supabaseId !== data.user.id || existingUser.email !== nextEmail || existingUser.name !== nextName;

          if (!needsUpdate) return existingUser.id;

          const user = await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                supabaseId: data.user.id,
                email: nextEmail,
                name: nextName
              }
            });

          return user.id;
        }

        const user = await prisma.user.create({
          data: {
            supabaseId: data.user.id,
            email: data.user.email ?? "sem-email@local",
            name: data.user.user_metadata?.name
          }
        });

        await ensureDefaultCategories(user.id);

        return user.id;
      }

      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }

  return null;
});

export async function ensureDefaultCategories(userId: string) {
  const existingCategories = await prisma.category.findMany({
    where: { userId },
    select: { name: true }
  });
  const existingNames = new Set(existingCategories.map((category) => category.name));

  await Promise.all(
    defaultCategoryRules
      .filter((category) => !existingNames.has(category.name))
      .map((category) => prisma.category.create({ data: { ...category, userId } }))
  );

  const transportRule = defaultCategoryRules.find((category) => category.name === "Transporte");
  const transportCategory = await prisma.category.findUnique({
    where: { userId_name: { userId, name: "Transporte" } },
    select: { id: true, keywords: true }
  });

  if (transportRule && transportCategory?.keywords.some((keyword) => normalizeText(keyword) === "99")) {
    const keywords = Array.from(new Set([
      ...transportCategory.keywords.filter((keyword) => normalizeText(keyword) !== "99"),
      ...transportRule.keywords
    ]));

    await prisma.category.update({
      where: { id: transportCategory.id },
      data: { keywords }
    });
  }
}

export async function getTransactionsForCurrentUser(options?: { limit?: number; period?: PeriodRange }): Promise<ParsedTransaction[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      ...(options?.period
        ? {
            date: {
              gte: options.period.start,
              lte: options.period.end
            }
          }
        : {})
    },
    include: { category: true },
    orderBy: { date: "desc" },
    take: options?.limit
  });

  return transactions.map((transaction) => ({
    id: transaction.id,
    date: transaction.date.toISOString(),
    description: transaction.description,
    amount: Number(transaction.amount),
    type: transaction.type,
    category: transaction.category?.name ?? "Outros",
    source: transaction.source ?? undefined,
    importId: transaction.importId ?? undefined
  }));
}

export async function getDashboardTransactions(period: PeriodRange) {
  const transactions = await getTransactionsForCurrentUser({ period });
  return transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getCurrentBalanceUntil(end: Date) {
  const userId = await getCurrentUserId();
  if (!userId) return 0;

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { lte: end }
    },
    select: {
      amount: true,
      type: true
    }
  });

  return transactions.reduce((balance, transaction) => {
    const amount = Number(transaction.amount);
    return transaction.type === "INCOME" ? balance + amount : balance - amount;
  }, 0);
}

export async function getGoalsForCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  return prisma.goal.findMany({
    where: { userId },
    include: {
      markers: true,
      contributions: true
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getCategoriesForCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" }
  });

  if (categories.length > 0) return categories;

  await ensureDefaultCategories(userId);
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" }
  });
}
