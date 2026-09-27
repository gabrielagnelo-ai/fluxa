import { z } from "zod";

export function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isTransactionDate(value: string) {
  return isCalendarDate(value.slice(0, 10)) && Number.isFinite(new Date(value).getTime());
}

export const transactionAmountSchema = z.number().finite().positive().max(9_999_999_999.99)
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.0001, "Use no máximo duas casas decimais.");

export const transactionFieldsSchema = z.object({
  date: z.string().refine(isCalendarDate, "Informe uma data válida."),
  description: z.string().trim().min(1, "Informe a descrição.").max(300),
  amount: z.preprocess((value) => typeof value === "string" ? Number(value.replace(",", ".")) : value, transactionAmountSchema),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().max(100).optional()
});

export function transactionDate(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00.000Z`);
}
