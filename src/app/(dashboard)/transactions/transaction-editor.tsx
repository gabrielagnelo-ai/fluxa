"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";
import { saveTransaction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateInput } from "@/utils/period";
import type { ParsedTransaction } from "@/types/finance";

export function TransactionEditor({ transaction, categories }: { transaction?: ParsedTransaction; categories: { id: string; name: string }[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  return <>
    <button type="button" className={transaction ? "inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm text-muted-foreground hover:bg-muted focus-visible:outline focus-visible:outline-primary" : "premium-button inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-primary-foreground"}
      onClick={() => { setError(undefined); setSuccess(undefined); dialog.current?.showModal(); }} aria-label={transaction ? `Editar ${transaction.description}` : undefined}>
      {transaction ? <Pencil className="size-4" /> : <Plus className="size-4" />} {transaction ? "Editar" : "Adicionar gasto/receita"}
    </button>
    {success && <p role="status" className="text-sm text-primary">{success}</p>}
    <dialog ref={dialog} aria-labelledby={heading} className="m-auto w-[calc(100%_-_2rem)] max-w-lg rounded-2xl border border-border bg-background p-5 text-foreground backdrop:bg-black/70" onCancel={(event) => { if (pending) event.preventDefault(); }}>
      <div className="mb-5 flex items-center justify-between gap-2"><h2 id={heading} className="text-lg font-semibold">{transaction ? "Editar transação" : "Adicionar gasto/receita"}</h2><button type="button" disabled={pending} onClick={() => dialog.current?.close()} aria-label="Fechar" className="p-2"><X className="size-5" /></button></div>
      <form className="space-y-4" onSubmit={(event) => {
        event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
        startTransition(async () => { setError(undefined); try { const result = await saveTransaction(data); if (result.error) setError(result.error); else { setSuccess(result.success); dialog.current?.close(); if (!transaction) form.reset(); router.refresh(); } } catch { setError("Não foi possível conectar. Seus campos foram mantidos; tente novamente."); } });
      }}>
        {transaction?.id && <input type="hidden" name="id" value={transaction.id} />}
        <label className="block text-sm">Descrição<Input name="description" required maxLength={300} defaultValue={transaction?.description} autoFocus className="mt-1" placeholder="Ex.: compra no mercado" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">Valor (R$)<Input name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" max="9999999999.99" required defaultValue={transaction?.amount} className="mt-1" /></label>
          <label className="text-sm">Data<Input name="date" type="date" required defaultValue={transaction?.date.slice(0, 10) ?? formatDateInput(new Date())} className="mt-1" /></label>
        </div>
        <label className="block text-sm">Tipo<select name="type" defaultValue={transaction?.type ?? "EXPENSE"} className="premium-input mt-1 h-10 w-full rounded-xl px-3"><option value="EXPENSE">Gasto</option><option value="INCOME">Receita</option></select></label>
        <label className="block text-sm">Categoria<select name="categoryId" defaultValue={categories.find((category) => category.name === transaction?.category)?.id ?? ""} className="premium-input mt-1 h-10 w-full rounded-xl px-3"><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" disabled={pending} className="rounded-xl border border-border px-4 py-2 text-sm" onClick={() => dialog.current?.close()}>Cancelar</button><Button disabled={pending}>{pending ? "Salvando…" : "Salvar transação"}</Button></div>
      </form>
    </dialog>
  </>;
}
