"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/services/finance-data-service";

const assetSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Informe o nome do ativo."),
  ticker: z.string().trim().optional(),
  type: z.enum(["FIXED_INCOME", "STOCK", "FII", "ETF", "FUND", "CRYPTO", "CASH", "OTHER"]),
  institution: z.string().trim().optional(),
  quantity: z.coerce.number().min(0).optional(),
  averagePrice: z.coerce.number().min(0).optional(),
  investedAmount: z.coerce.number().min(0, "Informe o valor aplicado."),
  currentAmount: z.coerce.number().min(0, "Informe o valor atual."),
  acquiredAt: z.string().optional(),
  notes: z.string().trim().optional()
});

export async function upsertInvestmentAsset(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = assetSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para salvar investimentos." };

  const data = {
    name: parsed.data.name,
    ticker: parsed.data.ticker?.toUpperCase() || null,
    type: parsed.data.type,
    institution: parsed.data.institution || null,
    quantity: parsed.data.quantity || null,
    averagePrice: parsed.data.averagePrice || null,
    investedAmount: parsed.data.investedAmount,
    currentAmount: parsed.data.currentAmount,
    acquiredAt: parsed.data.acquiredAt ? new Date(parsed.data.acquiredAt) : null,
    notes: parsed.data.notes || null
  };

  if (parsed.data.id) {
    await prisma.investmentAsset.updateMany({
      where: { id: parsed.data.id, userId },
      data
    });
  } else {
    await prisma.investmentAsset.create({
      data: {
        ...data,
        userId
      }
    });
  }

  revalidatePath("/investments");
  revalidatePath("/dashboard");
  return { success: "Investimento salvo." };
}

export async function deleteInvestmentAsset(formData: FormData) {
  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) return { error: "Ativo inválido." };

  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para excluir investimentos." };

  await prisma.investmentAsset.deleteMany({
    where: { id: id.data, userId }
  });

  revalidatePath("/investments");
  revalidatePath("/dashboard");
  return { success: "Investimento excluído." };
}
