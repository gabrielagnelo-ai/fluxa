import Link from "next/link";
import { BriefcaseBusiness, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

type InvestmentSummaryCardProps = {
  totalCurrent: number;
  gain: number;
  gainPercent: number;
  assetCount: number;
  allocation: {
    type: string;
    label: string;
    value: number;
    share: number;
    color: string;
  }[];
};

export function InvestmentSummaryCard({ totalCurrent, gain, gainPercent, assetCount, allocation }: InvestmentSummaryCardProps) {
  const topAllocations = allocation.slice(0, 3);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BriefcaseBusiness className="size-4 text-primary" />
              Investimentos
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{formatCurrency(totalCurrent)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{assetCount} ativo(s) cadastrados</p>
          </div>
          <Link
            href="/investments"
            aria-label="Abrir investimentos"
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-background/60 text-muted-foreground transition hover:border-primary/50 hover:text-primary"
          >
            <ChevronRight className="size-5" />
          </Link>
        </div>

        <div className="mt-5 rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Resultado da carteira</p>
          <strong className={cn("mt-1 block text-lg", gain >= 0 ? "text-emerald-500" : "text-red-500")}>
            {formatCurrency(gain)} · {gain >= 0 ? "+" : ""}
            {gainPercent.toFixed(2)}%
          </strong>
        </div>

        <div className="mt-4 space-y-3">
          {topAllocations.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
              Cadastre ativos para visualizar sua alocação.
            </p>
          ) : (
            topAllocations.map((item) => (
              <div key={item.type}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <strong>{item.share}%</strong>
                </div>
                <div className="h-1.5 rounded-full bg-background">
                  <div className="h-1.5 rounded-full" style={{ width: `${item.share}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
