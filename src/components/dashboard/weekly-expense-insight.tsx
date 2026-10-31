import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type WeeklyExpenseInsightProps = {
  total: number;
  previousTotal: number;
  difference: number;
  trendPercent: number;
  increased: boolean;
  decreased: boolean;
  days: {
    label: string;
    amount: number;
    date: string;
  }[];
};

export function WeeklyExpenseInsight({ total, previousTotal, difference, trendPercent, increased, decreased, days }: WeeklyExpenseInsightProps) {
  const maxDay = Math.max(...days.map(day => day.amount), 1);
  const TrendIcon = increased ? ArrowUpRight : ArrowDownRight;

  return (
    <section className="card" aria-labelledby="weekly-title">
      <div className="card-header">
        <div>
          <h2 id="weekly-title" className="card-title">Gastos da semana</h2>
          <p className="card-subtitle">Semana do último gasto registrado, de segunda a domingo.</p>
        </div>
        <Link href="/transactions" aria-label="Ver transações da semana" className="icon-btn btn-gray"><ChevronRight aria-hidden="true" /></Link>
      </div>
      <div className="card-body">
        <div className="weekly-total">
          <strong className="projection-value num">{formatCurrency(total)}</strong>
          {previousTotal > 0 && trendPercent > 0 && (increased || decreased) && <span className={increased ? "tag is-danger" : "tag"}><TrendIcon aria-hidden="true" />{increased ? "+" : "−"}{trendPercent}%</span>}
        </div>
        <p className="projection-note">
          {previousTotal > 0 ? `${formatCurrency(Math.abs(difference))} ${increased ? "acima" : "abaixo"} da semana anterior.` : "O comparativo aparece quando houver uma semana anterior registrada."}
        </p>
        <ol className="weekly-bars" aria-label="Gastos por dia">
          {days.map(day => {
            const height = day.amount > 0 ? Math.max(10, Math.round((day.amount / maxDay) * 100)) : 0;
            return (
              <li key={day.date}>
                <span className="weekly-bar-track"><span className="weekly-bar" style={{ height: `${height}%` }} /></span>
                <span className="weekly-day" aria-hidden="true">{day.label}</span>
                <span className="sr-only">{day.label}: {formatCurrency(day.amount)}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
