"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Area, Bar, ComposedChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

const colors = ["#2563EB", "#10B981", "#EF4444", "#14B8A6", "#F97316", "#8B5CF6", "#FACC15", "#64748B"];

type CategoryData = { name: string; value: number };
type EvolutionData = { month: string; receitas: number; despesas: number; saldo: number };

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;

  const orderedPayload = [...payload].sort((a, b) => {
    const order = ["Receitas", "Despesas", "Resultado"];
    return order.indexOf(a.name) - order.indexOf(b.name);
  });

  return (
    <div className="rounded-lg border border-border bg-[#0B1220]/95 px-3 py-2 text-xs shadow-2xl shadow-black/30 backdrop-blur">
      {label && <p className="mb-2 font-medium capitalize text-foreground">{label}</p>}
      <div className="space-y-1.5">
        {orderedPayload.map((item) => (
          <div key={item.name} className="flex min-w-44 items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <strong className="font-semibold text-foreground">{formatCurrency(Number(item.value))}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatAxisCurrency(value: number) {
  const abs = Math.abs(Number(value));
  const prefix = Number(value) < 0 ? "-" : "";
  if (abs >= 1000) return `${prefix}R$${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
  return `${prefix}R$${abs.toFixed(0)}`;
}

export function FinanceCharts({
  categoryData,
  evolutionData,
  view = "both"
}: {
  categoryData: CategoryData[];
  evolutionData: EvolutionData[];
  view?: "both" | "evolution";
}) {
  const chartId = useId().replace(/:/g, "");
  const [chartStyle, setChartStyle] = useState<"area" | "bar">("area");
  const [mounted, setMounted] = useState(false);
  const totalExpenses = categoryData.reduce((sum, category) => sum + category.value, 0);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [range, setRange] = useState(6);
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);
  const [animate, setAnimate] = useState(false);
  const largestCategory = [...categoryData].sort((a, b) => b.value - a.value)[0];
  const lastMonth = evolutionData.at(-1);
  const previousMonth = evolutionData.at(-2);
  const saldoTrend = lastMonth && previousMonth ? lastMonth.saldo - previousMonth.saldo : 0;

  const sortedCategories = useMemo(() => [...categoryData].sort((a, b) => b.value - a.value), [categoryData]);

  const activeCategory = sortedCategories.find(item => item.name === (hoveredCategory ?? selectedCategory)) ?? largestCategory;
  const activeCategoryIndex = sortedCategories.findIndex(item => item.name === activeCategory?.name);
  const highlightedCategory = hoveredCategory ?? selectedCategory;
  const selectedCategoryData = sortedCategories.find(item => item.name === selectedCategory);
  const stepCategory = (direction: number) => {
    const index = (activeCategoryIndex + direction + sortedCategories.length) % sortedCategories.length;
    setHoveredCategory(null);
    setSelectedCategory(sortedCategories[index]?.name ?? null);
  };
  const chartEvolution = range ? evolutionData.slice(-range) : evolutionData;
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAnimate(!media.matches);
    update(); media.addEventListener("change", update);
    setMounted(true);
    return () => media.removeEventListener("change", update);
  }, []);

  if (!mounted) {
    return (
      <div className={view === "evolution" ? "finance-chart-wide" : "finance-charts-layout"}>
        {view === "both" && <Card className="h-96 animate-pulse" />}
        <Card className="h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div className={view === "evolution" ? "finance-chart-wide" : "finance-charts-layout"}>
      {view === "both" && <Card className="category-chart-card">
        <CardHeader>
          <h2 className="font-semibold">Distribuição dos gastos</h2>
          <p className="text-sm text-muted-foreground">{categoryData.length} categorias · {formatCurrency(totalExpenses)} no período</p>
        </CardHeader>
        <CardContent>
          {!sortedCategories.length ? <div className="chart-empty"><p>Sem despesas no período.</p></div> :
          <div className="category-chart-layout">
            <div className="category-visual">
              <div className="category-donut" role="img" aria-label={`Distribuição dos gastos em ${categoryData.length} categorias. Use os controles de categoria para consultar os valores.`}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart accessibilityLayer={false}>
                    <defs>{colors.map((color,index) => <linearGradient key={color} id={`${chartId}-category-${index}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={color}/><stop offset="100%" stopColor={colors[(index + 1) % colors.length]}/></linearGradient>)}</defs>
                    <Pie data={sortedCategories} isAnimationActive={animate} animationDuration={260}
                      onMouseEnter={entry => setHoveredCategory(entry.name ?? null)} onMouseLeave={() => setHoveredCategory(null)}
                      onClick={entry => setSelectedCategory(selectedCategory === entry.name ? null : entry.name ?? null)}
                      dataKey="value" nameKey="name" innerRadius="63%" outerRadius="86%" paddingAngle={2} cornerRadius={6} stroke="transparent" strokeWidth={1}>
                      {sortedCategories.map((entry,index) => <Cell key={entry.name} className="category-ring-segment" data-highlighted={highlightedCategory === entry.name} fill={`url(#${chartId}-category-${index % colors.length})`} opacity={!highlightedCategory || highlightedCategory === entry.name ? 1 : .78} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="category-detail">
                <div key={activeCategory?.name} className="category-external-readout widget-page-content">
                  <span>{hoveredCategory ? "Em destaque" : selectedCategory ? "Selecionado" : "Maior gasto"}</span>
                  <strong title={activeCategory?.name}>{activeCategory?.name}</strong>
                  <div><b>{formatCurrency(activeCategory?.value ?? 0)}</b><span>{totalExpenses ? ((activeCategory?.value ?? 0) / totalExpenses * 100).toFixed(1).replace(".",",") : 0}%</span></div>
                </div>
                <div className="category-navigation" role="group" aria-label="Explorar categorias">
                  <button type="button" aria-label="Categoria anterior" disabled={sortedCategories.length < 2} onClick={() => stepCategory(-1)}><ChevronLeft size={16} aria-hidden="true" /></button>
                  <span>{activeCategoryIndex + 1} de {sortedCategories.length}</span>
                  <button type="button" aria-label="Próxima categoria" disabled={sortedCategories.length < 2} onClick={() => stepCategory(1)}><ChevronRight size={16} aria-hidden="true" /></button>
                </div>
                <p className="category-chart-hint">Explore as fatias ou use as setas.</p>
                <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{selectedCategoryData ? `${selectedCategoryData.name}: ${formatCurrency(selectedCategoryData.value)}, ${(selectedCategoryData.value / totalExpenses * 100).toFixed(1).replace(".", ",")}% dos gastos.` : "Maior gasto em destaque."}</span>
              </div>
            </div>
          </div>}
        </CardContent>
      </Card>}

      <Card className="overflow-hidden">
        <CardHeader>
          <div className={view === "evolution" ? "reference-chart-heading" : "flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between"}>
            <div>
              <h2 className="font-semibold">Evolução financeira</h2>
              <p className="text-sm text-muted-foreground">Receitas, despesas e resultado de cada mês, sem saldo inicial.</p>
            </div>
            {lastMonth && (
              <div className={view === "evolution" ? "reference-chart-metrics" : "grid grid-cols-2 gap-2 sm:grid-cols-3"}>
                <div className="rounded-lg border border-border bg-muted/25 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Receita</p>
                  <strong className="text-sm text-emerald-500">{formatCurrency(lastMonth.receitas)}</strong>
                </div>
                <div className="rounded-lg border border-border bg-muted/25 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Despesa</p>
                  <strong className="text-sm text-red-500">{formatCurrency(lastMonth.despesas)}</strong>
                </div>
                <div className="rounded-lg border border-border bg-muted/25 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Tendência</p>
                  <strong className={cn("text-sm", saldoTrend >= 0 ? "text-emerald-500" : "text-red-500")}>
                    {saldoTrend >= 0 ? "+" : ""}{formatCurrency(saldoTrend)}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <div className="chart-controls" aria-label="Controles da evolução financeira"><div className="chart-range chart-type" aria-label="Tipo de gráfico"><button type="button" aria-pressed={chartStyle === "area"} onClick={() => setChartStyle("area")}>Áreas</button><button type="button" aria-pressed={chartStyle === "bar"} onClick={() => setChartStyle("bar")}>Barras</button></div><div className="chart-range" aria-label="Histórico exibido">{[{value:1,label:"1 mês"},{value:3,label:"3 meses"},{value:6,label:"6 meses"}].map(item => <button type="button" key={item.value} aria-pressed={range === item.value} onClick={() => setRange(item.value)}>{item.label}</button>)}</div><div className="chart-series">{[{key:"receitas",label:"Receitas",color:"#10B981"},{key:"despesas",label:"Despesas",color:"#EF4444"},{key:"saldo",label:"Resultado",color:"#2563EB"}].map(item => <button type="button" key={item.key} aria-pressed={!hiddenSeries.includes(item.key)} onClick={() => setHiddenSeries(items => items.includes(item.key) ? items.filter(key => key !== item.key) : [...items,item.key])}><span style={{background:item.color}} />{item.label}</button>)}</div></div>
        <CardContent className={view === "evolution" ? "overview-chart-canvas" : "h-[22rem] sm:h-[24rem] 2xl:h-[31rem]"}>
          {evolutionData.length === 0 ? (
            <div className="chart-empty"><p>Seu histórico financeiro aparece aqui</p><span>Importe um extrato para acompanhar entradas, despesas e saldo ao longo do tempo.</span><Link href="/import">Importar extrato</Link></div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartEvolution} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id={`${chartId}-incomeGradient`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#24edbc" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={chartStyle === "bar" ? .9 : .02} />
                  </linearGradient>
                  <linearGradient id={`${chartId}-expenseGradient`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6583" stopOpacity={0.48} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={chartStyle === "bar" ? .9 : .02} />
                  </linearGradient>
                  <linearGradient id={`${chartId}-balanceGradient`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#32c9ff" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={chartStyle === "bar" ? .9 : .02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} opacity={0.45} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} tickFormatter={formatAxisCurrency} width={72} />
                <Tooltip content={<ChartTooltip />} />
                {chartStyle === "area" ? <>
                <Area hide={hiddenSeries.includes("receitas")} isAnimationActive={animate} animationDuration={260} type="monotone" dataKey="receitas" name="Receitas" stroke="#10B981" fill={`url(#${chartId}-incomeGradient)`} strokeWidth={3} dot={chartEvolution.length === 1 ? { r: 5 } : false} activeDot={{ r: 5 }} />
                <Area hide={hiddenSeries.includes("despesas")} isAnimationActive={animate} animationDuration={260} type="monotone" dataKey="despesas" name="Despesas" stroke="#EF4444" fill={`url(#${chartId}-expenseGradient)`} strokeWidth={3} dot={chartEvolution.length === 1 ? { r: 5 } : false} activeDot={{ r: 5 }} />
                <Area hide={hiddenSeries.includes("saldo")} isAnimationActive={animate} animationDuration={260} type="monotone" dataKey="saldo" name="Resultado" stroke="#2563EB" fill={`url(#${chartId}-balanceGradient)`} strokeWidth={3} dot={chartEvolution.length === 1 ? { r: 5 } : false} activeDot={{ r: 5 }} />
                </> : <>
                  <Bar hide={hiddenSeries.includes("receitas")} dataKey="receitas" name="Receitas" fill={`url(#${chartId}-incomeGradient)`} radius={[8,8,0,0]} maxBarSize={28} isAnimationActive={animate} animationDuration={260}/>
                  <Bar hide={hiddenSeries.includes("despesas")} dataKey="despesas" name="Despesas" fill={`url(#${chartId}-expenseGradient)`} radius={[8,8,0,0]} maxBarSize={28} isAnimationActive={animate} animationDuration={260}/>
                  <Bar hide={hiddenSeries.includes("saldo")} dataKey="saldo" name="Resultado" fill={`url(#${chartId}-balanceGradient)`} radius={8} maxBarSize={28} isAnimationActive={animate} animationDuration={260}/>
                </>}

              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
