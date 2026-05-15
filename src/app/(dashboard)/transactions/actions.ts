"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/services/finance-data-service";
import { parseDateInput } from "@/utils/period";

export async function updateTransactionCategory(formData: FormData) {
  const parsed = z.object({
    id: z.string().min(1),
    categoryId: z.string().min(1),
    redirectTo: z.string().optional()
  }).safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: "Categoria inválida." };

  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para editar transações." };

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, userId }
  });

  if (!category) return { error: "Categoria não encontrada." };

  await prisma.transaction.updateMany({
    where: { id: parsed.data.id, userId },
    data: { categoryId: category.id, categoryLocked: true }
  });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/planning");
  revalidatePath("/insights");
  redirect(parsed.data.redirectTo?.startsWith("/transactions") ? parsed.data.redirectTo : "/transactions");
}

export async function deleteTransaction(formData: FormData) {
  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) return { error: "Transação inválida." };

  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para apagar transações." };

  await prisma.transaction.deleteMany({
    where: { id: id.data, userId }
  });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/goals");
  return { success: "Transação apagada." };
}

export async function deleteTransactionsInPeriod(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para apagar transações." };

  const now = new Date();
  const start = parseDateInput(formData.get("start"), new Date(now.getFullYear(), now.getMonth(), 1));
  const end = parseDateInput(formData.get("end"), new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999), true);

  const result = await prisma.transaction.deleteMany({
    where: {
      userId,
      date: {
        gte: start,
        lte: end
      }
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/goals");
  return { success: `${result.count} transação(ões) apagada(s).` };
}
