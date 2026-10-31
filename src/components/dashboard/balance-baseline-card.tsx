"use client";

import { useActionState, useEffect, useRef } from "react";
import { ChevronRight, WalletCards } from "lucide-react";
import { saveBalanceBaseline } from "@/app/(dashboard)/dashboard/actions";
import { formatCurrency } from "@/lib/utils";

type BalanceBaseline = {
  date: string;
  amount: number;
  note?: string;
} | null;

function toDateInputValue(value?: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

/** Starting balance: a list row on the screen, the form in a sheet. */
export function BalanceBaselineCard({
  baseline,
  currentBalance,
  defaultDate
}: {
  baseline: BalanceBaseline;
  currentBalance: number;
  defaultDate: Date;
}) {
  const [state, action, pending] = useActionState(saveBalanceBaseline, undefined as { error?: string; success?: string } | undefined);
  const sheet = useRef<HTMLDialogElement>(null);
  const baselineDate = baseline ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(baseline.date)) : null;

  useEffect(() => { if (state?.success) sheet.current?.close(); }, [state]);

  return (
    <section className="card" aria-labelledby="baseline-title">
      <h2 id="baseline-title" className="sr-only">Saldo inicial da conta</h2>
      <button type="button" className="list-row has-icon" aria-haspopup="dialog" onClick={() => sheet.current?.showModal()}>
        <span className="row-icon" aria-hidden="true"><WalletCards /></span>
        <span className="row-main">
          <span className="row-title">Saldo inicial da conta</span>
          <span className="row-sub">{baseline ? `${formatCurrency(baseline.amount)} em ${baselineDate}` : "Não informado. O saldo mostrado é só a soma das movimentações."}</span>
        </span>
        <ChevronRight className="row-chevron" aria-hidden="true" />
      </button>
      {state?.success && <p className="field-success baseline-status" role="status">{state.success}</p>}

      <dialog ref={sheet} className="sheet" aria-labelledby="baseline-sheet-title" onClick={event => { if (event.target === event.currentTarget) sheet.current?.close(); }}>
        <form action={action}>
          <div className="sheet-grabber" aria-hidden="true" />
          <div className="sheet-bar">
            <button type="button" className="btn btn-plain" onClick={() => sheet.current?.close()}>Cancelar</button>
            <h2 id="baseline-sheet-title" className="sheet-title">Saldo inicial</h2>
            <button type="submit" disabled={pending} className="btn btn-plain" style={{ fontWeight: 700 }}>{pending ? "Salvando..." : "Salvar"}</button>
          </div>
          <p className="field-note" style={{ marginTop: 0, marginBottom: "0.75rem" }}>Se a conta já tinha dinheiro antes do primeiro extrato importado, informe o saldo nessa data. O Fluxa soma esse valor com as entradas e saídas para chegar ao saldo atual.</p>
          <div className="field-group">
            <label className="field-row"><span>Data</span><input name="date" type="date" defaultValue={toDateInputValue(baseline?.date) || toDateInputValue(defaultDate.toISOString())} /></label>
            <label className="field-row"><span>Saldo nessa data</span><input name="amount" inputMode="decimal" placeholder="R$ 0,00" aria-describedby={state?.error ? "baseline-error" : undefined} aria-invalid={state?.error ? true : undefined} defaultValue={baseline ? String(baseline.amount).replace(".", ",") : ""} /></label>
            <label className="field-row"><span>Observação</span><input name="note" placeholder="Opcional" defaultValue={baseline?.note ?? ""} /></label>
          </div>
          {state?.error && <p id="baseline-error" className="field-error" role="alert">{state.error}</p>}
          <p className="field-note num">Saldo atual estimado: {formatCurrency(currentBalance)}</p>
        </form>
      </dialog>
    </section>
  );
}
