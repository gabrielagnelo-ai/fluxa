"use client";

import { useActionState, useEffect } from "react";
import { Landmark, ShieldCheck } from "lucide-react";
import { disconnectBelvoBank, generateBelvoWidget } from "@/app/(dashboard)/open-finance/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function BelvoConnectForm({ configured }: { configured: boolean }) {
  const [connectState, connectAction, connectPending] = useActionState(
    async (_previousState: { error?: string; success?: string; widgetUrl?: string } | undefined, formData: FormData) => generateBelvoWidget(formData),
    undefined
  );
  const [disconnectState, disconnectAction, disconnectPending] = useActionState(
    async () => disconnectBelvoBank(),
    undefined as { error?: string; success?: string } | undefined
  );

  useEffect(() => {
    if (connectState?.widgetUrl) {
      window.location.assign(connectState.widgetUrl);
    }
  }, [connectState?.widgetUrl]);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
      <Card className="xl:col-span-2">
        <CardHeader>
          <h2 className="font-semibold">Antes de conectar</h2>
          <p className="text-sm text-muted-foreground">
            O Fluxa solicitará consentimento explícito para acessar contas, saldos, transações, titularidade e faturas via Belvo/Open Finance.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="font-medium">Finalidade</p>
            <p className="mt-1 text-sm text-muted-foreground">Organização financeira, categorização de gastos e visão consolidada.</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="font-medium">Minimização</p>
            <p className="mt-1 text-sm text-muted-foreground">O Fluxa salva apenas dados necessários para dashboard, transações e análises.</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="font-medium">Controle</p>
            <p className="mt-1 text-sm text-muted-foreground">Você pode desconectar o banco e impedir novas sincronizações a qualquer momento.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold">Conectar com Belvo</h2>
            <p className="text-sm text-muted-foreground">
              Gere um link seguro do Hosted Widget para testar Open Finance com consentimento explícito.
            </p>
          </div>
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Landmark className="size-5" />
          </span>
        </CardHeader>
        <CardContent>
          <form action={connectAction} className="grid gap-3 md:grid-cols-2">
            <Input name="name" placeholder="Nome completo igual ao banco" required />
            <Input name="cpf" placeholder="CPF" inputMode="numeric" required />
            <select name="consentDays" defaultValue="183" className="h-10 rounded-md border border-border bg-background px-3 text-sm">
              <option value="92">3 meses</option>
              <option value="183">6 meses</option>
              <option value="275">9 meses</option>
              <option value="366">12 meses</option>
            </select>
            <Button disabled={!configured || connectPending}>{connectPending ? "Abrindo Belvo..." : "Conectar banco"}</Button>
            {!configured && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-2">
                Configure BELVO_SECRET_ID e BELVO_SECRET_PASSWORD no ambiente para testar.
              </p>
            )}
            {connectState?.error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-2">{connectState.error}</p>}
            {connectState?.widgetUrl && (
              <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary md:col-span-2">
                Redirecionando para a Belvo...
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Como o teste funciona</h2>
          <p className="text-sm text-muted-foreground">Nesta etapa o Fluxa só inicia o consentimento. A importação automática vem depois.</p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3 rounded-lg border border-border bg-muted/20 p-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
            <p>As credenciais da Belvo ficam apenas no servidor e nunca são enviadas para o navegador.</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="font-medium text-foreground">Recursos solicitados</p>
            <p className="mt-1">Contas, transações, titulares e faturas. Investimentos pode ser adicionado depois, se estiver liberado na conta Belvo.</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="font-medium text-foreground">Próxima etapa</p>
            <p className="mt-1">Salvar o link/consentimento no banco e buscar contas/transações para transformar em lançamentos do Fluxa.</p>
          </div>
          <form action={disconnectAction} className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="font-medium text-foreground">Revogação local</p>
            <p className="mt-1">Desconectar bloqueia novas sincronizações no Fluxa. A revogação definitiva também deve ser feita no fluxo da instituição/Belvo.</p>
            <Button className="mt-3 bg-red-500 text-white hover:shadow-none" disabled={disconnectPending}>
              {disconnectPending ? "Desconectando..." : "Desconectar banco"}
            </Button>
            {disconnectState?.error && <p className="mt-2 text-xs text-red-400">{disconnectState.error}</p>}
            {disconnectState?.success && <p className="mt-2 text-xs text-emerald-400">{disconnectState.success}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
