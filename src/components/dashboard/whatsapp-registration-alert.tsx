import { CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ParsedTransaction } from "@/types/finance";

export function WhatsAppRegistrationAlert({ transactions }: { transactions: ParsedTransaction[] }) {
  const latest = transactions[0];
  if (!latest) return null;

  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(latest.date));

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm shadow-[0_0_26px_rgba(16,185,129,0.08)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="font-medium text-foreground">Registro do WhatsApp confirmado</p>
          <p className="mt-1 truncate text-muted-foreground">
            {latest.description.replace(/^WhatsApp\s+-\s+/i, "")} · {formatCurrency(latest.amount)} · {latest.category} · {date}
          </p>
        </div>
      </div>
      <span className="shrink-0 rounded-md bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">Gravado no banco</span>
    </div>
  );
}
