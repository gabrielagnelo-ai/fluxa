"use client";

import { useActionState } from "react";
import { updateTransactionCategory } from "@/app/(dashboard)/transactions/actions";

type CategoryOption = {
  id: string;
  name: string;
};

export function TransactionCategorySelect({
  transactionId,
  currentCategory,
  categories,
  redirectTo
}: {
  transactionId?: string;
  currentCategory?: string;
  categories: CategoryOption[];
  redirectTo?: string;
}) {
  const [state, action, pending] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => updateTransactionCategory(formData),
    undefined
  );
  const current = categories.find((category) => category.name === currentCategory);

  if (!transactionId) {
    return <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{currentCategory ?? "Outros"}</span>;
  }

  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="id" value={transactionId} />
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      <select
        name="categoryId"
        defaultValue={current?.id ?? ""}
        disabled={pending}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-8 max-w-44 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        <option value="" disabled>
          Selecionar
        </option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      {state?.error && <p className="max-w-44 text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
