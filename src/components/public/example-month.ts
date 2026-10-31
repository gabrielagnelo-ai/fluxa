// Fictitious month shown on the public page. Same figures as the demo.
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
export const exampleOpening = 1860;
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

// Six fictitious months for the demo charts; October is the month above.
export const exampleHistory = [
  { month: "mai", receitas: 5000, despesas: 3920, saldo: 1080 },
  { month: "jun", receitas: 5200, despesas: 3480, saldo: 1720 },
  { month: "jul", receitas: 5200, despesas: 4150, saldo: 1050 },
  { month: "ago", receitas: 5200, despesas: 3010, saldo: 2190 },
  { month: "set", receitas: 5200, despesas: 3240, saldo: 1960 },
  { month: "out", receitas: exampleIncome, despesas: exampleSpent, saldo: exampleIncome - exampleSpent }
];

// One fictitious goal with money set aside in three months.
export const exampleGoal = {
  id: "exemplo-reserva",
  name: "Reserva de emergência",
  targetAmount: 3000,
  contributions: [
    { date: "2026-08-12T12:00:00.000Z", amount: 600 },
    { date: "2026-09-12T12:00:00.000Z", amount: 700 },
    { date: "2026-10-12T12:00:00.000Z", amount: 500 }
  ]
};
