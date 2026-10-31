import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";

type AlertItem = {
  id: string;
  title: string;
  description: string;
  severity: "danger" | "warning" | "info" | "success";
};

const iconBySeverity = {
  danger: ShieldAlert,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2
};

const labelBySeverity = { danger: "Importante", warning: "Atenção", info: "Dica", success: "Tudo certo" };

export function InternalAlertsCard({ alerts }: { alerts: AlertItem[] }) {
  return (
    <section className="card" aria-labelledby="alerts-title">
      <div className="card-header">
        <div>
          <h2 id="alerts-title" className="card-title">O que precisa de atenção</h2>
          <p className="card-subtitle">Sugestões práticas para evitar surpresa no fim do mês.</p>
        </div>
      </div>
      {alerts.length === 0 ? (
        <p className="empty-state">Nenhum ponto de atenção agora. Defina valores previstos e metas para o Fluxa acompanhar.</p>
      ) : (
        <ul className="list">
          {alerts.map(alert => {
            const Icon = iconBySeverity[alert.severity];
            return (
              <li key={alert.id}>
                <div className="list-row has-icon alert-row">
                  <span className={`row-icon alert-icon is-${alert.severity}`}><Icon aria-hidden="true" /><span className="sr-only">{labelBySeverity[alert.severity]}</span></span>
                  <div className="row-main"><span className="row-title">{alert.title}</span><span className="row-sub">{alert.description}</span></div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
