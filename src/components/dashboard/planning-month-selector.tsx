import Link from "next/link";

function monthInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function monthHref(date: Date) {
  return `/planning?month=${date.getMonth() + 1}&year=${date.getFullYear()}`;
}

export function PlanningMonthSelector({ month, year }: { month: number; year: number }) {
  const selected = new Date(year, month - 1, 1);
  const current = new Date();
  const currentMonth = new Date(current.getFullYear(), current.getMonth(), 1);
  const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card/70 p-3 sm:flex-row sm:items-end">
      <form action="/planning" className="flex items-end gap-2">
        <label className="space-y-1">
          <span className="block text-xs font-medium text-muted-foreground">Mes do planejamento</span>
          <input
            type="month"
            name="date"
            defaultValue={monthInputValue(selected)}
            className="premium-input h-10 rounded-xl px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <button className="btn-primary h-10 rounded-xl px-4 text-sm font-semibold">Abrir</button>
      </form>

      <div className="flex gap-2 sm:ml-auto">
        <Link href={monthHref(currentMonth)} className="rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
          Mes atual
        </Link>
        <Link href={monthHref(nextMonth)} className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/15">
          Proximo mes
        </Link>
      </div>
    </div>
  );
}
