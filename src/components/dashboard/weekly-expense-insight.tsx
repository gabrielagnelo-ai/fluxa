import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

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
  const maxDay = Math.max(...days.map((day) => day.amount), 1);
  const tone = increased ? "text-red-400" : decreased ? "text-emerald-400" : "text-muted-foreground";
  const TrendIcon = increased ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="overflow-hidden border-border/80 bg-card/95">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Gastos da semana</p>
            <div className="mt-1 flex flex-wrap items-end gap-2">
              <strong className="text-2xl leading-none text-foreground">{formatCurrency(total)}</strong>
              {trendPercent > 0 && (
                <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", tone)}>
                  <TrendIcon className="size-4" />
                  {trendPercent}%
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {previousTotal > 0 ? `${formatCurrency(Math.abs(difference))} ${increased ? "acima" : "abaixo"} da semana anterior.` : "Comparativo será exibido com mais histórico."}
            </p>
          </div>
          <Link
            href="/insights"
            aria-label="Abrir insights financeiros"
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-background/60 text-muted-foreground transition hover:border-primary/50 hover:text-primary"
          >
            <ChevronRight className="size-5" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-7 items-end gap-3">
          {days.map((day) => {
            const height = day.amount > 0 ? Math.max(18, Math.round((day.amount / maxDay) * 86)) : 12;

            return (
              <div key={day.date} className="flex flex-col items-center gap-2">
                <div className="flex h-24 items-end">
                  <div
                    className={cn(
                      "w-4 rounded-full transition-all",
                      day.amount > 0 ? "bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.35)]" : "border border-dashed border-muted-foreground/35 bg-transparent"
                    )}
                    style={{ height }}
                    title={`${day.label}: ${formatCurrency(day.amount)}`}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{day.label}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-border/70 pt-4 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-primary" />
          <span>Insights financeiros</span>
        </div>
      </CardContent>
    </Card>
  );
}
