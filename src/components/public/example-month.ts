// Fictitious month shared by the public page, the 3D scene and the demo.
// No service imports or user data belong here.
export const exampleIncome = 5200;

export const exampleCategories = [
  { name: "Moradia", planned: 1500, spent: 1450 },
  { name: "Mercado", planned: 850, spent: 620 },
  { name: "Outros", planned: 450, spent: 300 },
  { name: "Transporte", planned: 350, spent: 290 },
  { name: "Lazer", planned: 400, spent: 200 }
] as const;

export const exampleSpent = exampleCategories.reduce((total, item) => total + item.spent, 0);
// Same figures as the demo: the month opens at R$ 1.860,00 and closes at R$ 4.200,00.
export const exampleBalance = 4200;
export const examplePlanned = exampleCategories.reduce((total, item) => total + item.planned, 0);

export const exampleStatement = [
  { day: "05/10", raw: "PIX RECEBIDO · SALARIO", amount: 5200, category: "Receita" },
  { day: "06/10", raw: "BOLETO · ALUGUEL E CONDOMINIO", amount: -1450, category: "Moradia" },
  { day: "07/10", raw: "COMPRA DEB · MERCADO DO BAIRRO", amount: -620, category: "Mercado" },
  { day: "08/10", raw: "RECARGA · CARTAO TRANSPORTE", amount: -290, category: "Transporte" },
  { day: "09/10", raw: "COMPRA CRED · CINEMA CENTRO", amount: -200, category: "Lazer" },
  { day: "10/10", raw: "COMPRA DEB · FARMACIA", amount: -300, category: "Outros" }
] as const;

export function formatAmount(value: number) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(value));
}
