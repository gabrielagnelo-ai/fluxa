"use client";

import { useEffect, useMemo, useState } from "react";
import { Flag } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    .flatMap((goal) => goal.contributions)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let accumulated = 0;
  const grouped = new Map<string, { month: string; aportes: number; acumulado: number; date: Date }>();

  contributions.forEach((contribution) => {
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
  const evolutionData = useMemo(() => buildEvolutionData(goals), [goals]);
  const totalContributed = goals.reduce((sum, goal) => sum + goal.contributedAmount, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalProgress = totalTarget > 0 ? Math.min(100, Math.round((totalContributed / totalTarget) * 100)) : 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold">Evolucao das metas</h2>
          <p className="text-sm text-muted-foreground">Progresso calculado pelo dinheiro guardado identificado no extrato ou WhatsApp.</p>
        </div>
        <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Flag className="size-5" />
        </span>
      </CardHeader>
      <CardContent className="space-y-5">
        {goals.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
            Crie uma meta e registre quando guardar dinheiro. O progresso aparece aqui automaticamente.
          </div>
        ) : (
          <>
            <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Progresso geral</p>
                  <strong className="mt-1 block text-2xl">{totalProgress}%</strong>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatCurrency(totalContributed)} de {formatCurrency(totalTarget)}
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-background">
                    <div className="h-2 rounded-full bg-primary shadow-[0_0_18px_rgba(37,99,235,0.35)]" style={{ width: `${totalProgress}%` }} />
                  </div>
                </div>

                <div className="space-y-3">
                  {goals.map((goal) => {
                    const progress = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.contributedAmount / goal.targetAmount) * 100)) : 0;

                    return (
                      <div key={goal.id} className="rounded-lg border border-border bg-muted/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{goal.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(goal.contributedAmount)} de {formatCurrency(goal.targetAmount)}
                            </p>
                          </div>
                          <strong className="shrink-0 text-primary">{progress}%</strong>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-background">
                          <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="h-80 rounded-lg border border-border bg-muted/20 p-4">
                {!mounted ? (
                  <div className="h-full animate-pulse rounded-md bg-muted" />
                ) : evolutionData.length === 0 ? (
                  <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                    Nenhum dinheiro guardado identificado ainda.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionData}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${Number(value) / 1000}k`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Area type="monotone" dataKey="acumulado" stroke="#2563EB" fill="#2563EB" fillOpacity={0.18} strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
