import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function ProjectionCard({
  projectedIncome,
  projectedExpenses,
  projectedSavings
}: {
  projectedIncome: number;
  projectedExpenses: number;
  projectedSavings: number;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h2 className="font-semibold">Projeção do período</h2>
          <p className="text-sm text-muted-foreground">Estimativa baseada no ritmo das transações filtradas.</p>
        </div>
        <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <TrendingUp className="size-5" />
        </span>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">Receita prevista</p>
          <strong className="text-lg">{formatCurrency(projectedIncome)}</strong>
        </div>
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">Despesa prevista</p>
          <strong className="text-lg">{formatCurrency(projectedExpenses)}</strong>
        </div>
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">Economia prevista</p>
          <strong className={projectedSavings < 0 ? "text-lg text-red-500" : "text-lg text-emerald-500"}>
            {formatCurrency(projectedSavings)}
          </strong>
        </div>
      </CardContent>
    </Card>
  );
}
