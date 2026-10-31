"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { saveTransaction } from "./actions";
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
    <button type="button" className={transaction ? "btn btn-gray tx-action" : "btn btn-filled"}
      onClick={() => { setError(undefined); setSuccess(undefined); dialog.current?.showModal(); }} aria-label={transaction ? `Editar ${transaction.description}` : undefined}>
      {transaction ? <Pencil className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}{transaction ? "Editar" : "Adicionar"}
    </button>
    {success && <p role="status" className="text-sm text-primary">{success}</p>}
    <dialog ref={dialog} aria-labelledby={heading} className="sheet" onCancel={(event) => { if (pending) event.preventDefault(); }} onClick={(event) => { if (event.target === event.currentTarget && !pending) dialog.current?.close(); }}>
      <form onSubmit={(event) => {
        event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
        startTransition(async () => { setError(undefined); try { const result = await saveTransaction(data); if (result.error) setError(result.error); else { setSuccess(result.success); dialog.current?.close(); if (!transaction) form.reset(); router.refresh(); } } catch { setError("Não foi possível conectar. Seus campos foram mantidos; tente novamente."); } });
      }}>
        <div className="sheet-grabber" aria-hidden="true" />
        <div className="sheet-bar">
          <button type="button" disabled={pending} className="btn btn-plain" onClick={() => dialog.current?.close()}>Cancelar</button>
          <h2 id={heading} className="sheet-title">{transaction ? "Editar transação" : "Nova transação"}</h2>
          <button type="submit" disabled={pending} className="btn btn-plain btn-plain-strong">{pending ? "Salvando…" : "Salvar"}</button>
        </div>
        {transaction?.id && <input type="hidden" name="id" value={transaction.id} />}
        <div className="field-group">
          <label className="field-row field-row-stack"><span>Descrição</span><input name="description" required maxLength={300} defaultValue={transaction?.description} autoFocus placeholder="Ex.: compra no mercado" /></label>
          <label className="field-row"><span>Valor (R$)</span><input name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" max="9999999999.99" required defaultValue={transaction?.amount} placeholder="0,00" /></label>
          <label className="field-row"><span>Data</span><input name="date" type="date" required defaultValue={transaction?.date.slice(0, 10) ?? formatDateInput(new Date())} /></label>
          <label className="field-row"><span>Tipo</span><select name="type" defaultValue={transaction?.type ?? "EXPENSE"}><option value="EXPENSE">Gasto</option><option value="INCOME">Receita</option></select></label>
          <label className="field-row"><span>Categoria</span><select name="categoryId" defaultValue={categories.find((category) => category.name === transaction?.category)?.id ?? ""}><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        </div>
        {error && <p role="alert" className="field-error">{error}</p>}
      </form>
    </dialog>
  </>;
}
