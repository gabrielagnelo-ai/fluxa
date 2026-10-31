"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteTransaction, deleteTransactionsInPeriod } from "@/app/(dashboard)/transactions/actions";
import { plural } from "@/lib/utils";
import { formatDateInput, getPeriodLabel } from "@/utils/period";

function DeleteConfirmation({ label, description, fields, action, disabled = false }: {
  label: string; description: string; fields: Record<string, string>; disabled?: boolean;
  action: (data: FormData) => Promise<{ error?: string; success?: string }>;
}) {
  const modal = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  return <div>
    <button type="button" disabled={disabled || pending} className="btn btn-plain is-destructive tx-delete disabled:opacity-40" onClick={() => { setError(undefined); setSuccess(undefined); modal.current?.showModal(); }}><Trash2 className="size-4" />{label}</button>
    {success && <p role="status" className="mt-2 text-sm text-muted-foreground">{success}</p>}
    <dialog ref={modal} aria-labelledby={heading} className="alert-dialog" onCancel={(event) => { if (pending) event.preventDefault(); }}>
      <h2 id={heading} className="alert-title">Confirmar exclusão</h2><p className="alert-text break-words">{description}</p><p className="alert-text alert-note">Essa ação também remove os aportes vinculados a metas e não pode ser desfeita.</p>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      <form className="alert-actions" onSubmit={(event) => {
        event.preventDefault(); const data = new FormData(); for (const [key, value] of Object.entries(fields)) data.set(key, value); data.set("confirmed", "yes");
        startTransition(async () => { setError(undefined); try { const result = await action(data); if (result.error) setError(result.error); else { setSuccess(result.success); modal.current?.close(); router.refresh(); } } catch { setError("A conexão falhou. Atualize o histórico para conferir o resultado antes de tentar novamente."); } });
      }}>
        <button autoFocus type="button" disabled={pending} className="btn btn-gray" onClick={() => modal.current?.close()}>Cancelar</button>
        <button type="submit" disabled={pending} className="btn btn-gray is-destructive disabled:opacity-50">{pending ? "Apagando…" : "Apagar"}</button>
      </form>
    </dialog>
  </div>;
}

export function TransactionDeleteButton({ id, description = "esta transação" }: { id?: string; description?: string }) {
  if (!id) return null;
  return <DeleteConfirmation label="Apagar" description={`Apagar ${description}?`} fields={{ id }} action={deleteTransaction} />;
}

export function DeletePeriodTransactionsButton({ start, end, count, snapshot }: { start: Date; end: Date; count: number; snapshot: string }) {
  return <DeleteConfirmation label="Apagar período" disabled={!count} description={`Apagar ${plural(count, "transação", "transações")} de ${getPeriodLabel({ start, end })}? Isso inclui todas as transações do período, mesmo as ocultas pela busca ou pelos filtros de categoria/tipo.`}
    fields={{ start: formatDateInput(start), end: formatDateInput(end), expectedCount: String(count), snapshot }} action={deleteTransactionsInPeriod} />;
}
