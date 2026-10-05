"use server";

import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { secureLogger } from "@/lib/security/logger";
import { isCalendarDate, transactionDate, transactionFieldsSchema } from "@/lib/transaction-validation";
import { getCurrentUserId } from "@/services/finance-data-service";
import { isGoalContributionExcluded, matchGoalMarker } from "@/services/goal-marker-service";
import { parseDateInput } from "@/utils/period";

function refreshTransactions() {
  for (const path of ["/dashboard", "/transactions", "/goals", "/planning", "/insights"]) revalidatePath(path);
}

export async function saveTransaction(formData: FormData) {
  const parsed = transactionFieldsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Confira a data, descrição e valor (maior que zero, com até duas casas decimais)." };
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para registrar transações." };
  const id = String(formData.get("id") ?? "");
  try {
    await prisma.$transaction(async (tx) => {
      const categoryId = parsed.data.categoryId || null;
      if (categoryId && !await tx.category.findFirst({ where: { id: categoryId, userId } })) throw new Error("INVALID_CATEGORY");
      const values = { ...parsed.data, categoryId, date: transactionDate(parsed.data.date), categoryLocked: true };
      if (id && !await tx.transaction.findFirst({ where: { id, userId } })) throw new Error("NOT_FOUND");
      const transaction = id
        ? await tx.transaction.update({ where: { id, userId }, data: values })
        : await tx.transaction.create({ data: { ...values, userId, source: "Manual" } });
      // Keep explicitly selected goal contributions synchronized with edits.
      if (values.type === "INCOME" || isGoalContributionExcluded(values.description)) {
        await tx.goalContribution.deleteMany({ where: { userId, transactionId: transaction.id } });
      } else {
        await tx.goalContribution.updateMany({ where: { userId, transactionId: transaction.id }, data: { amount: values.amount, date: values.date } });
        const existing = await tx.goalContribution.count({ where: { userId, transactionId: transaction.id } });
        const marker = matchGoalMarker(values.description, await tx.goalMarker.findMany({ where: { userId } }));
        if (!existing && marker) await tx.goalContribution.create({ data: { userId, goalId: marker.goalId, transactionId: transaction.id, amount: values.amount, date: values.date } });
      }
    });
    refreshTransactions();
    return { success: id ? "Transação atualizada." : "Transação adicionada." };
  } catch (error) {
    secureLogger.error("Transaction save failed", { error });
    return { error: "Não foi possível salvar. Confira a categoria e tente novamente; seus campos foram preservados." };
  }
}

export async function updateTransactionCategory(formData: FormData) {
  const parsed = z.object({ id: z.string().min(1), categoryId: z.string().min(1) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Categoria inválida." };
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para editar transações." };
  try {
    const category = await prisma.category.findFirst({ where: { id: parsed.data.categoryId, userId } });
    if (!category) return { error: "Categoria não encontrada." };
    const result = await prisma.transaction.updateMany({ where: { id: parsed.data.id, userId }, data: { categoryId: category.id, categoryLocked: true } });
    if (!result.count) return { error: "Esta transação não está mais disponível." };
    refreshTransactions();
    return { success: "Categoria atualizada.", categoryId: category.id };
  } catch (error) {
    secureLogger.error("Transaction category update failed", { error });
    return { error: "Não foi possível atualizar a categoria. Tente novamente." };
  }
}

export async function deleteTransaction(formData: FormData) {
  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success || formData.get("confirmed") !== "yes") return { error: "Confirme a transação antes de apagar." };
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para apagar transações." };
  try {
    const result = await prisma.transaction.deleteMany({ where: { id: id.data, userId } });
    if (!result.count) return { error: "Esta transação já foi apagada ou não está disponível. Atualize o histórico." };
    refreshTransactions();
    return { success: "Transação apagada." };
  } catch (error) {
    secureLogger.error("Transaction deletion failed", { error });
    return { error: "Não foi possível confirmar a exclusão. Atualize o histórico para conferir o resultado antes de tentar novamente." };
  }
}

export async function deleteTransactionsInPeriod(formData: FormData) {
  const parsed = z.object({
    start: z.string().refine(isCalendarDate), end: z.string().refine(isCalendarDate),
    expectedCount: z.coerce.number().int().positive(), snapshot: z.string().length(64), confirmed: z.literal("yes")
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success || parsed.data.start > parsed.data.end) return { error: "Confira o período e confirme a exclusão." };
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para apagar transações." };
  const { start, end, expectedCount, snapshot } = parsed.data;
  try {
    const count = await prisma.$transaction(async (tx) => {
      const where = { userId, date: { gte: parseDateInput(start, new Date()), lte: parseDateInput(end, new Date(), true) } };
      const current = await tx.transaction.findMany({ where, select: { id: true } });
      const currentSnapshot = createHash("sha256").update(current.map((item) => item.id).sort().join("\n")).digest("hex");
      if (current.length !== expectedCount || currentSnapshot !== snapshot) throw new Error("PERIOD_CHANGED");
      return (await tx.transaction.deleteMany({ where })).count;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    refreshTransactions();
    return { success: `${count} transação(ões) apagada(s).` };
  } catch (error) {
    secureLogger.error("Period deletion failed", { error });
    return { error: error instanceof Error && error.message === "PERIOD_CHANGED"
      ? "Nada foi apagado: o histórico mudou desde a confirmação. Atualize a página e confira o período novamente."
      : "Não foi possível confirmar a exclusão. Atualize o histórico para conferir o resultado antes de tentar novamente." };
  }
}
