import { cn, formatCurrency } from "@/lib/utils";

export function ProjectionCard({
  projectedIncome,
  projectedExpenses,
  projectedSavings,
  elapsedDays,
  totalDays,
  confidence
}: {
  projectedIncome: number;
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
        <strong className={cn("projection-value num", projectedSavings < 0 && "is-negative")}>{formatCurrency(projectedSavings)}</strong>
        <ul className="list projection-list">
          <li className="list-row"><span className="row-main row-title">Dinheiro que entrou</span><span className="row-value">{formatCurrency(projectedIncome)}</span></li>
          <li className="list-row"><span className="row-main row-title">Gastos previstos</span><span className="row-value">{formatCurrency(projectedExpenses)}</span></li>
        </ul>
        <div className="meter" role="img" aria-label={`${elapsedDays} de ${totalDays} dias do período`}><span style={{ width: `${progress}%` }} /></div>
        <p className="projection-note num">{elapsedDays} de {totalDays} dias do período · confiança {confidence}</p>
      </div>
    </section>
  );
}
