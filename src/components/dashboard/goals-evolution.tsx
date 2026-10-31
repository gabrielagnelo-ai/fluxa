"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CountUp } from "@/components/motion/count-up";
import { useInView } from "@/components/motion/use-in-view";
import { formatAxisShort, formatCurrency } from "@/lib/utils";

type GoalEvolutionItem = {
  id: string;
  name: string;
  targetAmount: number;
  contributedAmount: number;
  contributions: {
    date: string;
    amount: number;
  }[];
};

function buildEvolutionData(goals: GoalEvolutionItem[]) {
  const contributions = goals
    .flatMap(goal => goal.contributions)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let accumulated = 0;
  const grouped = new Map<string, { month: string; aportes: number; acumulado: number; date: Date }>();

  contributions.forEach(contribution => {
    const date = new Date(contribution.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const month = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", "");
    const current = grouped.get(key) ?? { month, aportes: 0, acumulado: accumulated, date };

    accumulated += contribution.amount;
    current.aportes += contribution.amount;
    current.acumulado = accumulated;
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function GoalsEvolution({ goals }: { goals: GoalEvolutionItem[] }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const inView = useInView(chartRef);
  const [animate, setAnimate] = useState(false);
  const evolutionData = useMemo(() => buildEvolutionData(goals), [goals]);
  const totalContributed = goals.reduce((sum, goal) => sum + goal.contributedAmount, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalProgress = totalTarget > 0 ? Math.min(100, Math.round((totalContributed / totalTarget) * 100)) : 0;

  useEffect(() => {
    setAnimate(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <section className="card" aria-labelledby="goals-title">
      <div className="card-header">
        <div>
          <h2 id="goals-title" className="card-title">Metas e reserva</h2>
          <p className="card-subtitle">Progresso pelo dinheiro guardado que o Fluxa identificou no extrato ou no WhatsApp.</p>
        </div>
        <Link href="/goals" aria-label="Abrir metas" className="icon-btn btn-gray"><ChevronRight aria-hidden="true" /></Link>
      </div>
      {goals.length === 0 ? (
        <div className="empty-state">
          Defina uma meta e acompanhe quanto falta para chegar lá. O progresso aparece aqui sozinho.
          <br /><Link href="/goals">Criar minha primeira meta<ChevronRight size={16} aria-hidden="true" /></Link>
        </div>
      ) : (
        <div className={evolutionData.length >= 2 ? "goals-layout has-chart" : "goals-layout"}>
          <div>
            <div className="card-body goals-total-block">
              <p className="overview-label">Guardado</p>
              <strong className="projection-value"><CountUp value={totalContributed} /></strong>
              <p className="projection-note num">{totalProgress}% de {formatCurrency(totalTarget)}</p>
              <div className="meter" aria-hidden="true"><span style={{ width: `${totalProgress}%` }} /></div>
            </div>
            <ul className="list">
              {goals.map(goal => {
                const progress = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.contributedAmount / goal.targetAmount) * 100)) : 0;
                return (
                  <li key={goal.id}>
                    <div className="list-row">
                      <div className="row-main">
                        <span className="row-title truncate">{goal.name}</span>
                        <span className="row-sub num">{formatCurrency(goal.contributedAmount)} de {formatCurrency(goal.targetAmount)}</span>
                        <div className="meter" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
                      </div>
                      <span className="row-value">{progress}%</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          {evolutionData.length >= 2 && <div ref={chartRef} className="goals-chart" role="img" aria-label={`Dinheiro guardado acumulado: ${formatCurrency(totalContributed)}`}>
            {!inView ? (
              <div className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goals-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1EA7FD" stopOpacity={0.42} /><stop offset="100%" stopColor="#0033AF" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgb(255 255 255 / 0.06)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={8} padding={{ left: 12, right: 8 }} tick={{ fill: "rgb(235 235 245 / 0.6)", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} width={60} tick={{ fill: "rgb(235 235 245 / 0.6)", fontSize: 11 }} tickFormatter={formatAxisShort} />
                  <Tooltip content={<GoalTooltip />} cursor={{ stroke: "rgb(255 255 255 / 0.22)", strokeDasharray: "3 4" }} />
                  <Area type="monotone" dataKey="acumulado" name="Guardado" stroke="#1EA7FD" fill="url(#goals-fill)" strokeWidth={2} strokeLinecap="round" activeDot={{ r: 4.5, fill: "#1EA7FD", stroke: "#1c1c1e", strokeWidth: 2 }} isAnimationActive={animate} animationDuration={1100} animationEasing="ease-out" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>}
        </div>
      )}
    </section>
  );
}

function GoalTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <p className="chart-tooltip-label">{label}</p>}
      <div className="chart-tooltip-row"><span>Guardado até aqui</span><strong className="num">{formatCurrency(Number(payload[0].value))}</strong></div>
    </div>
  );
}
