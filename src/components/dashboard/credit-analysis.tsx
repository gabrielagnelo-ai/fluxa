import { ArrowDownToLine } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type CreditOrigin = {
  name: string;
  amount: number;
  count: number;
  share: number;
  recurring: boolean;
};

export function CreditAnalysis({ origins }: { origins: CreditOrigin[] }) {
  const total = origins.reduce((sum, origin) => sum + origin.amount, 0);
  const mainOrigin = origins[0];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold">Análise das entradas de crédito</h2>
          <p className="text-sm text-muted-foreground">Origem, concentração e recorrência das receitas no período.</p>
        </div>
        <span className="grid size-10 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
          <ArrowDownToLine className="size-5" />
        </span>
      </CardHeader>
      <CardContent>
        {origins.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
            Nenhuma entrada de crédito encontrada no período.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Total recebido</p>
              <strong className="mt-1 block text-2xl">{formatCurrency(total)}</strong>
              {mainOrigin && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Principal origem: <span className="text-foreground">{mainOrigin.name}</span> ({mainOrigin.share}%)
                </p>
              )}
            </div>

            <div className="space-y-3">
              {origins.slice(0, 6).map((origin) => (
                <div key={origin.name} className="rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{origin.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {origin.count} entrada(s) · {origin.recurring ? "recorrente/provável" : "pontual"}
                      </p>
                    </div>
                    <div className="text-right">
                      <strong>{formatCurrency(origin.amount)}</strong>
                      <p className="text-sm text-muted-foreground">{origin.share}%</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-background">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${origin.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
