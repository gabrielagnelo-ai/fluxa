import { Calculator, Ellipsis, Home, Upload, WalletCards } from "lucide-react";
import { exampleBalance, exampleCategories, exampleIncome, exampleSpent, formatAmount } from "./example-month";

const tabs = [
  { label: "Início", icon: Home, active: true },
  { label: "Transações", icon: WalletCards },
  { label: "Planejamento", icon: Calculator },
  { label: "Importar", icon: Upload },
  { label: "Mais", icon: Ellipsis }
];

/** The Fluxa overview, drawn with the app's own classes and a fictitious month, inside a neutral phone frame. */
export function PhonePreview() {
  const result = exampleIncome - exampleSpent;
  const largest = Math.max(...exampleCategories.map(item => item.spent));
  return (
    <figure className="phone" aria-label="Tela de visão geral do Fluxa com dados fictícios">
      <div className="phone-screen" aria-hidden="true">
        <div className="phone-status"><span className="num">9:41</span></div>
        <div className="phone-content">
          <p className="phone-title">Visão geral</p>
          <p className="phone-period">Outubro</p>
          <div className="card phone-card">
            <p className="overview-label">Saldo atual</p>
            <p className="phone-balance num">R$ {formatAmount(exampleBalance)}</p>
            <dl className="phone-period-grid">
              <div><dt>Entradas</dt><dd className="num">{formatAmount(exampleIncome)}</dd></div>
              <div><dt>Saídas</dt><dd className="num">{formatAmount(exampleSpent)}</dd></div>
              <div><dt>Resultado</dt><dd className="num">+{formatAmount(result)}</dd></div>
            </dl>
          </div>
          <div className="card phone-card phone-list">
            <p className="phone-card-title">Gastos por categoria</p>
            <ul>
              {exampleCategories.map(item => (
                <li key={item.name}>
                  <div><span>{item.name}</span><span className="num">{formatAmount(item.spent)}</span></div>
                  <span className="meter"><span style={{ width: `${Math.round((item.spent / largest) * 100)}%` }} /></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <nav className="phone-tabbar glass">
          {tabs.map(tab => <span key={tab.label} className={tab.active ? "is-active" : undefined}><tab.icon /><span>{tab.label}</span></span>)}
        </nav>
      </div>
      <figcaption className="phone-caption">Tela do Fluxa com dados fictícios</figcaption>
    </figure>
  );
}
