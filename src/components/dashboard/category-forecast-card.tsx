import Link from "next/link";
import { AlertTriangle, ChevronRight, Repeat2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type CategoryForecastItem = {
  categoryName: string;
  actual: number;
  projected: number;
  planned: number;
  projectedUsage: number;
  recurring: boolean;
  months: number;
  status: "leak" | "over" | "warning" | "ok";
};

const statusLabel = { leak: "sem valor previsto", over: "acima do previsto", warning: "perto do limite", ok: "" };

export function CategoryForecastCard({ forecasts }: { forecasts: CategoryForecastItem[] }) {
  const relevantForecasts = forecasts.filter(item => item.actual > 0 || item.planned > 0).slice(0, 8);
  const riskCount = forecasts.filter(item => item.status === "leak" || item.status === "over").length;
  const recurringCount = forecasts.filter(item => item.recurring).length;

  return (
    <section className="card" aria-labelledby="forecast-title">
      <div className="card-header">
        <div>
          <h2 id="forecast-title" className="card-title">Gastos que merecem atenção</h2>
          <p className="card-subtitle">Categorias que podem passar do combinado ou ainda não têm valor previsto.</p>
        </div>
      </div>
      {relevantForecasts.length === 0 ? (
        <div className="empty-state">
          Defina valores no planejamento ou importe transações para acompanhar os gastos por categoria.
          <br /><Link href="/planning">Abrir planejamento<ChevronRight size={16} aria-hidden="true" /></Link>
        </div>
      ) : (
        <>
          <dl className="stat-strip">
            <div><dt>Precisam de atenção</dt><dd className={cn("num", riskCount > 0 && "is-negative")}>{riskCount}</dd></div>
            <div><dt>Gastos frequentes</dt><dd className="num">{recurringCount}</dd></div>
            <div><dt>Categorias analisadas</dt><dd className="num">{forecasts.length}</dd></div>
          </dl>
          <ul className="list">
            {relevantForecasts.map(item => {
              const hasLimit = item.planned > 0;
              const progress = hasLimit ? Math.min(100, item.projectedUsage) : item.status === "leak" ? 100 : 0;
              const risky = item.status === "leak" || item.status === "over";
              return (
                <li key={item.categoryName}>
                  <div className="list-row forecast-row">
                    <div className="row-main">
                      <span className="row-title">{item.categoryName}</span>
                      <span className="forecast-tags">
                        {item.recurring && <span className="tag"><Repeat2 aria-hidden="true" />aparece sempre</span>}
                        {item.status !== "ok" && <span className={cn("tag", risky ? "is-danger" : "is-warning")}><AlertTriangle aria-hidden="true" />{statusLabel[item.status]}</span>}
                      </span>
                      <span className="row-sub num">Já gasto {formatCurrency(item.actual)} · pode fechar em {formatCurrency(item.projected)}</span>
                      <div className="meter" aria-hidden="true"><span className={risky ? "is-danger" : item.status === "warning" ? "is-warning" : undefined} style={{ width: `${progress}%` }} /></div>
                    </div>
                    <span className="row-value">
                      <span className={cn(item.status === "leak" && "is-negative")}>{hasLimit ? `${item.projectedUsage}%` : "sem limite"}</span>
                      <small>{hasLimit ? `de ${formatCurrency(item.planned)}` : "sem previsto"}</small>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
