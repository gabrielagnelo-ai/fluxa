import { AlertTriangle, Repeat2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

type CategoryForecastItem = {
  categoryName: string;
  actual: number;
  projected: number;
  planned: number;
  projectedUsage: number;
  recurring: boolean;
  months: number;
  status: "over" | "warning" | "ok";
};

export function CategoryForecastCard({ forecasts }: { forecasts: CategoryForecastItem[] }) {
  const relevantForecasts = forecasts.filter((item) => item.actual > 0 || item.planned > 0).slice(0, 8);
  const overCount = forecasts.filter((item) => item.status === "over").length;
  const recurringCount = forecasts.filter((item) => item.recurring).length;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold">Previsão por categoria</h2>
          <p className="text-sm text-muted-foreground">Fechamento estimado por limite, ritmo atual e recorrência.</p>
        </div>
        <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <TrendingUp className="size-5" />
        </span>
      </CardHeader>
      <CardContent>
        {relevantForecasts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
            Defina limites no Planejamento ou importe transações para gerar previsões por categoria.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryTile label="Categorias em risco" value={String(overCount)} tone={overCount > 0 ? "danger" : "success"} />
              <SummaryTile label="Categorias recorrentes" value={String(recurringCount)} />
              <SummaryTile label="Categorias analisadas" value={String(forecasts.length)} />
            </div>

            <div className="space-y-2">
              {relevantForecasts.map((item) => {
                const hasLimit = item.planned > 0;
                const progress = hasLimit ? Math.min(100, item.projectedUsage) : 0;

                return (
                  <div key={item.categoryName} className="rounded-lg border border-border bg-muted/20 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{item.categoryName}</p>
                          {item.recurring && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                              <Repeat2 className="size-3" />
                              recorrente
                            </span>
                          )}
                          {item.status !== "ok" && (
                            <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs", item.status === "over" ? "bg-red-500/10 text-red-500" : "bg-amber-400/10 text-amber-400")}>
                              <AlertTriangle className="size-3" />
                              {item.status === "over" ? "acima do limite" : "atenção"}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Realizado {formatCurrency(item.actual)} · estimado {formatCurrency(item.projected)}
                        </p>
                      </div>
                      <div className="shrink-0 text-left sm:text-right">
                        <strong>{hasLimit ? `${item.projectedUsage}%` : "-"}</strong>
                        <p className="text-sm text-muted-foreground">{hasLimit ? `limite ${formatCurrency(item.planned)}` : "sem limite"}</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-background">
                      <div className={cn("h-2 rounded-full", item.status === "over" ? "bg-red-500" : item.status === "warning" ? "bg-amber-400" : "bg-emerald-500")} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryTile({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "success" | "danger" }) {
  return (
    <div className="rounded-lg border border-border bg-background/45 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <strong className={cn("mt-1 block text-xl", tone === "success" && "text-emerald-500", tone === "danger" && "text-red-500")}>{value}</strong>
    </div>
  );
}
