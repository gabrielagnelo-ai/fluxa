"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useInView } from "@/components/motion/use-in-view";
import { cn, displayName, formatAxisShort, formatCurrency } from "@/lib/utils";

// Five logo blues (measured in public/branding/fluxa-logo.png), each at least 3:1 against the card,
// alternating darker and lighter so neighbours stay apart; everything after the fifth category is grouped as "Outras" in gray.
const categoryColors = ["#1EA7FD", "#B5FFFF", "#33BCFD", "#80D8F8", "#38C0F8"];
const OTHERS_COLOR = "#9AA3B6";
const RING_SLICES = 5;
const OTHERS = "__outras__";
const VISIBLE_CATEGORIES = 6;
const axisTick = { fill: "rgb(235 235 245 / 0.6)", fontSize: 11, fontFamily: "inherit" };
const gridStroke = "rgb(255 255 255 / 0.07)";

// One series at a time (principle 24); "Comparar" puts income and expenses side by side as bars.
const views = [
  { key: "saldo", label: "Resultado", color: "#1EA7FD", deep: "#0033AF" },
  { key: "receitas", label: "Entradas", color: "#30D158", deep: "#30D158" },
  { key: "despesas", label: "Saídas", color: "#FFA3A5", deep: "#FF4245" },
  { key: "comparar", label: "Comparar", color: "#1EA7FD", deep: "#0033AF" }
] as const;
type ViewKey = (typeof views)[number]["key"];

type CategoryData = { name: string; value: number };
type EvolutionData = { month: string; receitas: number; despesas: number; saldo: number };

function percentOf(value: number, total: number) {
  return total ? (value / total * 100).toFixed(1).replace(".", ",") : "0";
}

function useAnimate() {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAnimate(!media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return animate;
}

export function FinanceCharts({ categoryData, evolutionData, view = "both" }: {
  categoryData: CategoryData[];
  evolutionData: EvolutionData[];
  view?: "both" | "categories" | "evolution";
}) {
  return (
    <>
      {view !== "evolution" && <CategoryRing categoryData={categoryData} />}
      {view !== "categories" && <EvolutionChart evolutionData={evolutionData} />}
    </>
  );
}

function CategoryRing({ categoryData }: { categoryData: CategoryData[] }) {
  const animate = useAnimate();
  const ringRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ringRef);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const sorted = useMemo(() => [...categoryData].sort((a, b) => b.value - a.value), [categoryData]);
  const total = sorted.reduce((sum, item) => sum + item.value, 0);
  const ringIndexOf = (name: string) => { const index = sorted.findIndex(item => item.name === name); return index >= 0 && index < RING_SLICES ? index : -1; };
  const colorOf = (name: string) => { const index = ringIndexOf(name); return index >= 0 ? categoryColors[index] : OTHERS_COLOR; };
  const ringKeyOf = (name: string) => ringIndexOf(name) >= 0 ? name : OTHERS;
  const othersValue = sorted.slice(RING_SLICES).reduce((sum, item) => sum + item.value, 0);
  const ringData = [...sorted.slice(0, RING_SLICES), ...(othersValue > 0 ? [{ name: OTHERS, value: othersValue }] : [])];
  const highlighted = hovered ?? selected;
  const highlightedRing = highlighted ? ringKeyOf(highlighted) : null;
  const focus = sorted.find(item => item.name === highlighted);
  const visible = showAll ? sorted : sorted.slice(0, VISIBLE_CATEGORIES);

  return (
    <section className="card" aria-labelledby="categories-title">
      <div className="card-header">
        <div>
          <h2 id="categories-title" className="card-title">Gastos por categoria</h2>
          <p className="card-subtitle num">{sorted.length ? `${formatCurrency(total)} em ${sorted.length} ${sorted.length === 1 ? "categoria" : "categorias"} no período` : "Nenhum gasto no período"}</p>
        </div>
      </div>
      {!sorted.length ? (
        <p className="empty-state">Suas categorias aparecem aqui depois de importar um extrato.</p>
      ) : (
        <div className="cat-ring-layout">
          <div ref={ringRef} className="cat-ring" role="img" aria-label={`Distribuição dos gastos: as ${Math.min(RING_SLICES, sorted.length)} maiores categorias${othersValue > 0 ? " e as outras somadas" : ""}, na ordem da lista, a partir do topo no sentido horário.`}>
            {inView ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart accessibilityLayer={false}>
                  <Pie data={ringData} dataKey="value" nameKey="name" innerRadius="80%" outerRadius="100%" paddingAngle={2} cornerRadius={4} stroke="transparent"
                    startAngle={90} endAngle={-270} isAnimationActive={animate} animationDuration={1100} animationEasing="ease-out"
                    onMouseEnter={entry => setHovered(entry.name === OTHERS ? sorted[RING_SLICES]?.name ?? null : entry.name ?? null)} onMouseLeave={() => setHovered(null)}>
                    {ringData.map((entry, index) => (
                      <Cell key={entry.name} fill={entry.name === OTHERS ? OTHERS_COLOR : categoryColors[index]} opacity={!highlightedRing || highlightedRing === entry.name ? 1 : 0.3} className="category-ring-segment" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="cat-ring-placeholder" />}
          </div>
          <div className="min-w-0">
            <ul className="cat-ring-legend">
              {visible.map(item => (
                <li key={item.name}>
                  <button type="button" className={cn("cat-ring-legend-row", highlightedRing && highlightedRing !== ringKeyOf(item.name) && "is-dimmed")} aria-pressed={selected === item.name}
                    onMouseEnter={() => setHovered(item.name)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(item.name)} onBlur={() => setHovered(null)}
                    onClick={() => setSelected(current => current === item.name ? null : item.name)}>
                    <i style={{ background: colorOf(item.name) }} aria-hidden="true" />
                    <span className="cat-ring-legend-name">{displayName(item.name)}</span>
                    <span className="cat-ring-legend-value num">{formatCurrency(item.value)}</span>
                    <span className="cat-ring-legend-share num">{percentOf(item.value, total)}%</span>
                  </button>
                </li>
              ))}
            </ul>
            {sorted.length > VISIBLE_CATEGORIES && (
              <button type="button" className="btn btn-plain category-more" aria-expanded={showAll} onClick={() => setShowAll(value => !value)}>
                {showAll ? "Mostrar menos" : `Mostrar todas as ${sorted.length}`}
              </button>
            )}
            <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{focus ? `${displayName(focus.name)}: ${formatCurrency(focus.value)}, ${percentOf(focus.value, total)}% dos gastos.` : ""}</span>
          </div>
        </div>
      )}
    </section>
  );
}

function EvolutionChart({ evolutionData }: { evolutionData: EvolutionData[] }) {
  const animate = useAnimate();
  const chartRef = useRef<HTMLDivElement>(null);
  const inView = useInView(chartRef);
  const [active, setActive] = useState<ViewKey>("saldo");
  const [range, setRange] = useState(6);
  const [pointIndex, setPointIndex] = useState<number | null>(null);
  const data = evolutionData.slice(-range);
  const current = views.find(item => item.key === active) ?? views[0];
  const point = data[pointIndex ?? data.length - 1];
  const lastMonth = evolutionData.at(-1);
  const previousMonth = evolutionData.at(-2);
  const trend = lastMonth && previousMonth ? lastMonth.saldo - previousMonth.saldo : 0;
  const onMove = (state: { activeTooltipIndex?: number | string | null } | undefined) => {
    const index = Number(state?.activeTooltipIndex);
    setPointIndex(Number.isFinite(index) ? index : null);
  };

  return (
    <section className="card" aria-labelledby="evolution-title">
      <div className="card-header">
        <div>
          <h2 id="evolution-title" className="card-title">Evolução por mês</h2>
          <p className="card-subtitle">{lastMonth && previousMonth ? <span className="num">O resultado de {lastMonth.month} ficou {trend >= 0 ? "+" : ""}{formatCurrency(trend)} em relação a {previousMonth.month}.</span> : "Entradas, saídas e resultado de cada mês, sem o saldo inicial."}</p>
        </div>
      </div>
      {evolutionData.length === 0 ? (
        <div className="evolution-canvas is-empty"><div className="chart-empty"><p>Seu histórico aparece aqui</p><span>Com um extrato importado, cada mês mostra entradas, saídas e resultado.</span></div></div>
      ) : (
        <>
          <div className="chart-controls">
            <div className="segmented" role="group" aria-label="O que mostrar">
              {views.map(item => <button type="button" key={item.key} aria-pressed={active === item.key} onClick={() => setActive(item.key)}>{item.label}</button>)}
            </div>
            <div className="segmented" role="group" aria-label="Meses exibidos">
              {[3, 6].map(value => <button type="button" key={value} aria-pressed={range === value} onClick={() => { setRange(value); setPointIndex(null); }}>{value} meses</button>)}
            </div>
          </div>
          {/* Readout outside the plot: the month under the finger or cursor, the last month otherwise. */}
          {point && (
            <div className="chart-readout" aria-live="polite">
              <span className="chart-readout-month">{point.month.charAt(0).toUpperCase() + point.month.slice(1)}{pointIndex === null ? ", último mês" : ""}</span>
              {active === "comparar" ? (
                <span className="chart-readout-pair num"><b style={{ color: "#4ADE80" }}>{formatCurrency(point.receitas)}</b> entradas · <b style={{ color: "#FFA3A5" }}>{formatCurrency(point.despesas)}</b> saídas</span>
              ) : (
                <strong className={cn("num", active === "saldo" && point.saldo < 0 && "is-negative")}>{active === "saldo" && point.saldo > 0 ? "+" : ""}{formatCurrency(point[active])}</strong>
              )}
            </div>
          )}
          <div ref={chartRef} className="evolution-canvas" onMouseLeave={() => setPointIndex(null)}>
            {!inView ? <div className="h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                {active === "comparar" ? (
                  <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }} barGap={4} barCategoryGap="30%" onMouseMove={onMove} onMouseLeave={() => setPointIndex(null)}>
                    <CartesianGrid stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} tick={axisTick} />
                    <YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={formatAxisShort} width={56} tickCount={4} />
                    <Tooltip content={() => null} cursor={{ fill: "rgb(255 255 255 / 0.05)" }} />
                    <Bar dataKey="receitas" name="Entradas" fill="#30D158" radius={[6, 6, 6, 6]} maxBarSize={20} isAnimationActive={animate} animationDuration={800} />
                    <Bar dataKey="despesas" name="Saídas" fill="#FFA3A5" radius={[6, 6, 6, 6]} maxBarSize={20} isAnimationActive={animate} animationBegin={120} animationDuration={800} />
                  </BarChart>
                ) : (
                  <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }} onMouseMove={onMove} onMouseLeave={() => setPointIndex(null)}>
                    <defs>
                      <linearGradient id={`evolution-${current.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={current.color} stopOpacity={0.45} />
                        <stop offset="100%" stopColor={current.deep} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} padding={{ left: 12, right: 12 }} tick={axisTick} />
                    <YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={formatAxisShort} width={56} tickCount={4} />
                    <Tooltip content={() => null} cursor={{ stroke: "rgb(255 255 255 / 0.4)", strokeWidth: 1 }} />
                    <Area key={current.key} type="monotone" dataKey={current.key} name={current.label} stroke={current.color} fill={`url(#evolution-${current.key})`} strokeWidth={2.5} strokeLinecap="round"
                      dot={{ r: 3, fill: current.color, strokeWidth: 0 }} activeDot={{ r: 6, fill: current.color, stroke: "#3b4b6b", strokeWidth: 3 }}
                      isAnimationActive={animate} animationDuration={1000} animationEasing="ease-out" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </section>
  );
}
