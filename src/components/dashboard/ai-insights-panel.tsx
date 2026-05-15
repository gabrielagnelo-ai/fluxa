"use client";

import { useActionState } from "react";
import { Bot, Bell, CheckCircle2, CircleAlert, Info, TriangleAlert } from "lucide-react";
import { generateFinancialAnalysis } from "@/app/(dashboard)/insights/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { NotificationItem } from "@/services/insights-service";
import { formatDateInput } from "@/utils/period";

function NotificationIcon({ severity }: { severity: NotificationItem["severity"] }) {
  if (severity === "danger") return <CircleAlert className="size-4 text-red-500" />;
  if (severity === "warning") return <TriangleAlert className="size-4 text-amber-400" />;
  if (severity === "success") return <CheckCircle2 className="size-4 text-emerald-500" />;
  return <Info className="size-4 text-primary" />;
}

function renderAnalysis(text: string) {
  return text.split(/\n+/).map((line, index) => {
    const cleanLine = line
      .replace(/^#{1,6}\s*/, "")
      .replace(/\*\*/g, "")
      .replace(/^\*\s*/, "• ");

    if (!cleanLine.trim()) return null;

    const heading = /^(\d+\.|Resumo|Análise|Recomendações|Alertas|Conclusão)/i.test(cleanLine);

    return (
      <p key={`${cleanLine}-${index}`} className={heading ? "font-semibold text-foreground" : "text-muted-foreground"}>
        {cleanLine}
      </p>
    );
  });
}

export function AiInsightsPanel({
  localAnalysis,
  notifications,
  start,
  end
}: {
  localAnalysis: string;
  notifications: NotificationItem[];
  start: Date;
  end: Date;
}) {
  const [state, action, pending] = useActionState(
    async (_previousState: { provider: string; text: string }, formData: FormData) => generateFinancialAnalysis(formData),
    { provider: "local", text: localAnalysis }
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold">Análise inteligente</h2>
            <p className="text-sm text-muted-foreground">Usa dados agregados do mês, sem enviar descrições individuais das transações.</p>
          </div>
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Bot className="size-5" />
          </span>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={action}>
            <input type="hidden" name="start" value={formatDateInput(start)} />
            <input type="hidden" name="end" value={formatDateInput(end)} />
            <Button disabled={pending}>{pending ? "Analisando..." : "Gerar análise com IA"}</Button>
          </form>
          <div className="h-[62vh] min-h-[520px] overflow-y-scroll overscroll-contain rounded-lg border border-border bg-muted/30 p-5 text-sm leading-7">
            <div className="space-y-3 pr-2">{renderAnalysis(state.text)}</div>
          </div>
          <p className="text-xs text-muted-foreground">
            Modo atual: {state.provider === "gemini" ? "Gemini API" : "análise local sem API externa"}.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <h2 className="font-semibold">Notificações</h2>
            <p className="text-sm text-muted-foreground">Alertas internos de orçamento, metas e saldo mensal.</p>
          </div>
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Bell className="size-5" />
          </span>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex items-start gap-3">
                <NotificationIcon severity={notification.severity} />
                <div>
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.description}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
