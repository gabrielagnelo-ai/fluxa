import { displayName, formatCurrency } from "@/lib/utils";

type CreditOrigin = {
  name: string;
  amount: number;
  count: number;
  share: number;
  recurring: boolean;
};

export function CreditAnalysis({ origins }: { origins: CreditOrigin[] }) {
  const recurringCount = origins.filter(origin => origin.recurring).length;

  return (
    <section className="card" aria-labelledby="credit-title">
      <div className="card-header">
        <div>
          <h2 id="credit-title" className="card-title">De onde veio o dinheiro</h2>
          <p className="card-subtitle">Principais entradas e quanto cada uma representa no período.</p>
          {origins.length > 0 && <p className="card-subtitle num">{recurringCount === 0 ? "Nenhuma origem se repete no período." : `${recurringCount} de ${origins.length} ${origins.length === 1 ? "origem" : "origens"} ${recurringCount === 1 ? "aparece" : "aparecem"} com frequência.`}</p>}
        </div>
      </div>
      {origins.length === 0 ? (
        <p className="empty-state">Nenhuma entrada encontrada no período.</p>
      ) : (
        <>
          <ul className="list">
            {origins.slice(0, 6).map(origin => (
              <li key={origin.name}>
                <div className="list-row credit-row">
                  <div className="row-main">
                    <span className="row-title truncate" title={origin.name}>{displayName(origin.name)}</span>
                    <span className="row-sub num">{origin.count} {origin.count === 1 ? "entrada" : "entradas"} · {origin.recurring ? "aparece com frequência" : "pontual"}</span>
                  </div>
                  <span className="row-value">{formatCurrency(origin.amount)}<small>{origin.share}%</small></span>
                  <div className="meter" aria-hidden="true"><span style={{ width: `${origin.share}%` }} /></div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
