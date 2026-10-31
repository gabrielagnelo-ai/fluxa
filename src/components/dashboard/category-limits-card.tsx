import { displayName, formatCurrency } from "@/lib/utils";

type CategoryLimit = {
  categoryName: string;
  actual: number;
  projected: number;
  planned: number;
  projectedUsage: number;
  recurring: boolean;
  status: "leak" | "over" | "warning" | "ok";
};

/** Limits beside the ring, with the grammar of every card: title, one big number, one supporting line, then the list. */
export function CategoryLimitsCard({ limits }: { limits: CategoryLimit[] }) {
  const withLimit = limits.filter(item => item.planned > 0);
  const over = withLimit.filter(item => item.projected > item.planned);
  const noLimit = limits.filter(item => item.planned === 0 && item.actual > 0);
  const recurring = limits.filter(item => item.recurring).length;
  const rows = [...over, ...withLimit.filter(item => !over.includes(item)).sort((a, b) => b.projectedUsage - a.projectedUsage), ...noLimit];

  return (
    <section className="card" aria-labelledby="limits-title">
      <div className="card-header">
        <div>
          <h2 id="limits-title" className="card-title">Limites do mês</h2>
          <p className="card-subtitle">Gasto até agora contra o previsto no planejamento.</p>
        </div>
      </div>
      {limits.length === 0 ? (
        <p className="empty-state">Defina limites no planejamento para acompanhar cada categoria aqui.</p>
      ) : (
        <>
          <div className="card-body limits-headline">
            <strong className={over.length ? "projection-value is-negative" : "projection-value"}>{over.length ? `${over.length} ${over.length === 1 ? "categoria" : "categorias"}` : "Tudo dentro"}</strong>
            <p className="projection-note">{over.length ? "podem passar do previsto." : "do previsto até agora."} {withLimit.length} com limite · {recurring} {recurring === 1 ? "frequente" : "frequentes"}{noLimit.length ? ` · ${noLimit.length} sem limite` : ""}</p>
          </div>
          <ul className="list limits-list">
            {rows.map(item => {
              const hasLimit = item.planned > 0;
              const isOver = hasLimit && item.projected > item.planned;
              const near = hasLimit && !isOver && item.status === "warning";
              return (
                <li key={item.categoryName} className="list-row limits-row">
                  <span className="row-main">
                    <span className="row-title">{displayName(item.categoryName)}</span>
                    <span className="row-sub num">{hasLimit ? `${formatCurrency(item.actual)} de ${formatCurrency(item.planned)}` : `${formatCurrency(item.actual)} sem limite definido`}{Math.round(item.projected) !== Math.round(item.actual) ? ` · pode fechar em ${formatCurrency(item.projected)}` : ""}</span>
                  </span>
                  {hasLimit && <span className={isOver ? "row-value is-negative" : "row-value"}>{item.projectedUsage}%</span>}
                  {hasLimit && <span className="meter" aria-hidden="true"><span className={isOver ? "is-danger" : near ? "is-warning" : undefined} style={{ width: `${Math.min(100, item.projectedUsage)}%` }} /></span>}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
