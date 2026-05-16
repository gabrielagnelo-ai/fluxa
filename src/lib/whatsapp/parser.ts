import { categorizeDescription } from "@/services/category-service";

const expenseWords = ["gastei", "paguei", "comprei", "saiu", "despesa", "debito", "débito"];
const incomeWords = ["recebi", "entrou", "ganhei", "salario", "salário", "receita"];

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

function cleanDescription(text: string) {
  return text
    .replace(/(?:r\$\s*)?\d{1,6}(?:[.,]\d{1,2})?/gi, "")
    .replace(/\b(gastei|paguei|comprei|recebi|entrou|ganhei|hoje|ontem|no|na|em|de|com|reais|real)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseWhatsAppTransaction(text: string) {
  const amount = parseAmount(text);
  if (!amount) return null;

  const description = cleanDescription(text) || text.trim();
  const type = inferType(text);
  const date = inferDate(text);
  const category = type === "INCOME" ? "Receita" : categorizeDescription(description);

  return {
    amount,
    type,
    date,
    description,
    category
  };
}
