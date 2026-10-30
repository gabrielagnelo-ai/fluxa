"use client";

import { useState } from "react";
import { DashboardPreview } from "./dashboard-preview";
import { exampleCategories, exampleIncome, examplePlanned, exampleStatement } from "@/components/public/example-month";
import { formatCurrency, cn } from "@/lib/utils";

// Intentionally isolated fixtures: no service imports, server actions, storage,
// user identifiers, or authenticated components belong in this demonstration.
const views = [{ id: "overview", label: "Visão geral" }, { id: "planning", label: "Planejamento" }, { id: "transactions", label: "Transações" }] as const;

export function DemoExplorer() {
  const [view, setView] = useState<(typeof views)[number]["id"]>("overview");
  return (
    <div className="mt-8">
      <nav aria-label="Visões da demonstração" className="segmented max-w-md">
        {views.map((item) => <button key={item.id} type="button" id={`demo-${item.id}`} aria-pressed={view === item.id} aria-controls="demo-content" onClick={() => setView(item.id)}>{item.label}</button>)}
      </nav>
      <section id="demo-content" aria-labelledby={`demo-${view}`} className="mt-6">
        {view === "overview" && <><DashboardPreview /><p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-2">Neste exemplo, o saldo começa em {formatCurrency(1860)}. Entram {formatCurrency(5200)} e saem {formatCurrency(2860)}, resultando em {formatCurrency(4200)}. O resultado do mês é a diferença entre receitas e despesas.</p></>}
        {view === "planning" && <div className="detail p-5 sm:p-7">
          <h2 className="text-xl font-semibold">Seu dinheiro antes de gastar</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-2">Renda fictícia de {formatCurrency(exampleIncome)} e limites de {formatCurrency(examplePlanned)} no total. Restam {formatCurrency(exampleIncome - examplePlanned)} no planejamento para metas ou reserva.</p>
          <ul className="mt-6 space-y-5">{exampleCategories.map((item) => <li key={item.name}><div className="mb-2 flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-medium">{item.name}</h3><p className="num text-sm text-2">{formatCurrency(item.spent)} de {formatCurrency(item.planned)}</p></div><div role="progressbar" aria-label={`Limite de ${item.name} usado`} aria-valuemin={0} aria-valuemax={item.planned} aria-valuenow={item.spent} className="h-2 overflow-hidden rounded-full bg-[var(--line)]"><div className="h-full rounded-full bg-[var(--cyan)]" style={{ width: `${item.spent / item.planned * 100}%` }} /></div></li>)}</ul>
          <p className="mt-6 border-t border-[var(--line)] pt-4 text-sm text-2">O limite é uma previsão. Somente transações registradas ou importadas entram no gasto realizado.</p>
        </div>}
        {view === "transactions" && <div className="detail p-5 sm:p-7">
          <h2 className="text-xl font-semibold">De onde vêm os números</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-2">Seis registros fictícios explicam o mês de exemplo. Na sua conta, você poderá adicionar, editar e categorizar suas transações.</p>
          <ul className="mt-4 divide-y divide-[var(--line)]">{exampleStatement.map((item) => <li key={item.raw} className="flex items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="font-medium">{item.category === "Receita" ? "Salário de exemplo" : item.category}</p><p className="num mt-1 truncate text-xs text-2">{item.day} · {item.raw}</p></div><p className={cn("num shrink-0 text-sm font-medium", item.amount > 0 ? "text-[var(--gain)]" : "text-[var(--text)]")}>{item.amount > 0 ? "+" : "−"} {formatCurrency(Math.abs(item.amount))}</p></li>)}</ul>
        </div>}
      </section>
    </div>
  );
}
