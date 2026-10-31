import Link from "next/link";
import { ChevronRight, Upload } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type OverviewProps = { balance: number; estimated: boolean; income: number; expenses: number; hasData: boolean };

/** The answer of the screen: balance first, then the period result with its two parts. */
export function OverviewPanels({ balance, estimated, income, expenses, hasData }: OverviewProps) {
  const result = income - expenses;
  return (
    <section className="card overview-summary" aria-labelledby="overview-balance-label">
      <div className="card-pad">
        <div className="overview-summary-top">
          <p id="overview-balance-label" className="overview-label">{estimated ? "Saldo estimado" : "Saldo atual"}</p>
          {estimated && <span className="tag">sem saldo inicial</span>}
        </div>
        <strong className={cn("overview-balance num", balance < 0 && "is-negative")}>{formatCurrency(balance)}</strong>
        <p className="overview-caption">{estimated ? "Soma das movimentações importadas. Informe o saldo inicial, no fim da página, para chegar perto do banco." : "Saldo inicial mais entradas, menos saídas."}</p>
      </div>
      <dl className="overview-period">
        <div><dt>Entradas</dt><dd className="num">{formatCurrency(income)}</dd></div>
        <div><dt>Saídas</dt><dd className="num">{formatCurrency(expenses)}</dd></div>
        <div><dt>Resultado</dt><dd className={cn("num", result < 0 && "is-negative")}>{result > 0 ? "+" : ""}{formatCurrency(result)}</dd></div>
      </dl>
      <p className="overview-footnote">Resultado = entradas menos saídas no período. Não inclui o saldo inicial nem é o saldo do banco.</p>
      <div className="list overview-links">
        {hasData
          ? <Link href="/planning" className="list-row"><span className="row-main row-title">Revisar planejamento</span><ChevronRight className="row-chevron" aria-hidden="true" /></Link>
          : <div className="list-row"><span className="row-main row-sub">Importe um extrato para ver para onde o mês foi.</span><Link href="/import" className="btn btn-filled"><Upload aria-hidden="true" />Importar extrato</Link></div>}
      </div>
    </section>
  );
}
