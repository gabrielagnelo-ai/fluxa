"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

const colors = ["#2563EB", "#10B981", "#EF4444", "#14B8A6", "#F97316", "#8B5CF6", "#FACC15", "#64748B"];

type CategoryData = { name: string; value: number };
type EvolutionData = { month: string; receitas: number; despesas: number; saldo: number };

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;

  const orderedPayload = [...payload].sort((a, b) => {
    const order = ["Receitas", "Despesas", "Saldo"];
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
  evolutionData
}: {
  categoryData: CategoryData[];
  evolutionData: EvolutionData[];
}) {
  const [mounted, setMounted] = useState(false);
  const totalExpenses = categoryData.reduce((sum, category) => sum + category.value, 0);
  const largestCategory = categoryData[0];
  const lastMonth = evolutionData.at(-1);
  const previousMonth = evolutionData.at(-2);
  const saldoTrend = lastMonth && previousMonth ? lastMonth.saldo - previousMonth.saldo : 0;

  const sortedCategories = useMemo(() => [...categoryData].sort((a, b) => b.value - a.value).slice(0, 7), [categoryData]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.4fr]">
        <Card className="h-96 animate-pulse" />
        <Card className="h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.45fr]">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">Gastos por categoria</h2>
              <p className="text-sm text-muted-foreground">Onde o dinheiro saiu no período.</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <strong className="text-sm">{formatCurrency(totalExpenses)}</strong>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedCategories.length === 0 ? (
            <div className="grid h-80 place-items-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
              Sem despesas no período.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[0.9fr_1fr]">
              <div className="relative h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sortedCategories} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={4} stroke="#0B1220" strokeWidth={3}>
                      {sortedCategories.map((entry, index) => (
                        <Cell key={entry.name} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Maior gasto</p>
                    <strong className="block max-w-28 truncate text-sm">{largestCategory?.name}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {sortedCategories.map((category, index) => {
                  const percent = totalExpenses > 0 ? Math.round((category.value / totalExpenses) * 100) : 0;

                  return (
                    <div key={category.name} className="rounded-lg border border-border bg-muted/20 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: colors[index % colors.length] }} />
                          <span className="truncate text-sm font-medium">{category.name}</span>
                        </div>
                        <span className="text-sm font-semibold">{formatCurrency(category.value)}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-background">
                          <div className="h-1.5 rounded-full" style={{ width: `${percent}%`, backgroundColor: colors[index % colors.length] }} />
                        </div>
                        <span className="w-9 text-right text-xs text-muted-foreground">{percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h2 className="font-semibold">Evolução financeira</h2>
              <p className="text-sm text-muted-foreground">Receitas, despesas e saldo por mês.</p>
            </div>
            {lastMonth && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
        <CardContent className="h-[23rem]">
          {evolutionData.length === 0 ? (
            <div className="grid h-full place-items-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
              Sem evolução para exibir.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} opacity={0.45} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} tickFormatter={formatAxisCurrency} width={72} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 10 }} iconType="circle" formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>} />
                <Area type="monotone" dataKey="receitas" name="Receitas" stroke="#10B981" fill="url(#incomeGradient)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#EF4444" fill="url(#expenseGradient)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="saldo" name="Saldo" stroke="#2563EB" fill="url(#balanceGradient)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
