"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

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
  const [mounted, setMounted] = useState(false);
  const [animate, setAnimate] = useState(false);
  const evolutionData = useMemo(() => buildEvolutionData(goals), [goals]);
  const totalContributed = goals.reduce((sum, goal) => sum + goal.contributedAmount, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalProgress = totalTarget > 0 ? Math.min(100, Math.round((totalContributed / totalTarget) * 100)) : 0;

  useEffect(() => {
    setAnimate(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setMounted(true);
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
        <div className="goals-layout">
          <div>
            <div className="card-body goals-total-block">
              <p className="overview-label">Guardado</p>
              <strong className="projection-value num">{formatCurrency(totalContributed)}</strong>
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
          <div className="goals-chart" role="img" aria-label={`Dinheiro guardado acumulado: ${formatCurrency(totalContributed)}`}>
            {!mounted ? (
              <div className="skeleton h-full" />
            ) : evolutionData.length === 0 ? (
              <p className="chart-empty"><span>Nenhum dinheiro guardado identificado ainda.</span></p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goals-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0080F8" stopOpacity={0.35} /><stop offset="100%" stopColor="#0080F8" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgb(84 84 88 / 0.6)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "rgb(235 235 245 / 0.7)", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} width={64} tick={{ fill: "rgb(235 235 245 / 0.7)", fontSize: 12 }} tickFormatter={value => `R$ ${(Number(value) / 1000).toLocaleString("pt-BR")} mil`} />
                  <Tooltip formatter={value => formatCurrency(Number(value))} />
                  <Area type="monotone" dataKey="acumulado" name="Guardado" stroke="#0080F8" fill="url(#goals-fill)" strokeWidth={2.5} isAnimationActive={animate} animationDuration={400} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
