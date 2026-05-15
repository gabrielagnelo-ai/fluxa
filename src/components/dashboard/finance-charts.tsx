"use client";

import { useEffect, useState } from "react";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const colors = ["#14b8a6", "#3b82f6", "#f97316", "#8b5cf6", "#64748b", "#22c55e"];

export function FinanceCharts({
  categoryData,
  evolutionData
}: {
  categoryData: { name: string; value: number }[];
  evolutionData: { month: string; receitas: number; despesas: number; saldo: number }[];
}) {
  const [mounted, setMounted] = useState(false);

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
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.4fr]">
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Gastos por categoria</h2>
          <p className="text-sm text-muted-foreground">Distribuição das despesas no período.</p>
        </CardHeader>
        <CardContent className="h-72">
          {categoryData.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">Sem despesas no período.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={4}>
                  {categoryData.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Evolução financeira</h2>
          <p className="text-sm text-muted-foreground">Receitas, despesas e saldo agregados por mês.</p>
        </CardHeader>
        <CardContent className="h-72">
          {evolutionData.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">Sem evolução para exibir.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${Number(value) / 1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="receitas" stroke="#22c55e" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="saldo" stroke="#14b8a6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
