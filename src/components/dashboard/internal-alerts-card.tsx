import { AlertTriangle, Bell, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AlertItem = {
  id: string;
  title: string;
  description: string;
  severity: "danger" | "warning" | "info" | "success";
};

const iconBySeverity = {
  danger: ShieldAlert,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2
};

const toneBySeverity = {
  danger: "bg-red-500/10 text-red-500",
  warning: "bg-amber-400/10 text-amber-400",
  info: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-500"
};

export function InternalAlertsCard({ alerts }: { alerts: AlertItem[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold">O que precisa de atencao</h2>
          <p className="text-sm text-muted-foreground">Sugestoes praticas para evitar surpresa no fim do mes.</p>
        </div>
        <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Bell className="size-5" />
        </span>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
            Nenhum ponto de atencao agora. Defina valores previstos e metas para o Fluxa acompanhar automaticamente.
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const Icon = iconBySeverity[alert.severity];

              return (
                <div key={alert.id} className="flex gap-3 rounded-lg border border-border bg-muted/20 p-3">
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-md", toneBySeverity[alert.severity])}>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">{alert.title}</p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{alert.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
