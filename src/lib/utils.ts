import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

/** Display a name typed in all caps (bank statements, imports) in sentence case. */
export function displayName(value: string) {
  const letters = value.replace(/[^\p{L}]/gu, "");
  if (letters.length < 3 || letters !== letters.toLocaleUpperCase("pt-BR")) return value;
  const lower = value.toLocaleLowerCase("pt-BR");
  return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
}

/** Short amounts for chart axes (the card says the unit): 150, 1,5 mil, −2,5 mil. */
export function formatAxisShort(value: number) {
  const abs = Math.abs(Number(value));
  const sign = Number(value) < 0 ? "−" : "";
  if (abs < 1000) return `${sign}${abs.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
  return `${sign}${(abs / 1000).toLocaleString("pt-BR", { maximumFractionDigits: abs >= 10000 ? 0 : 1 })}\u00a0mil`;
}

/** "1 transação", "3 transações": count with the right word, never "transação(ões)". */
export function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}
