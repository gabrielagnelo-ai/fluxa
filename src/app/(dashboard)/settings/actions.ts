"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { categorizeDescription, defaultCategoryRules, keywordsFromText } from "@/services/category-service";
import { getCurrentUserId } from "@/services/finance-data-service";

const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, "Informe o nome da categoria.").optional(),
  keywords: z.string()
});

const createCategorySchema = z.object({
  name: z.string().min(2, "Informe o nome da categoria."),
  keywords: z.string().optional()
});

const deleteCategorySchema = z.object({
  id: z.string().min(1)
});

async function reprocessTransactions(userId: string) {
  const categories = await prisma.category.findMany({ where: { userId } });
  const rules = categories.map((category) => ({
    name: category.name,
    color: category.color,
    icon: category.icon,
    keywords: category.keywords
  }));
  const transactions = await prisma.transaction.findMany({ where: { userId, categoryLocked: false } });

  await prisma.$transaction(
    transactions.map((transaction) => {
      const categoryName = categorizeDescription(transaction.description, rules);
      const categoryId = categories.find((category) => category.name === categoryName)?.id ?? null;

      return prisma.transaction.update({
        where: { id: transaction.id },
        data: { categoryId }
      });
    })
  );

  return transactions.length;
}

function revalidateCategoryPaths() {
  revalidatePath("/settings");
  revalidatePath("/import");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/planning");
  revalidatePath("/insights");
}

export async function updateCategoryKeywords(formData: FormData) {
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para editar as regras." };

  const category = await prisma.category.findFirst({ where: { id: parsed.data.id, userId } });
  if (!category) return { error: "Categoria não encontrada para este usuário." };

  try {
    await prisma.category.update({
      where: { id: category.id },
      data: {
        ...(parsed.data.name ? { name: parsed.data.name.trim() } : {}),
        keywords: keywordsFromText(parsed.data.keywords)
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Já existe uma categoria com esse nome." };
    }
    throw error;
  }

  const count = await reprocessTransactions(userId);
  revalidateCategoryPaths();
  return { success: `Categoria salva. ${count} transação(ões) reprocessada(s).` };
}

export async function createCategory(formData: FormData) {
  const parsed = createCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para criar categorias." };

  await prisma.category.upsert({
    where: { userId_name: { userId, name: parsed.data.name } },
    update: { keywords: keywordsFromText(parsed.data.keywords ?? "") },
    create: {
      userId,
      name: parsed.data.name,
      color: "#94A3B8",
      icon: "Tag",
      keywords: keywordsFromText(parsed.data.keywords ?? "")
    }
  });

  const count = await reprocessTransactions(userId);
  revalidateCategoryPaths();
  return { success: `Categoria criada. ${count} transação(ões) reprocessada(s).` };
}

export async function deleteCategory(formData: FormData) {
  const parsed = deleteCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Categoria inválida." };

  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para excluir categorias." };

  const category = await prisma.category.findFirst({ where: { id: parsed.data.id, userId } });
  if (!category) return { error: "Categoria não encontrada para este usuário." };
  if (category.name === "Outros") return { error: "A categoria Outros não pode ser excluída." };

  const fallbackCategory = await prisma.category.upsert({
    where: { userId_name: { userId, name: "Outros" } },
    update: {},
    create: {
      userId,
      name: "Outros",
      color: "#94a3b8",
      icon: "CircleDollarSign",
      keywords: []
    }
  });

  await prisma.$transaction([
    prisma.transaction.updateMany({
      where: { userId, categoryId: category.id },
      data: { categoryId: fallbackCategory.id }
    }),
    prisma.budget.deleteMany({
      where: { userId, categoryId: category.id }
    }),
    prisma.category.delete({
      where: { id: category.id }
    })
  ]);

  const count = await reprocessTransactions(userId);
  revalidateCategoryPaths();
  return { success: `Categoria removida. ${count} transação(ões) reprocessada(s).` };
}

export async function syncDefaultCategories() {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para sincronizar categorias." };

  const existing = await prisma.category.findMany({ where: { userId } });
  const byName = new Map(existing.map((category) => [category.name, category]));
  const oldFood = byName.get("Alimentação");

  if (oldFood && !byName.has("Restaurante")) {
    await prisma.category.update({
      where: { id: oldFood.id },
      data: {
        name: "Restaurante",
        keywords: ["RESTAURANTE", "LANCHONETE", "MARMITARIA", "BURGUER", "LANCH"]
      }
    });
  }

  await Promise.all(
    defaultCategoryRules.map((category) =>
      prisma.category.upsert({
        where: { userId_name: { userId, name: category.name } },
        update: { keywords: category.keywords, color: category.color, icon: category.icon },
        create: { ...category, userId }
      })
    )
  );

  const count = await reprocessTransactions(userId);
  revalidateCategoryPaths();
  return { success: `Categorias sincronizadas. ${count} transação(ões) reprocessada(s).` };
}
