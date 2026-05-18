"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { economicModels } from "@/constants/economic-models";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/services/finance-data-service";

const planSchema = z
  .object({
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2020).max(2100),
    monthlyIncome: z.coerce.number().min(0, "Informe uma renda mensal válida."),
    model: z.string().min(1),
    needsPercent: z.coerce.number().int().min(0).max(100),
    wantsPercent: z.coerce.number().int().min(0).max(100),
    savingsPercent: z.coerce.number().int().min(0).max(100)
  })
  .refine((data) => data.needsPercent + data.wantsPercent + data.savingsPercent === 100, {
    message: "A soma dos percentuais precisa ser 100%."
  });

export async function upsertSpendingPlan(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const preset = economicModels.find((model) => model.id === raw.model);
  const parsed = planSchema.safeParse({
    ...raw,
    needsPercent: raw.model === "custom" ? raw.needsPercent : preset?.needsPercent,
    wantsPercent: raw.model === "custom" ? raw.wantsPercent : preset?.wantsPercent,
    savingsPercent: raw.model === "custom" ? raw.savingsPercent : preset?.savingsPercent
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para salvar seu planejamento." };

  await prisma.spendingPlan.upsert({
    where: {
      userId_month_year: {
        userId,
        month: parsed.data.month,
        year: parsed.data.year
      }
    },
    update: {
      monthlyIncome: parsed.data.monthlyIncome,
      model: parsed.data.model,
      needsPercent: parsed.data.needsPercent,
      wantsPercent: parsed.data.wantsPercent,
      savingsPercent: parsed.data.savingsPercent
    },
    create: {
      userId,
      month: parsed.data.month,
      year: parsed.data.year,
      monthlyIncome: parsed.data.monthlyIncome,
      model: parsed.data.model,
      needsPercent: parsed.data.needsPercent,
      wantsPercent: parsed.data.wantsPercent,
      savingsPercent: parsed.data.savingsPercent
    }
  });

  revalidatePath("/planning");
  revalidatePath("/dashboard");
  return { success: "Planejamento salvo." };
}

const limitTypeSchema = z.enum(["FIXED", "VARIABLE"]);

function parseMoneyInput(value: string) {
  const cleaned = value
    .trim()
    .replace(/\s/g, "")
    .replace(/[R$]/g, "");

  let normalized = cleaned;

  if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(",", ".");
  } else if ((cleaned.match(/\./g) ?? []).length > 1 || /^\d+\.\d{3}$/.test(cleaned)) {
    normalized = cleaned.replace(/\./g, "");
  }

  if (!normalized) return 0;
  return Number(normalized);
}

async function persistCategoryLimit({
  userId,
  categoryId,
  month,
  year,
  amount,
  type
}: {
  userId: string;
  categoryId: string;
  month: number;
  year: number;
  amount: number;
  type: "FIXED" | "VARIABLE";
}) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true }
  });

  if (!category) return { error: "Categoria inválida." };

  if (amount === 0) {
    await prisma.categoryLimit.deleteMany({
      where: { userId, categoryId, month, year }
    });
    return { success: "Limite removido." };
  }

  await prisma.categoryLimit.upsert({
    where: {
      userId_categoryId_month_year: {
        userId,
        categoryId,
        month,
        year
      }
    },
    update: {
      amount,
      type
    },
    create: {
      userId,
      categoryId,
      month,
      year,
      amount,
      type
    }
  });

  return { success: "Limite salvo." };
}

const singleLimitSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  categoryId: z.string().min(1),
  amount: z.string(),
  type: limitTypeSchema
});

export async function saveCategoryLimit(input: z.input<typeof singleLimitSchema>) {
  const parsed = singleLimitSchema.safeParse(input);
  if (!parsed.success) return { error: "Limite inválido." };

  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para salvar limites." };

  const amount = parseMoneyInput(parsed.data.amount);
  if (!Number.isFinite(amount) || amount < 0) return { error: "Informe um valor válido." };

  const result = await persistCategoryLimit({
    userId,
    categoryId: parsed.data.categoryId,
    month: parsed.data.month,
    year: parsed.data.year,
    amount,
    type: parsed.data.type
  });

  revalidatePath("/planning");
  revalidatePath("/dashboard");
  revalidatePath("/insights");
  return result;
}

export async function saveCategoryLimits(formData: FormData) {
  const month = z.coerce.number().int().min(1).max(12).safeParse(formData.get("month"));
  const year = z.coerce.number().int().min(2020).max(2100).safeParse(formData.get("year"));
  const categoryIds = formData.getAll("categoryId").map(String);
  const amounts = formData.getAll("amount").map(String);
  const types = formData.getAll("type").map(String);

  if (!month.success || !year.success) return { error: "Período inválido." };
  if (categoryIds.length !== amounts.length || categoryIds.length !== types.length) return { error: "Limites inválidos." };

  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para salvar limites." };

  const categories = await prisma.category.findMany({
    where: { userId, id: { in: categoryIds } },
    select: { id: true }
  });
  const allowedCategoryIds = new Set(categories.map((category) => category.id));
  const operations = categoryIds.flatMap((categoryId, index) => {
    if (!allowedCategoryIds.has(categoryId)) return [];

    const amount = parseMoneyInput(amounts[index]);
    const type = limitTypeSchema.safeParse(types[index]);
    if (!Number.isFinite(amount) || amount < 0 || !type.success) return [];

    if (amount === 0) {
      return prisma.categoryLimit.deleteMany({
        where: {
          userId,
          categoryId,
          month: month.data,
          year: year.data
        }
      });
    }

    return prisma.categoryLimit.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId,
          month: month.data,
          year: year.data
        }
      },
      update: {
        amount,
        type: type.data
      },
      create: {
        userId,
        categoryId,
        month: month.data,
        year: year.data,
        amount,
        type: type.data
      }
    });
  });

  await prisma.$transaction(operations);

  revalidatePath("/planning");
  revalidatePath("/dashboard");
  revalidatePath("/insights");
  return { success: "Limites por categoria salvos." };
}
