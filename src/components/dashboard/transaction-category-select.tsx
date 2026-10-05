"use client";

import { updateTransactionCategory } from "@/app/(dashboard)/transactions/actions";
import { TransactionCategoryForm } from "@/components/dashboard/transaction-category-form";

type CategoryOption = {
  id: string;
  name: string;
};

export function TransactionCategorySelect({
  transactionId,
  currentCategoryId,
  currentCategory,
  categories
}: {
  transactionId?: string;
  currentCategoryId?: string | null;
  currentCategory?: string;
  categories: CategoryOption[];
}) {
  // Imported/demo rows can lack an ID; an explicit null always means uncategorized.
  const categoryId = currentCategoryId === undefined
    ? categories.find((category) => category.name === currentCategory)?.id ?? null
    : currentCategoryId;

  if (!transactionId) {
    return <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{currentCategory ?? "Outros"}</span>;
  }

  return (
    <TransactionCategoryForm key={transactionId} transactionId={transactionId}
      currentCategoryId={categoryId} categories={categories} saveCategory={updateTransactionCategory} />
  );
}
