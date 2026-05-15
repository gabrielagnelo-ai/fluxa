"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { deleteTransaction, deleteTransactionsInPeriod } from "@/app/(dashboard)/transactions/actions";
import { Button } from "@/components/ui/button";
import { formatDateInput } from "@/utils/period";

export function TransactionDeleteButton({ id }: { id?: string }) {
  const [, action, pending] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => deleteTransaction(formData),
    undefined
  );

  if (!id) return null;

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        disabled={pending}
        title="Apagar transação"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  );
}

export function DeletePeriodTransactionsButton({ start, end }: { start: Date; end: Date }) {
  const [state, action, pending] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => deleteTransactionsInPeriod(formData),
    undefined
  );

  return (
    <div className="space-y-2">
      <form action={action}>
        <input type="hidden" name="start" value={formatDateInput(start)} />
        <input type="hidden" name="end" value={formatDateInput(end)} />
        <Button className="bg-destructive text-white hover:bg-destructive/90" disabled={pending}>
          <Trash2 className="size-4" />
          {pending ? "Apagando..." : "Apagar período"}
        </Button>
      </form>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-muted-foreground">{state.success}</p>}
    </div>
  );
}
