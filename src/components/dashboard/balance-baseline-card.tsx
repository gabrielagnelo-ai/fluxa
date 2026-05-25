"use client";

import { Save, WalletCards } from "lucide-react";
import { useActionState } from "react";
import { saveBalanceBaseline } from "@/app/(dashboard)/dashboard/actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Saldo inicial da conta</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Se sua conta ja tinha dinheiro antes do primeiro extrato importado, informe o saldo inicial. O Fluxa soma esse valor com
              entradas e saidas para chegar no saldo atual estimado.
            </p>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-500/10 text-blue-500">
            <WalletCards className="size-5" />
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-3 xl:grid-cols-[180px_220px_1fr_auto]">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Data inicial</span>
            <Input name="date" type="date" defaultValue={toDateInputValue(baseline?.date) || toDateInputValue(defaultDate.toISOString())} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Saldo nessa data</span>
            <Input name="amount" inputMode="decimal" placeholder="Ex: 250,00" defaultValue={baseline ? String(baseline.amount).replace(".", ",") : ""} />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Observacao</span>
            <Input name="note" placeholder="Ex: saldo antes do extrato de maio" defaultValue={baseline?.note ?? ""} />
          </label>
          <button type="submit" disabled={pending} className="btn-primary mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60">
            <Save className="size-4" />
            {pending ? "Salvando..." : "Salvar"}
          </button>
        </form>

        <div className="mt-4 grid gap-3 text-sm lg:grid-cols-[1fr_auto] lg:items-center">
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-muted-foreground">
            Sem saldo inicial, o app mostra apenas o resultado das movimentacoes importadas. Com saldo inicial, o saldo atual fica mais
            parecido com o banco.
          </p>
          <p className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 font-semibold text-foreground">
            Saldo atual estimado: {formatCurrency(currentBalance)}
          </p>
        </div>

        {state?.error && <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{state.error}</p>}
        {state?.success && <p className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{state.success}</p>}
      </CardContent>
    </Card>
  );
}
