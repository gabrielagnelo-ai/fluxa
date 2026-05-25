"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/services/finance-data-service";

const baselineSchema = z.object({
  date: z.string().min(1, "Informe a data do saldo inicial."),
  amount: z.string().min(1, "Informe o saldo inicial."),
  note: z.string().optional()
});

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

  return Number(normalized);
}

export async function saveBalanceBaseline(_previousState: unknown, formData: FormData) {
  const parsed = baselineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Saldo inicial invalido." };

  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faca login para salvar o saldo inicial." };

  const amount = parseMoneyInput(parsed.data.amount);
  const date = new Date(`${parsed.data.date}T00:00:00`);

  if (!Number.isFinite(amount)) return { error: "Informe um valor valido." };
  if (Number.isNaN(date.getTime())) return { error: "Informe uma data valida." };

  await prisma.balanceBaseline.upsert({
    where: { userId },
    update: {
      date,
      amount,
      note: parsed.data.note || null
    },
    create: {
      userId,
      date,
      amount,
      note: parsed.data.note || null
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/insights");

  return { success: "Saldo inicial salvo. O dashboard ja usa esse valor no saldo atual." };
}
