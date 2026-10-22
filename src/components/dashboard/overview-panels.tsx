"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

type OverviewProps = {
  balance: number; estimated: boolean; income: number; expenses: number;
  categories: { name: string; value: number }[]; goals: { name: string; targetAmount: number; contributedAmount: number }[];
};

export function OverviewPanels({ balance, estimated, income, expenses, categories, goals }: OverviewProps) {
  const [page, setPage] = useState(0);
  const sorted = [...categories].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, item) => sum + item.value, 0);
  const pageCount = Math.ceil(sorted.length / 4);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  return <section className="overview-panels" aria-label="Resumo financeiro">
    <div className="overview-balance-column">
      <Card className="overview-balance">
        <div className="panel-heading"><span title={estimated ? "Resultado das movimentações importadas" : "Saldo inicial + entradas − saídas"}>{estimated ? "Saldo estimado" : "Saldo atual"}</span><WalletCards size={18} aria-hidden="true" /></div>
        <strong className={cn("overview-balance-value", balance < 0 && "text-red-400")}>{formatCurrency(balance)}</strong>
      </Card>
      <Card className="overview-insight">
        <h2>Resultado do período</h2>
        <strong className={cn("period-result", income - expenses < 0 ? "text-red-400" : "text-emerald-400")}>{formatCurrency(income - expenses)}</strong>
        <div className="overview-cashflow"><span>Receitas <strong className="text-emerald-400">{formatCurrency(income)}</strong></span><span>Despesas <strong className="text-red-400">{formatCurrency(expenses)}</strong></span></div>
        <Link href="/planning">Revisar planejamento<ChevronRight size={15} aria-hidden="true" /></Link>
      </Card>
    </div>
    <Card className="overview-categories">
      <div className="panel-heading"><h2>Gastos por categoria</h2><Link href="/transactions" aria-label="Ver transações por categoria"><ChevronRight size={17} /></Link></div>
      <div className="overview-category-total"><strong>{formatCurrency(total)}</strong><span>no período selecionado</span></div>
      {sorted.length ? <ul key={currentPage} className="overview-category-list widget-page-content">{sorted.slice(currentPage * 4, currentPage * 4 + 4).map((item, index) => {
        const percent = total > 0 ? Math.round(item.value / total * 100) : 0;
        return <li key={item.name}><span className="category-symbol" aria-hidden="true">{item.name.slice(0, 1)}</span><div className="category-info"><span>{item.name}</span><div className="category-track"><span style={{ width: `${percent}%`, opacity: Math.max(0.4, 1 - index * 0.12) }} /></div></div><div className="category-amount"><strong>{formatCurrency(item.value)}</strong><span>{percent}%</span></div></li>;
      })}</ul> : <div className="overview-empty">Suas categorias aparecem aqui depois de importar um extrato.<Link href="/import">Importar extrato</Link></div>}

      {pageCount > 1 && <div className="widget-pagination"><button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} aria-label="Categorias anteriores">Anterior</button><span aria-live="polite">{currentPage + 1} / {pageCount}</span><button type="button" disabled={currentPage === pageCount - 1} onClick={() => setPage(currentPage + 1)} aria-label="Próximas categorias">Próximas</button></div>}
    </Card>
    <Card className="overview-goals">
      <div className="panel-heading"><h2>Metas e reserva</h2><Link href="/goals" aria-label="Ver metas"><ChevronRight size={17} /></Link></div>
      {goals.length ? <><strong className="goals-total">{formatCurrency(goals.reduce((total, goal) => total + goal.contributedAmount, 0))}</strong><p className="goals-caption">guardados para suas conquistas</p><ul className="goals-summary-list">{goals.slice(0, 2).map((goal, index) => {
        const progress = goal.targetAmount > 0 ? Math.min(100, Math.round(goal.contributedAmount / goal.targetAmount * 100)) : 0;
        return <li key={`${goal.name}-${index}`}><div><span>{goal.name}</span><strong>{progress}%</strong></div><div className="category-track"><span style={{width:`${progress}%`}}/></div><small>{formatCurrency(goal.contributedAmount)} de {formatCurrency(goal.targetAmount)}</small></li>;
      })}</ul></> : <div className="goals-empty"><span className="goals-empty-mark" aria-hidden="true">↗</span><h3>Sua próxima conquista começa aqui</h3><p>Defina uma meta e acompanhe quanto falta para chegar lá.</p><Link href="/goals">Criar minha primeira meta<ChevronRight size={14} aria-hidden="true" /></Link></div>}
    </Card>
  </section>;
}
