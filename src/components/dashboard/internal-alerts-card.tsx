"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";

type Severity = "danger" | "warning" | "info" | "success";
type AlertItem = {
  id: string;
  title: string;
  description: string;
  severity: Severity;
};

const iconBySeverity = { danger: ShieldAlert, warning: AlertTriangle, info: Info, success: CheckCircle2 };
const labelBySeverity = { danger: "Importante", warning: "Atenção", info: "Sugestão", success: "Tudo certo" };
const order: Record<Severity, number> = { danger: 0, warning: 1, info: 2, success: 3 };
const VISIBLE = 3;

/** The one place for warnings on the overview: most severe first, three visible, the rest on demand. */
export function InternalAlertsCard({ alerts }: { alerts: AlertItem[] }) {
  const [showAll, setShowAll] = useState(false);
  const sorted = [...alerts].sort((a, b) => order[a.severity] - order[b.severity]);
  const visible = showAll ? sorted : sorted.slice(0, VISIBLE);
  return (
    <section className="card" aria-labelledby="alerts-title">
      <div className="card-header">
        <div>
          <h2 id="alerts-title" className="card-title">O que precisa de atenção</h2>
          <p className="card-subtitle">{alerts.length ? `${alerts.length} ${alerts.length === 1 ? "ponto" : "pontos"} para evitar surpresa no fim do mês.` : "Sugestões práticas para evitar surpresa no fim do mês."}</p>
        </div>
      </div>
      {alerts.length === 0 ? (
        <p className="empty-state">Nenhum ponto de atenção agora. Defina valores previstos e metas para o Fluxa acompanhar.</p>
      ) : (
        <>
          <ul className="list">
            {visible.map(alert => {
              const Icon = iconBySeverity[alert.severity];
              return (
                <li key={alert.id}>
                  <div className="list-row has-icon alert-row">
                    <span className={`row-icon alert-icon is-${alert.severity}`}><Icon aria-hidden="true" /><span className="sr-only">{labelBySeverity[alert.severity]}: </span></span>
                    <div className="row-main"><span className="row-title">{alert.title}</span><span className="row-sub">{alert.description}</span></div>
                  </div>
                </li>
              );
            })}
          </ul>
          {sorted.length > VISIBLE && (
            <button type="button" className="btn btn-plain card-more" aria-expanded={showAll} onClick={() => setShowAll(value => !value)}>
              {showAll ? "Mostrar menos" : `Mostrar todos os ${sorted.length}`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
