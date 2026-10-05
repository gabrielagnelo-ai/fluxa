"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useState } from "react";

type CategorySaveResult = { error?: string; success?: string; categoryId?: string };

export function TransactionCategoryForm({ transactionId, currentCategoryId, categories, saveCategory }: {
  transactionId: string;
  currentCategoryId: string | null;
  categories: { id: string; name: string }[];
  saveCategory: (formData: FormData) => Promise<CategorySaveResult>;
}) {
  const [selectedId, setSelectedId] = useState(currentCategoryId ?? "");
  const confirmedId = useRef(currentCategoryId ?? "");
  const messageId = useId();

  useEffect(() => {
    confirmedId.current = currentCategoryId ?? "";
    setSelectedId(confirmedId.current);
  }, [transactionId, currentCategoryId]);

  const [state, action, pending] = useActionState(
    async (_previous: CategorySaveResult | undefined, formData: FormData): Promise<CategorySaveResult> => {
      try {
        const result = await saveCategory(formData);
        if (result.error || !result.categoryId) {
          setSelectedId(confirmedId.current);
          return { error: result.error ?? "Não foi possível confirmar a categoria. Tente novamente." };
        }
        confirmedId.current = result.categoryId;
        setSelectedId(result.categoryId);
        return result;
      } catch {
        setSelectedId(confirmedId.current);
        return { error: "Não foi possível conectar para salvar a categoria. Tente novamente." };
      }
    },
    undefined
  );

  return (
    <form className="space-y-1" aria-busy={pending} onSubmit={(event) => {
      event.preventDefault();
      // A form Action resets selects on completion; dispatch explicitly to preserve this auto-save field.
      const formData = new FormData(event.currentTarget);
      startTransition(() => action(formData));
    }}>
      <input type="hidden" name="id" value={transactionId} />
      <select
        name="categoryId"
        aria-label="Categoria da transação"
        aria-describedby={messageId}
        value={selectedId}
        disabled={pending}
        onChange={(event) => {
          setSelectedId(event.currentTarget.value);
          event.currentTarget.form?.requestSubmit();
        }}
        className="h-8 max-w-44 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        <option value="" disabled>Selecionar</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>
      <p id={messageId} role={state?.error && !pending ? "alert" : "status"}
        className={pending ? "text-xs text-muted-foreground" : state?.error ? "max-w-44 text-xs text-destructive" : "sr-only"}>
        {pending ? "Salvando…" : state?.error ?? state?.success}
      </p>
    </form>
  );
}
