import { CountUp } from "@/components/motion/count-up";
import { cn, formatCurrency } from "@/lib/utils";

export function ProjectionCard({
  projectedExpenses,
  projectedSavings,
  elapsedDays,
  totalDays,
  confidence
}: {
  projectedIncome?: number;
  projectedExpenses: number;
  projectedSavings: number;
  elapsedDays: number;
  totalDays: number;
  confidence: string;
}) {
  const progress = totalDays > 0 ? Math.min(100, Math.round((elapsedDays / totalDays) * 100)) : 0;
  return (
    <section className="card" aria-labelledby="projection-title">
      <div className="card-header">
        <div>
          <h2 id="projection-title" className="card-title">Como o mês deve terminar</h2>
          <p className="card-subtitle">Estimativa: o que já entrou e os gastos projetados pelo ritmo do período.</p>
        </div>
      </div>
      <div className="card-body">
        <p className="overview-label">Sobra provável</p>
        <strong className={cn("projection-value", projectedSavings < 0 && "is-negative")}><CountUp value={projectedSavings} /></strong>
        <p className="projection-note num">Entradas do período menos {formatCurrency(projectedExpenses)} de gastos previstos até o fim.</p>
        <div className="meter projection-meter" role="img" aria-label={`${elapsedDays} de ${totalDays} dias do período`}><span style={{ width: `${progress}%` }} /></div>
        <p className="projection-note num">{elapsedDays} de {totalDays} dias do período · confiança {confidence.toLocaleLowerCase("pt-BR")}</p>
      </div>
    </section>
  );
}
