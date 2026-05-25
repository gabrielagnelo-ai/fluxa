import { categorizeDescription } from "@/services/category-service";

const expenseWords = ["gastei", "gaste", "gatei", "gatiei", "paguei", "comprei", "saiu", "despesa", "debito", "débito"];
const incomeWords = ["recebi", "entrou", "ganhei", "salario", "salário", "receita"];
const goalContributionWords = [
  "guardei",
  "guarde",
  "guardar",
  "aportei",
  "aporte",
  "aportar",
  "reservei",
  "reserve",
  "poupei",
  "poupar",
  "coloquei",
  "colocar",
  "juntei",
  "juntar"
];
const disposableWords =
  /\b(eu|r\$|reais|real|hoje|ontem|dia|data|no|na|nos|nas|em|de|do|da|dos|das|para|pra|a|ao|aos|com|um|uma|o|os|as)\b/gi;
const commandWords =
  /\b(gastei|gaste|gatei|gatiei|paguei|comprei|recebi|entrou|ganhei|guardei|guarde|guardar|aportei|aporte|aportar|reservei|reserve|poupei|poupar|coloquei|colocar|juntei|juntar|saiu|despesa|debito|d[ée]bito|salario|sal[áa]rio|receita)\b/gi;

function parseAmount(text: string) {
  const match = text.match(/(?:r\$\s*)?(\d{1,6}(?:[.,]\d{1,2})?)/i);
  if (!match) return null;
  const amount = Number(match[1].replace(".", "").replace(",", "."));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function inferType(text: string) {
  const normalized = text.toLowerCase();
  if (incomeWords.some((word) => normalized.includes(word))) return "INCOME" as const;
  if (expenseWords.some((word) => normalized.includes(word))) return "EXPENSE" as const;
  return "EXPENSE" as const;
}

function isGoalContributionText(text: string) {
  const normalized = text.toLowerCase();
  return goalContributionWords.some((word) => normalized.includes(word));
}

function inferDate(text: string) {
  const now = new Date();
  const normalized = text.toLowerCase();
  if (normalized.includes("ontem")) {
    const date = new Date(now);
    date.setDate(date.getDate() - 1);
    return date;
  }

  const dateMatch = normalized.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (dateMatch) {
    const day = Number(dateMatch[1]);
    const month = Number(dateMatch[2]) - 1;
    const year = dateMatch[3] ? Number(dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3]) : now.getFullYear();
    return new Date(year, month, day);
  }

  return now;
}

export function cleanWhatsAppDescription(text: string) {
  return text
    .replace(/^whatsapp\s*-\s*/i, "")
    .replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g, " ")
    .replace(/(?:r\$\s*)?\d{1,6}(?:[.,]\d{1,2})?/gi, " ")
    .replace(commandWords, " ")
    .replace(disposableWords, " ")
    .replace(/[|/\\;:_-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s*]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractGoalQuery(text: string) {
  const withoutAmount = text.replace(/(?:r\$\s*)?\d{1,6}(?:[.,]\d{1,2})?/gi, " ");
  const targetMatch = withoutAmount.match(/\b(?:na|no|em|para|pra|a|ao)\s+(?:minha\s+|meu\s+)?(?:meta\s+)?(.+)$/i);
  const rawTarget = targetMatch?.[1] ?? withoutAmount;

  return rawTarget
    .replace(commandWords, " ")
    .replace(disposableWords, " ")
    .replace(/[|/\\;:_-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s*]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseWhatsAppTransaction(text: string) {
  const amount = parseAmount(text);
  if (!amount) return null;

  const description = cleanWhatsAppDescription(text) || text.trim();
  const goalQueryText = isGoalContributionText(text) ? extractGoalQuery(text) : undefined;
  const goalQuery = goalQueryText !== undefined ? goalQueryText || "meta informada" : undefined;
  const type = goalQuery ? "EXPENSE" : inferType(text);
  const date = inferDate(text);
  const category = type === "INCOME" ? "Receita" : categorizeDescription(description);

  return {
    amount,
    type,
    date,
    description,
    category,
    goalQuery
  };
}
