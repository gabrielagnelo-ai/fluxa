"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, Bar, ComposedChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle } from "lucide-react";
import { cn, displayName, formatAxisShort, formatCurrency } from "@/lib/utils";

// Category tones come from the logo blues (measured in public/branding/fluxa-logo.png), plus one neutral.
const categoryColors = ["#0080F8", "#56D1FE", "#024BCF", "#B5FFFF", "#1EA7FD", "#0033AF", "#80D8F8", "#8E8E93"];
const series = [
  { key: "receitas", label: "Entradas", color: "#30D158" },
  { key: "despesas", label: "Saídas", color: "#FF4245" },
  { key: "saldo", label: "Resultado", color: "#0080F8" }
] as const;
const VISIBLE_CATEGORIES = 6;

type CategoryData = { name: string; value: number };
type EvolutionData = { month: string; receitas: number; despesas: number; saldo: number };
type CategoryLimit = {
  categoryName: string;
  actual: number;
  projected: number;
  planned: number;
  projectedUsage: number;
  recurring: boolean;
  status: "leak" | "over" | "warning" | "ok";
};

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string; dataKey?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const ordered = [...payload].sort((a, b) => series.findIndex(item => item.key === a.dataKey) - series.findIndex(item => item.key === b.dataKey));
  return (
    <div className="chart-tooltip">
      {label && <p className="chart-tooltip-label">{label}</p>}
      {ordered.map(item => (
        <div key={item.name} className="chart-tooltip-row">
          <span><i style={{ background: series.find(entry => entry.key === item.dataKey)?.color }} />{item.name}</span>
          <strong className="num">{formatCurrency(Number(item.value))}</strong>
        </div>
      ))}
    </div>
  );
}

/** One line under the name: share of spending, then the limit, then the projection only when it adds something. */
function categoryDetail(value: number, total: number, limit?: CategoryLimit) {
  const parts = [`${percentOf(value, total)}% dos gastos`];
  if (limit && limit.planned > 0) parts.push(`${limit.projectedUsage}% de ${formatCurrency(limit.planned)}`);
  else if (limit) parts.push("sem limite");
  if (limit && Math.round(limit.projected) !== Math.round(value)) parts.push(`pode fechar em ${formatCurrency(limit.projected)}`);
  return parts.join(" · ");
}

function percentOf(value: number, total: number) {
  return total ? (value / total * 100).toFixed(1).replace(".", ",") : "0";
}

export function FinanceCharts({
  categoryData,
  evolutionData,
  limits = [],
  view = "both"
}: {
  categoryData: CategoryData[];
  evolutionData: EvolutionData[];
  limits?: CategoryLimit[];
  view?: "both" | "categories" | "evolution";
}) {
  const [chartStyle, setChartStyle] = useState<"area" | "bar">("area");
  const [mounted, setMounted] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [range, setRange] = useState(6);
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);

  const sortedCategories = useMemo(() => [...categoryData].sort((a, b) => b.value - a.value), [categoryData]);
  const totalExpenses = sortedCategories.reduce((sum, category) => sum + category.value, 0);
  const highlighted = hoveredCategory ?? selectedCategory;
  const selectedData = sortedCategories.find(item => item.name === selectedCategory);
  const limitByName = new Map(limits.map(item => [item.categoryName, item]));
  // Categories with a limit but no spending yet still belong in the list (not in the ring).
  const listCategories = [...sortedCategories, ...limits.filter(item => item.planned > 0 && !sortedCategories.some(category => category.name === item.categoryName)).map(item => ({ name: item.categoryName, value: 0 }))];
  const visibleCategories = showAll ? listCategories : listCategories.slice(0, VISIBLE_CATEGORIES);
  const overCount = limits.filter(item => item.status === "over" || (item.planned > 0 && item.projected > item.planned)).length;
  const recurringCount = limits.filter(item => item.recurring).length;
  const chartEvolution = range ? evolutionData.slice(-range) : evolutionData;
  const lastMonth = evolutionData.at(-1);
  const previousMonth = evolutionData.at(-2);
  const saldoTrend = lastMonth && previousMonth ? lastMonth.saldo - previousMonth.saldo : 0;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAnimate(!media.matches);
    update();
    media.addEventListener("change", update);
    setMounted(true);
    return () => media.removeEventListener("change", update);
  }, []);

  const colorOf = (name: string) => categoryColors[Math.max(0, sortedCategories.findIndex(item => item.name === name)) % categoryColors.length];

  return (
    <>
      {view !== "evolution" && (
        <section className="card" aria-labelledby="categories-title">
          <div className="card-header">
            <div>
              <h2 id="categories-title" className="card-title">Gastos por categoria</h2>
              <p className="card-subtitle num">{formatCurrency(totalExpenses)} em {sortedCategories.length} {sortedCategories.length === 1 ? "categoria" : "categorias"} no período</p>
              {limits.length > 0 && <p className="card-subtitle num">{overCount} acima do previsto · {recurringCount} {recurringCount === 1 ? "frequente" : "frequentes"} · {limits.length} com previsão</p>}
            </div>
          </div>
          {!sortedCategories.length ? (
            <p className="empty-state">Suas categorias aparecem aqui depois de importar um extrato.</p>
          ) : (
            <div className="category-layout">
              <div className="category-donut" role="img" aria-label={`Distribuição dos gastos em ${sortedCategories.length} categorias. A lista ao lado traz os valores.`}>
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart accessibilityLayer={false}>
                      <Pie data={sortedCategories} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="94%" paddingAngle={1.5} cornerRadius={4} stroke="transparent"
                        isAnimationActive={animate} animationDuration={420}
                        onMouseEnter={entry => setHoveredCategory(entry.name ?? null)} onMouseLeave={() => setHoveredCategory(null)}
                        onClick={entry => setSelectedCategory(current => current === entry.name ? null : entry.name ?? null)}>
                        {sortedCategories.map((entry, index) => (
                          <Cell key={entry.name} className="category-ring-segment" data-highlighted={highlighted === entry.name} fill={categoryColors[index % categoryColors.length]} opacity={!highlighted || highlighted === entry.name ? 1 : 0.35} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="skeleton h-full rounded-full" />}
              </div>
              <div className="min-w-0">
                <ul className="list category-list">
                  {visibleCategories.map(item => {
                    const limit = limitByName.get(item.name);
                    const hasLimit = Boolean(limit && limit.planned > 0);
                    const over = Boolean(limit && hasLimit && limit.projected > limit.planned);
                    const near = Boolean(limit && !over && limit.status === "warning");
                    return (
                      <li key={item.name}>
                        <button type="button" className={cn("list-row category-row", highlighted && highlighted !== item.name && "is-dimmed")} aria-pressed={selectedCategory === item.name} disabled={item.value === 0}
                          onMouseEnter={() => setHoveredCategory(item.name)} onMouseLeave={() => setHoveredCategory(null)} onFocus={() => setHoveredCategory(item.name)} onBlur={() => setHoveredCategory(null)}
                          onClick={() => setSelectedCategory(current => current === item.name ? null : item.name)}>
                          <i className="category-dot" style={{ background: item.value > 0 ? colorOf(item.name) : "var(--fill-2)" }} aria-hidden="true" />
                          <span className="row-main">
                            <span className="category-row-top">
                              <span className="row-title">{displayName(item.name)}</span>
                              {over ? <span className="tag is-danger"><AlertTriangle aria-hidden="true" />acima do previsto</span> : near ? <span className="tag is-warning">perto do limite</span> : null}
                              <span className="row-value">{formatCurrency(item.value)}</span>
                            </span>
                            <span className="row-sub num">{categoryDetail(item.value, totalExpenses, limit)}</span>
                            {hasLimit && limit && <span className="meter" aria-hidden="true"><span className={over ? "is-danger" : near ? "is-warning" : undefined} style={{ width: `${Math.min(100, limit.projectedUsage)}%` }} /></span>}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {listCategories.length > VISIBLE_CATEGORIES && (
                  <button type="button" className="btn btn-plain category-more" aria-expanded={showAll} onClick={() => setShowAll(value => !value)}>
                    {showAll ? "Mostrar menos" : `Mostrar todas as ${listCategories.length}`}
                  </button>
                )}
                <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{selectedData ? `${displayName(selectedData.name)}: ${formatCurrency(selectedData.value)}, ${percentOf(selectedData.value, totalExpenses)}% dos gastos.` : ""}</span>
              </div>
            </div>
          )}
        </section>
      )}

      {view !== "categories" && <section className="card" aria-labelledby="evolution-title">
        <div className="card-header">
          <div>
            <h2 id="evolution-title" className="card-title">Evolução por mês</h2>
            <p className="card-subtitle">Entradas, saídas e resultado de cada mês em reais, sem o saldo inicial.</p>
            {lastMonth && previousMonth && <p className="card-subtitle num">O resultado de {lastMonth.month} ficou {saldoTrend >= 0 ? "+" : ""}{formatCurrency(saldoTrend)} em relação a {previousMonth.month}.</p>}
          </div>
        </div>
        {evolutionData.length > 0 && <div className="chart-controls">
          <div className="segmented" role="group" aria-label="Meses exibidos">
            {[{ value: 1, label: "1 mês" }, { value: 3, label: "3 meses" }, { value: 6, label: "6 meses" }].map(item => (
              <button type="button" key={item.value} aria-pressed={range === item.value} onClick={() => setRange(item.value)}>{item.label}</button>
            ))}
          </div>
          <div className="segmented" role="group" aria-label="Tipo de gráfico">
            <button type="button" aria-pressed={chartStyle === "area"} onClick={() => setChartStyle("area")}>Linhas</button>
            <button type="button" aria-pressed={chartStyle === "bar"} onClick={() => setChartStyle("bar")}>Barras</button>
          </div>
          <div className="series-toggles" role="group" aria-label="Séries do gráfico">
            {series.map(item => (
              <button type="button" key={item.key} className="series-toggle" aria-pressed={!hiddenSeries.includes(item.key)}
                onClick={() => setHiddenSeries(items => items.includes(item.key) ? items.filter(key => key !== item.key) : [...items, item.key])}>
                <i style={{ background: item.color }} aria-hidden="true" />{item.label}
              </button>
            ))}
          </div>
        </div>}
        <div className={evolutionData.length ? "evolution-canvas" : "evolution-canvas is-empty"}>
          {evolutionData.length === 0 ? (
            <div className="chart-empty"><p>Seu histórico aparece aqui</p><span>Com um extrato importado, cada mês mostra entradas, saídas e resultado.</span></div>
          ) : !mounted ? <div className="skeleton h-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartEvolution} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <defs>
                  {series.map(item => (
                    <linearGradient key={item.key} id={`evolution-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={item.color} stopOpacity={chartStyle === "bar" ? 1 : 0.28} />
                      <stop offset="100%" stopColor={item.color} stopOpacity={chartStyle === "bar" ? 0.85 : 0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke="rgb(84 84 88 / 0.6)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={8} padding={{ left: 12, right: 8 }} tick={{ fill: "rgb(235 235 245 / 0.7)", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgb(235 235 245 / 0.7)", fontSize: 12 }} tickFormatter={formatAxisShort} width={60} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgb(235 235 245 / 0.3)", fill: "rgb(118 118 128 / 0.12)" }} />
                {series.map(item => chartStyle === "area" ? (
                  <Area key={item.key} hide={hiddenSeries.includes(item.key)} type="monotone" dataKey={item.key} name={item.label} stroke={item.color} fill={`url(#evolution-${item.key})`} strokeWidth={2.5}
                    dot={chartEvolution.length === 1 ? { r: 4 } : false} activeDot={{ r: 5 }} isAnimationActive={animate} animationDuration={400} />
                ) : (
                  <Bar key={item.key} hide={hiddenSeries.includes(item.key)} dataKey={item.key} name={item.label} fill={`url(#evolution-${item.key})`} radius={[6, 6, 0, 0]} maxBarSize={24} isAnimationActive={animate} animationDuration={400} />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>}
    </>
  );
}
