"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Area, Bar, ComposedChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle } from "lucide-react";
import { useInView } from "@/components/motion/use-in-view";
import { cn, displayName, formatAxisShort, formatCurrency } from "@/lib/utils";

// Five logo blues (measured in public/branding/fluxa-logo.png) alternating light and dark so neighbours
// stay apart in luminance; everything after the fifth category is grouped as "Outras" in gray.
const categoryColors = ["#0080F8", "#B5FFFF", "#024BCF", "#56D1FE", "#0033AF"];
const OTHERS_COLOR = "#636366";
const RING_SLICES = 5;
const OTHERS = "__outras__";
const series = [
  { key: "receitas", label: "Entradas", color: "#30D158", fill: 0 },
  { key: "despesas", label: "Saídas", color: "#FF4245", fill: 0 },
  { key: "saldo", label: "Resultado", color: "#1EA7FD", fill: 0.42 }
] as const;
const VISIBLE_CATEGORIES = 6;
const axisTick = { fill: "rgb(235 235 245 / 0.6)", fontSize: 11, fontFamily: "inherit" };
const gridStroke = "rgb(255 255 255 / 0.06)";

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
  const donutRef = useRef<HTMLDivElement>(null);
  const evolutionRef = useRef<HTMLDivElement>(null);
  const donutInView = useInView(donutRef);
  const evolutionInView = useInView(evolutionRef);
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
    return () => media.removeEventListener("change", update);
  }, []);

  const ringIndexOf = (name: string) => { const index = sortedCategories.findIndex(item => item.name === name); return index >= 0 && index < RING_SLICES ? index : -1; };
  const colorOf = (name: string) => { const index = ringIndexOf(name); return index >= 0 ? categoryColors[index] : OTHERS_COLOR; };
  const ringKeyOf = (name: string) => ringIndexOf(name) >= 0 ? name : OTHERS;
  const othersValue = sortedCategories.slice(RING_SLICES).reduce((sum, item) => sum + item.value, 0);
  const ringData = [...sortedCategories.slice(0, RING_SLICES), ...(othersValue > 0 ? [{ name: OTHERS, value: othersValue }] : [])];
  const highlightedRing = highlighted ? ringKeyOf(highlighted) : null;

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
              <div ref={donutRef} className="category-donut" role="img" aria-label={`Distribuição dos gastos: as ${Math.min(RING_SLICES, sortedCategories.length)} maiores categorias${othersValue > 0 ? " e as outras somadas" : ""}, na mesma ordem da lista, a partir do topo no sentido horário.`}>
                {donutInView ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart accessibilityLayer={false}>
                      <Pie data={ringData} dataKey="value" nameKey="name" innerRadius="70%" outerRadius="96%" paddingAngle={2} cornerRadius={6} stroke="transparent"
                        startAngle={90} endAngle={-270} isAnimationActive={animate} animationDuration={1100} animationEasing="ease-out"
                        onMouseEnter={entry => setHoveredCategory(entry.name === OTHERS ? sortedCategories[RING_SLICES]?.name ?? null : entry.name ?? null)} onMouseLeave={() => setHoveredCategory(null)}
                        onClick={entry => { if (entry.name !== OTHERS) setSelectedCategory(current => current === entry.name ? null : entry.name ?? null); }}>
                        {ringData.map((entry, index) => (
                          <Cell key={entry.name} className="category-ring-segment" data-highlighted={highlightedRing === entry.name} fill={entry.name === OTHERS ? OTHERS_COLOR : categoryColors[index]} opacity={!highlightedRing || highlightedRing === entry.name ? 1 : 0.3} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="category-donut-placeholder" />}
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
                        <button type="button" className={cn("list-row category-row", highlightedRing && highlightedRing !== ringKeyOf(item.name) && "is-dimmed")} aria-pressed={selectedCategory === item.name} disabled={item.value === 0}
                          onMouseEnter={() => setHoveredCategory(item.name)} onMouseLeave={() => setHoveredCategory(null)} onFocus={() => setHoveredCategory(item.name)} onBlur={() => setHoveredCategory(null)}
                          onClick={() => setSelectedCategory(current => current === item.name ? null : item.name)}>
                          <i className="category-dot" style={{ background: item.value > 0 ? colorOf(item.name) : "var(--fill-2)" }} aria-hidden="true" />
                          <span className="row-main">
                            <span className="category-row-top">
                              <span className="row-title">{displayName(item.name)}</span>
                              <span className="row-break" aria-hidden="true" />
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
        <div ref={evolutionRef} className={evolutionData.length ? "evolution-canvas" : "evolution-canvas is-empty"}>
          {evolutionData.length === 0 ? (
            <div className="chart-empty"><p>Seu histórico aparece aqui</p><span>Com um extrato importado, cada mês mostra entradas, saídas e resultado.</span></div>
          ) : !evolutionInView ? <div className="h-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartEvolution} margin={{ top: 12, right: 12, left: 0, bottom: 4 }} barGap={4} barCategoryGap="28%">
                <defs>
                  {series.map(item => (
                    <linearGradient key={item.key} id={`evolution-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={item.color} stopOpacity={chartStyle === "bar" ? 1 : item.fill} />
                      <stop offset="100%" stopColor={item.key === "saldo" && chartStyle === "bar" ? "#0033AF" : item.color} stopOpacity={chartStyle === "bar" ? 0.7 : 0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} padding={{ left: 12, right: 12 }} tick={axisTick} />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={formatAxisShort} width={56} tickCount={5} />
                <Tooltip content={<ChartTooltip />} cursor={chartStyle === "bar" ? { fill: "rgb(255 255 255 / 0.04)" } : { stroke: "rgb(255 255 255 / 0.22)", strokeWidth: 1, strokeDasharray: "3 4" }} />
                {series.map((item, index) => chartStyle === "area" ? (
                  <Area key={item.key} hide={hiddenSeries.includes(item.key)} type="monotone" dataKey={item.key} name={item.label} stroke={item.color} fill={`url(#evolution-${item.key})`} strokeWidth={2} strokeLinecap="round"
                    dot={chartEvolution.length === 1 ? { r: 3.5, fill: item.color, strokeWidth: 0 } : false}
                    activeDot={{ r: 4.5, fill: item.color, stroke: "#1c1c1e", strokeWidth: 2 }}
                    isAnimationActive={animate} animationBegin={index * 140} animationDuration={1100} animationEasing="ease-out" />
                ) : (
                  <Bar key={item.key} hide={hiddenSeries.includes(item.key)} dataKey={item.key} name={item.label} fill={`url(#evolution-${item.key})`} radius={[6, 6, 6, 6]} maxBarSize={18}
                    isAnimationActive={animate} animationBegin={index * 90} animationDuration={800} animationEasing="ease-out" />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>}
    </>
  );
}
