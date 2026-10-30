import { exampleCategories, exampleSpent, exampleStatement } from "@/components/public/example-month";
import { formatCurrency } from "@/lib/utils";

const metrics = [
  ["Saldo", 4200, "text-[var(--text)]"],
  ["Receitas", 5200, "text-[var(--gain)]"],
  ["Despesas", 2860, "text-[var(--danger)]"],
  ["Resultado", 2340, "text-[var(--gain)]"]
] as const;

// Public preview of the dashboard with fictitious data: numbers always carry their label and period.
export function DashboardPreview() {
  const largest = Math.max(...exampleCategories.map((item) => item.spent));
  return (
    <div className="detail overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-3">
        <p className="mono-label !text-[11px] text-[var(--text)]">Outubro · mês de exemplo</p>
        <p className="mono-label hidden !text-[11px] sm:block">Dados fictícios</p>
      </div>
      <dl className="grid grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value, tone], index) => (
          <div key={label} className={`border-[var(--line)] px-5 py-4 ${index % 2 === 0 ? "border-r" : ""} ${index < 2 ? "border-b lg:border-b-0" : ""} lg:border-r lg:last:border-r-0`}>
            <dt className="text-sm text-2">{label}</dt>
            <dd className={`num mt-1 text-lg font-medium sm:text-xl ${tone}`}>{formatCurrency(value)}</dd>
          </div>
        ))}
      </dl>
      <div className="grid border-t border-[var(--line)] lg:grid-cols-2">
        <div className="px-5 py-5 lg:border-r lg:border-[var(--line)]">
          <p className="font-medium">Gastos por categoria</p>
          <ul className="mt-4 space-y-3">
            {exampleCategories.map((item) => (
              <li key={item.name}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{item.name}</span>
                  <span className="num">{formatCurrency(item.spent)} <span className="text-2">{Math.round((item.spent / exampleSpent) * 100)}%</span></span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--line)]"><div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${(item.spent / largest) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-[var(--line)] px-5 py-5 lg:border-t-0">
          <p className="font-medium">Últimas transações</p>
          <ul className="mt-3 divide-y divide-[var(--line)]">
            {exampleStatement.slice(-3).reverse().map((item) => (
              <li key={item.raw} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate">{item.category}</p>
                  <p className="num mt-0.5 text-xs text-2">{item.day}</p>
                </div>
                <span className="num shrink-0">−{formatCurrency(Math.abs(item.amount))}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
