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
