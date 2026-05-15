import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

export function KpiCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: LucideIcon; tone: string }) {
  const negative = value < 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="relative flex items-center justify-between pt-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <strong className={cn("mt-2 block truncate text-2xl tracking-normal", negative && "text-red-500")}>{formatCurrency(value)}</strong>
        </div>
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-lg", tone)}>
          <Icon className="size-5" />
        </span>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
      </CardContent>
    </Card>
  );
}
