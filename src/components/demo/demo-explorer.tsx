"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DashboardPreview } from "./dashboard-preview";
import { formatCurrency, cn } from "@/lib/utils";

// Intentionally isolated fixtures: no service imports, server actions, storage,
// user identifiers, or authenticated components belong in this demonstration.
const categories = [
  { name: "Moradia", planned: 1500, spent: 1450 },
  { name: "Mercado", planned: 850, spent: 620 },
  { name: "Transporte", planned: 350, spent: 290 },
  { name: "Lazer", planned: 400, spent: 200 },
  { name: "Outros", planned: 450, spent: 300 }
];
const transactions = [
  { date: "Dia 05", name: "Salário de exemplo", category: "Receita", amount: 5200 },
  ...categories.map((item, index) => ({ date: `Dia ${String(index + 6).padStart(2, "0")}`, name: item.name === "Mercado" ? "Mercado do bairro" : `${item.name} de exemplo`, category: item.name, amount: -item.spent }))
];
const views = [{ id: "overview", label: "Visão geral" }, { id: "planning", label: "Planejamento" }, { id: "transactions", label: "Transações" }] as const;

export function DemoExplorer() {
  const [view, setView] = useState<(typeof views)[number]["id"]>("overview");
  return (
    <div className="mt-6">
      <nav aria-label="Visões da demonstração" className="flex flex-wrap gap-2">{views.map((item) => <button key={item.id} type="button" id={`demo-${item.id}`} aria-pressed={view === item.id} aria-controls="demo-content" onClick={() => setView(item.id)} className={cn("min-h-11 rounded-xl border px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary", view === item.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground")}>{item.label}</button>)}</nav>
      <section id="demo-content" aria-labelledby={`demo-${view}`} className="mt-5">
        {view === "overview" && <><DashboardPreview /><p className="mt-3 text-sm leading-6 text-muted-foreground">Neste exemplo, o saldo começa em {formatCurrency(1860)}. Entram {formatCurrency(5200)} e saem {formatCurrency(2860)}, resultando em {formatCurrency(4200)}. O resultado do mês é a diferença entre receitas e despesas.</p></>}
        {view === "planning" && <Card><CardHeader><h2 className="text-xl font-semibold">Seu dinheiro antes de gastar</h2><p className="text-sm leading-6 text-muted-foreground">Renda fictícia de {formatCurrency(5200)} e limites de {formatCurrency(3550)} no total. Restam {formatCurrency(1650)} no planejamento para metas ou reserva.</p></CardHeader><CardContent className="space-y-5">{categories.map((item) => <div key={item.name}><div className="mb-2 flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-medium">{item.name}</h3><p className="text-sm text-muted-foreground">{formatCurrency(item.spent)} de {formatCurrency(item.planned)}</p></div><div role="progressbar" aria-label={`Limite de ${item.name} usado`} aria-valuemin={0} aria-valuemax={item.planned} aria-valuenow={item.spent} className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${item.spent / item.planned * 100}%` }} /></div></div>)}<p className="border-t border-border pt-4 text-sm text-muted-foreground">O limite é uma previsão. Somente transações registradas ou importadas entram no gasto realizado.</p></CardContent></Card>}
        {view === "transactions" && <Card><CardHeader><h2 className="text-xl font-semibold">De onde vêm os números</h2><p className="text-sm leading-6 text-muted-foreground">Seis registros fictícios explicam o mês de exemplo. Na sua conta, você poderá adicionar, editar e categorizar suas transações.</p></CardHeader><CardContent><ul className="divide-y divide-border">{transactions.map((item) => <li key={item.name} className="flex items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="font-medium">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.date} · {item.category}</p></div><p className={cn("shrink-0 text-sm font-semibold", item.amount > 0 ? "text-emerald-500" : "text-red-400")}>{item.amount > 0 ? "+" : "−"} {formatCurrency(Math.abs(item.amount))}</p></li>)}</ul></CardContent></Card>}
      </section>
    </div>
  );
}
