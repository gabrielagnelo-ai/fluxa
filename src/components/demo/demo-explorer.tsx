"use client";

import { useState, type CSSProperties } from "react";
import { CategoryLimitsCard } from "@/components/dashboard/category-limits-card";
import { CreditAnalysis } from "@/components/dashboard/credit-analysis";
import { FinanceCharts } from "@/components/dashboard/finance-charts";
import { GoalsEvolution } from "@/components/dashboard/goals-evolution";
import { InternalAlertsCard } from "@/components/dashboard/internal-alerts-card";
import { OverviewPanels } from "@/components/dashboard/overview-panels";
import { ProjectionCard } from "@/components/dashboard/projection-card";
import { WeeklyExpenseInsight } from "@/components/dashboard/weekly-expense-insight";
import { exampleBalance, exampleCategories, exampleGoal, exampleHistory, exampleIncome, exampleOpening, examplePlanned, exampleSpent, exampleStatement } from "@/components/public/example-month";
import { cn, formatCurrency } from "@/lib/utils";

// Fictitious month only: no service, server action, storage or user data reaches this page.
const categoryData = exampleCategories.map(item => ({ name: item.name, value: item.spent }));
const limits = exampleCategories.map(item => {
  const projectedUsage = Math.round((item.spent / item.planned) * 100);
  return { categoryName: item.name, actual: item.spent, projected: item.spent, planned: item.planned, projectedUsage, recurring: true, status: projectedUsage >= 90 ? "warning" as const : "ok" as const };
});
const goalContributed = exampleGoal.contributions.reduce((sum, item) => sum + item.amount, 0);
const alerts = [
  { id: "moradia", title: "Moradia perto do limite", description: "Uso de 97% do limite mensal.", severity: "warning" as const },
  { id: "meta", title: "Reserva de emergência em andamento", description: `${Math.round((goalContributed / exampleGoal.targetAmount) * 100)}% concluído pelo dinheiro guardado identificado.`, severity: "info" as const },
  { id: "sobra", title: "O mês fecha no positivo", description: `Sobram ${formatCurrency(exampleIncome - exampleSpent)} depois de todos os gastos.`, severity: "success" as const }
];
const weekLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
const weekDays = weekLabels.map((label, index) => {
  const row = exampleStatement.filter(item => item.amount < 0)[index];
  return { label, amount: row ? Math.abs(row.amount) : 0, date: `2026-10-${String(6 + index).padStart(2, "0")}` };
});
const weekTotal = weekDays.reduce((sum, day) => sum + day.amount, 0);
const views = [{ id: "overview", label: "Visão geral" }, { id: "planning", label: "Planejamento" }, { id: "transactions", label: "Transações" }] as const;
const step = (index: number) => ({ "--i": index }) as CSSProperties;

export function DemoExplorer() {
  const [view, setView] = useState<(typeof views)[number]["id"]>("overview");
  return (
    <div className="fluxa-page">
      <div className="segmented demo-tabs" role="tablist" aria-label="Telas da demonstração">
        {views.map(item => <button key={item.id} type="button" role="tab" id={`demo-${item.id}`} aria-selected={view === item.id} aria-controls="demo-content" onClick={() => setView(item.id)}>{item.label}</button>)}
      </div>
      <div id="demo-content" role="tabpanel" aria-labelledby={`demo-${view}`}>
        {view === "overview" && (
          <div className="fluxa-page">
            <div className="dashboard-grid">
              <div data-reveal className="span-7" style={step(0)}><OverviewPanels balance={exampleBalance} estimated={false} income={exampleIncome} expenses={exampleSpent} hasData /></div>
              <div data-reveal className="span-5" style={step(1)}><ProjectionCard projectedIncome={exampleIncome} projectedExpenses={exampleSpent} projectedSavings={exampleIncome - exampleSpent} elapsedDays={31} totalDays={31} confidence="Alta" /></div>
              <div data-reveal className="span-7" style={step(2)}><InternalAlertsCard alerts={alerts} /></div>
              <div data-reveal className="span-5" style={step(3)}><WeeklyExpenseInsight total={weekTotal} previousTotal={0} difference={weekTotal} trendPercent={0} increased={false} decreased={false} days={weekDays} /></div>
            </div>
            <h2 className="section-title dashboard-section-heading">Para onde o dinheiro foi</h2>
            <div className="dashboard-grid">
              <div data-reveal className="span-7 natural"><FinanceCharts categoryData={categoryData} evolutionData={[]} view="categories" /></div>
              <div data-reveal className="span-5 natural" style={step(1)}><CategoryLimitsCard limits={limits} /></div>
              <div data-reveal className="span-12"><FinanceCharts categoryData={categoryData} evolutionData={exampleHistory} view="evolution" /></div>
              <div data-reveal className="span-12"><CreditAnalysis origins={[{ name: "Salário", amount: exampleIncome, count: 1, share: 100, recurring: true }]} /></div>
            </div>
            <h2 className="section-title dashboard-section-heading">Metas</h2>
            <div className="dashboard-grid">
              <div data-reveal className="span-12"><GoalsEvolution goals={[{ ...exampleGoal, contributedAmount: goalContributed }]} /></div>
            </div>
            <p className="demo-note num">Neste exemplo, o mês começa com {formatCurrency(exampleOpening)}. Entram {formatCurrency(exampleIncome)} e saem {formatCurrency(exampleSpent)}, e o saldo fecha em {formatCurrency(exampleBalance)}.</p>
          </div>
        )}
        {view === "planning" && (
          <section className="card" aria-labelledby="demo-planning-title" data-reveal>
            <div className="card-header"><div>
              <h2 id="demo-planning-title" className="card-title">Seu dinheiro antes de gastar</h2>
              <p className="card-subtitle num">Renda de {formatCurrency(exampleIncome)} e limites de {formatCurrency(examplePlanned)}. Sobram {formatCurrency(exampleIncome - examplePlanned)} para metas ou reserva.</p>
            </div></div>
            <ul className="list">
              {exampleCategories.map(item => {
                const usage = Math.round((item.spent / item.planned) * 100);
                return (
                  <li key={item.name}>
                    <div className="list-row credit-row">
                      <div className="row-main"><span className="row-title">{item.name}</span><span className="row-sub num">{formatCurrency(item.spent)} de {formatCurrency(item.planned)}</span></div>
                      <span className="row-value">{usage}%</span>
                      <div className="meter" role="progressbar" aria-label={`Limite de ${item.name} usado`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={usage}><span className={cn(usage >= 90 && "is-warning")} style={{ width: `${Math.min(100, usage)}%` }} /></div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="field-note demo-card-note">O limite é uma previsão. Só transações registradas ou importadas contam como gasto.</p>
          </section>
        )}
        {view === "transactions" && (
          <section className="card" aria-labelledby="demo-transactions-title" data-reveal>
            <div className="card-header"><div>
              <h2 id="demo-transactions-title" className="card-title">De onde vêm os números</h2>
              <p className="card-subtitle">Seis registros fictícios explicam o mês. Na sua conta, dá para adicionar, editar e categorizar cada um.</p>
            </div></div>
            <ul className="list">
              {exampleStatement.map(item => (
                <li key={item.raw} className="list-row">
                  <span className="example-day num">{item.day}</span>
                  <span className="row-main"><span className="row-title">{item.raw}</span><span className="row-sub">{item.category}</span></span>
                  <span className="row-value">{item.amount > 0 ? "+" : "−"}{formatCurrency(Math.abs(item.amount))}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
