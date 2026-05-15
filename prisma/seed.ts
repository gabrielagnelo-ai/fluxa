import { PrismaClient, TransactionType } from "@prisma/client";

const prisma = new PrismaClient();

const defaultCategories = [
  { name: "Alimentação", color: "#14b8a6", icon: "Utensils", keywords: ["IFOOD", "RU UTFPR", "RESTAURANTE", "MERCADO", "PADARIA", "LANCHONETE"] },
  { name: "Transporte", color: "#3b82f6", icon: "Car", keywords: ["UBER", "99APP", "99 APP", "99 TAXI", "99POP", "99 POP", "METRO", "ONIBUS"] },
  { name: "Combustível", color: "#f97316", icon: "Fuel", keywords: ["POSTO", "SHELL", "IPIRANGA", "PETROBRAS"] },
  { name: "Compras", color: "#8b5cf6", icon: "ShoppingBag", keywords: ["AMAZON", "MERCADO LIVRE", "MAGAZINE", "SHOPEE"] },
  { name: "Moradia", color: "#64748b", icon: "Home", keywords: ["ALUGUEL", "CONDOMINIO", "ENERGIA", "AGUA"] },
  { name: "Receita", color: "#22c55e", icon: "TrendingUp", keywords: ["PIX RECEBIDO", "SALARIO", "TRANSFERENCIA RECEBIDA"] }
];

async function main() {
  const user = await prisma.user.upsert({
    where: { supabaseId: "demo-user" },
    update: {},
    create: {
      supabaseId: "demo-user",
      name: "Usuário Demo",
      email: "demo@financehub.local"
    }
  });

  const categories = await Promise.all(
    defaultCategories.map((category) =>
      prisma.category.upsert({
        where: { userId_name: { userId: user.id, name: category.name } },
        update: category,
        create: { ...category, userId: user.id }
      })
    )
  );

  const receita = categories.find((category) => category.name === "Receita");
  const alimentacao = categories.find((category) => category.name === "Alimentação");
  const transporte = categories.find((category) => category.name === "Transporte");
  const compras = categories.find((category) => category.name === "Compras");

  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        categoryId: receita?.id,
        date: new Date("2026-05-05"),
        description: "PIX RECEBIDO CLIENTE",
        amount: 7200,
        type: TransactionType.INCOME,
        source: "Seed"
      },
      {
        userId: user.id,
        categoryId: alimentacao?.id,
        date: new Date("2026-05-07"),
        description: "IFOOD SAO PAULO",
        amount: 86.4,
        type: TransactionType.EXPENSE,
        source: "Seed"
      },
      {
        userId: user.id,
        categoryId: transporte?.id,
        date: new Date("2026-05-09"),
        description: "UBER TRIP",
        amount: 31.9,
        type: TransactionType.EXPENSE,
        source: "Seed"
      },
      {
        userId: user.id,
        categoryId: compras?.id,
        date: new Date("2026-05-12"),
        description: "AMAZON MARKETPLACE",
        amount: 249.9,
        type: TransactionType.EXPENSE,
        source: "Seed"
      }
    ],
    skipDuplicates: true
  });

  await prisma.goal.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      userId: user.id,
      name: "Reserva de emergência",
      targetAmount: 30000,
      currentAmount: 8500,
      dueDate: new Date("2026-12-31")
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
