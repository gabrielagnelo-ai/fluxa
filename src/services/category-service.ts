import { normalizeText } from "@/lib/utils";
import type { CategoryRule, ParsedTransaction } from "@/types/finance";

export const defaultCategoryRules: CategoryRule[] = [
  { name: "iFood", color: "#ef4444", icon: "Utensils", keywords: ["IFD*", "IFD", "IFOOD"] },
  { name: "RU UTFPR", color: "#10b981", icon: "Utensils", keywords: ["AMI", "AMI SERVICOS", "RU UTFPR"] },
  { name: "Restaurante", color: "#14b8a6", icon: "Utensils", keywords: ["MP *BAKANASLANCHO", "BAKANASLANCHO", "RESTAURANTE", "LANCHONETE", "MARMITARIA", "BURGUER", "LANCH"] },
  { name: "Mercado", color: "#22c55e", icon: "ShoppingBasket", keywords: ["MERCADO", "SUPERMERCADO", "SUPERMERCADOS", "ATACADAO", "PARANA SUPERMERCADOS"] },
  { name: "Academia", color: "#06b6d4", icon: "Dumbbell", keywords: ["CENTRO DE TREINAMENTOS", "CENTRO DE TREINAMENTO", "ACADEMIA", "SMART FIT", "GYM", "TREINO"] },
  { name: "Suplementos", color: "#a855f7", icon: "Dumbbell", keywords: ["SUPLEMENTO", "SUPLEMENTOS", "GROWTH", "MAX TITANIUM", "INTEGRALMEDICA"] },
  { name: "Assinatura", color: "#2563eb", icon: "BadgeCheck", keywords: ["APPLE", "APPLE.COM/BILL", "IFOOD CLUB", "SPOTIFY", "EBW*SPOTIFY"] },
  { name: "Limite Garantido", color: "#0ea5e9", icon: "ShieldCheck", keywords: ["APLICACAO RDB", "APLICAÇÃO RDB", "LIMITE GARANTIDO"] },
  { name: "Energia", color: "#facc15", icon: "Zap", keywords: ["COPEL", "COPEL-DIS", "ENERGIA", "LUZ"] },
  { name: "Água", color: "#38bdf8", icon: "Droplets", keywords: ["SANEPAR", "AGUA", "ÁGUA", "DAE", "SAAE"] },
  { name: "Aluguel", color: "#64748b", icon: "Home", keywords: ["ALUGUEL", "IMOBILIARIA", "IMOBILIÁRIA"] },
  { name: "Condomínio", color: "#475569", icon: "Building2", keywords: ["CONDOMINIO", "CONDOMÍNIO"] },
  { name: "Transporte", color: "#3b82f6", icon: "Car", keywords: ["UBER", "99APP", "99 APP", "99 TAXI", "99POP", "99 POP", "METRO", "ONIBUS"] },
  { name: "Combustível", color: "#f97316", icon: "Fuel", keywords: ["POSTO", "SHELL", "IPIRANGA", "PETROBRAS"] },
  { name: "Compras", color: "#8b5cf6", icon: "ShoppingBag", keywords: ["AMAZON", "MERCADO LIVRE", "MAGAZINE", "SHOPEE"] },
  { name: "Moradia", color: "#64748b", icon: "Home", keywords: ["MORADIA", "CASA"] },
  { name: "Receita", color: "#22c55e", icon: "TrendingUp", keywords: ["TB SOLAR", "PIX RECEBIDO", "SALARIO", "TRANSFERENCIA RECEBIDA"] },
  { name: "Pagamento Pix", color: "#64748b", icon: "Send", keywords: ["TRANSFERENCIA ENVIADA PELO PIX", "TRANSFERÊNCIA ENVIADA PELO PIX", "PIX ENVIADO"] },
  { name: "Outros", color: "#94a3b8", icon: "CircleDollarSign", keywords: ["QSM", "QMS"] }
];

export function categorizeDescription(description: string, rules = defaultCategoryRules) {
  const normalizedDescription = normalizeText(description);
  const rulesBySpecificity = [...rules].sort((a, b) => {
    const pixA = a.name === "Pagamento Pix" ? 1 : 0;
    const pixB = b.name === "Pagamento Pix" ? 1 : 0;
    if (pixA !== pixB) return pixA - pixB;

    const longestA = Math.max(0, ...a.keywords.map((keyword) => normalizeText(keyword).length));
    const longestB = Math.max(0, ...b.keywords.map((keyword) => normalizeText(keyword).length));
    return longestB - longestA;
  });
  const rule = rulesBySpecificity.find((category) =>
    category.keywords.some((keyword) => {
      const normalizedKeyword = normalizeText(keyword);
      return normalizedKeyword.length > 0 && normalizedDescription.includes(normalizedKeyword);
    })
  );

  return rule?.name ?? "Outros";
}

export function categorizeTransactions(transactions: ParsedTransaction[], rules = defaultCategoryRules) {
  return transactions.map((transaction) => ({
    ...transaction,
    category: transaction.category ?? categorizeDescription(transaction.description, rules)
  }));
}

export function keywordsFromText(value: string) {
  return value
    .split(/[,\n;]/)
    .map((keyword) => keyword.trim().toUpperCase())
    .filter(Boolean);
}
