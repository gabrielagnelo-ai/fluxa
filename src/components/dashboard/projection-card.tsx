import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function ProjectionCard({
  projectedIncome,
  projectedExpenses,
  projectedSavings,
  elapsedDays,
  totalDays,
  confidence
}: {
  projectedIncome: number;
  projectedExpenses: number;
  projectedSavings: number;
  elapsedDays: number;
  totalDays: number;
  confidence: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h2 className="font-semibold">Previsão de fechamento</h2>
          <p className="text-sm text-muted-foreground">
            Tendência conservadora: receitas já registradas e despesas projetadas pelo ritmo do período.
          </p>
        </div>
        <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <TrendingUp className="size-5" />
        </span>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">Receita considerada</p>
          <strong className="text-lg">{formatCurrency(projectedIncome)}</strong>
        </div>
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">Despesa estimada</p>
          <strong className="text-lg">{formatCurrency(projectedExpenses)}</strong>
        </div>
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">Sobra estimada</p>
          <strong className={projectedSavings < 0 ? "text-lg text-red-500" : "text-lg text-emerald-500"}>{formatCurrency(projectedSavings)}</strong>
        </div>
        <div className="rounded-md border border-border bg-background/40 p-3 sm:col-span-3">
          <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Base de cálculo: {elapsedDays} de {totalDays} dia(s) do período.
            </span>
            <span>Confiança da tendência: {confidence}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
