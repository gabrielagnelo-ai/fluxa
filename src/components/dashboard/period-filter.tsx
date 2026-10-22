import { CalendarDays, ChevronDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateInput } from "@/utils/period";

export function PeriodFilter({ start, end }: { start: Date; end: Date }) {
  const startValue = formatDateInput(start);
  const endValue = formatDateInput(end);
  const startDate = new Date(`${startValue}T12:00:00Z`);
  const endDate = new Date(`${endValue}T12:00:00Z`);
  const monthEnd = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 0)).getUTCDate();
  const fullMonth = startValue.slice(0, 7) === endValue.slice(0, 7) && startValue.endsWith("-01") && endDate.getUTCDate() === monthEnd;
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(startDate);
  const shortDate = (date: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(date).replace(/\./g, "");
  const label = fullMonth ? monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1) : `${shortDate(startDate)} — ${shortDate(endDate)}`;
  return <details className="period-picker">
    <summary aria-label={`Alterar período: ${label}`}><CalendarDays aria-hidden="true" /><span>{label}</span><ChevronDown className="period-chevron" aria-hidden="true" /></summary>
    <form className="period-filter" action=""><p className="period-filter-title">Período de análise</p>
      <label><span>Início</span><Input name="start" type="date" defaultValue={startValue} /></label>
      <label><span>Fim</span><Input name="end" type="date" defaultValue={endValue} /></label>
      <Button><Filter className="size-4" />Atualizar período</Button>
    </form>
  </details>;
}
