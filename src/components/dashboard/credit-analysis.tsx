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
  const recurringCount = origins.filter((origin) => origin.recurring).length;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold">De onde veio o dinheiro</h2>
          <p className="text-sm text-muted-foreground">Principais entradas e quanto cada uma representa no periodo.</p>
        </div>
        <span className="grid size-10 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
          <ArrowDownToLine className="size-5" />
        </span>
      </CardHeader>
      <CardContent>
        {origins.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
            Nenhuma entrada de credito encontrada no periodo.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/25 p-4">
                <p className="text-sm text-muted-foreground">Total recebido</p>
                <strong className="mt-1 block text-2xl">{formatCurrency(total)}</strong>
              </div>
              <div className="rounded-lg border border-border bg-muted/25 p-4">
                <p className="text-sm text-muted-foreground">Principal origem</p>
                <strong className="mt-1 block truncate text-lg" title={mainOrigin?.name}>{mainOrigin?.name ?? "-"}</strong>
                {mainOrigin && <p className="text-sm text-muted-foreground">{mainOrigin.share}% das entradas</p>}
              </div>
              <div className="rounded-lg border border-border bg-muted/25 p-4">
                <p className="text-sm text-muted-foreground">Entradas frequentes</p>
                <strong className="mt-1 block text-2xl">{recurringCount}</strong>
                <p className="text-sm text-muted-foreground">{origins.length} origem(ns) no periodo</p>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
              {origins.slice(0, 6).map((origin) => (
                <div key={origin.name} className="min-w-0 rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium" title={origin.name}>{origin.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {origin.count} entrada(s) - {origin.recurring ? "aparece com frequencia" : "pontual"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
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
