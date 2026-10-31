import { formatCurrency } from "@/lib/utils";

type CreditOrigin = {
  name: string;
  amount: number;
  count: number;
  share: number;
  recurring: boolean;
};

export function CreditAnalysis({ origins }: { origins: CreditOrigin[] }) {
  const total = origins.reduce((sum, origin) => sum + origin.amount, 0);
  const mainOrigin = origins[0];
  const recurringCount = origins.filter(origin => origin.recurring).length;

  return (
    <section className="card" aria-labelledby="credit-title">
      <div className="card-header">
        <div>
          <h2 id="credit-title" className="card-title">De onde veio o dinheiro</h2>
          <p className="card-subtitle">Principais entradas e quanto cada uma representa no período.</p>
        </div>
      </div>
      {origins.length === 0 ? (
        <p className="empty-state">Nenhuma entrada encontrada no período.</p>
      ) : (
        <>
          <dl className="stat-strip">
            <div><dt>Total recebido</dt><dd className="num">{formatCurrency(total)}</dd></div>
            <div><dt>Principal origem</dt><dd className="truncate" title={mainOrigin?.name}>{mainOrigin?.name ?? "-"}</dd>{mainOrigin && <dd className="stat-note num">{mainOrigin.share}% das entradas</dd>}</div>
            <div><dt>Entradas frequentes</dt><dd className="num">{recurringCount}</dd><dd className="stat-note num">de {origins.length} {origins.length === 1 ? "origem" : "origens"}</dd></div>
          </dl>
          <ul className="list">
            {origins.slice(0, 6).map(origin => (
              <li key={origin.name}>
                <div className="list-row">
                  <div className="row-main">
                    <span className="row-title truncate" title={origin.name}>{origin.name}</span>
                    <span className="row-sub num">{origin.count} {origin.count === 1 ? "entrada" : "entradas"} · {origin.recurring ? "aparece com frequência" : "pontual"}</span>
                    <div className="meter" aria-hidden="true"><span style={{ width: `${origin.share}%` }} /></div>
                  </div>
                  <span className="row-value">{formatCurrency(origin.amount)}<small>{origin.share}%</small></span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
