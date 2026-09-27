import { formatCurrency } from "@/lib/utils";

const metrics = [
  ["Saldo ilustrativo", 4200, "text-primary"],
  ["Receitas", 5200, "text-success"],
  ["Despesas", 2860, "text-red-400"],
  ["Resultado do mês", 2340, "text-success"]
] as const;
export function DashboardPreview() {
  return (
    <div className="relative mx-auto mt-10 w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-card/80 p-4 shadow-card backdrop-blur">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-left">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Exemplo com dados fictícios</p>
          <h2 className="text-lg font-semibold">Dashboard financeiro</h2>
        </div>
        <span className="rounded-md bg-primary/15 px-3 py-1 text-xs text-primary">Mês de exemplo</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value, tone]) => (
          <div key={label} className="rounded-lg border border-border bg-background/55 p-4 text-left">
            <p className="text-sm text-muted-foreground">{label}</p>
            <strong className={`mt-2 block text-xl ${tone}`}>{formatCurrency(value)}</strong>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-lg border border-border bg-background/55 p-4">
          <p className="text-sm font-medium">Gastos por categoria</p>
          <div className="mt-4 grid place-items-center">
            <div className="relative size-28 rounded-full border-[16px] border-primary border-r-red-500 border-t-success">
              <div className="absolute inset-4 rounded-full bg-background/95" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background/55 p-4">
          <p className="text-sm font-medium">Últimas transações</p>
          <div className="mt-4 space-y-2 text-sm">
            {[
              ["Mercado do bairro", "Saída", "text-red-400"],
              ["Transporte", "Saída", "text-red-400"],
              ["Reserva de emergência", "Meta", "text-success"]
            ].map(([item, type, tone]) => (
              <div key={item} className="flex items-center justify-between gap-4 rounded-md bg-card/70 px-3 py-2">
                <span className="truncate font-medium">{item}</span>
                <span className={tone}>{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


