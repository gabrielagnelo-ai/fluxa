"use client";

import { useActionState } from "react";
import { ExternalLink, Landmark, ShieldCheck } from "lucide-react";
import { generateBelvoWidget } from "@/app/(dashboard)/open-finance/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function BelvoConnectForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(
    async (_previousState: { error?: string; success?: string; widgetUrl?: string } | undefined, formData: FormData) => generateBelvoWidget(formData),
    undefined
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
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
          <form action={action} className="grid gap-3 md:grid-cols-2">
            <Input name="name" placeholder="Nome completo igual ao banco" required />
            <Input name="cpf" placeholder="CPF" inputMode="numeric" required />
            <select name="consentDays" defaultValue="183" className="h-10 rounded-md border border-border bg-background px-3 text-sm">
              <option value="92">3 meses</option>
              <option value="183">6 meses</option>
              <option value="275">9 meses</option>
              <option value="366">12 meses</option>
            </select>
            <Button disabled={!configured || pending}>{pending ? "Gerando..." : "Gerar widget Belvo"}</Button>
            {!configured && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-2">
                Configure BELVO_SECRET_ID e BELVO_SECRET_PASSWORD no ambiente para testar.
              </p>
            )}
            {state?.error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-2">{state.error}</p>}
            {state?.success && <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary md:col-span-2">{state.success}</p>}
            {state?.widgetUrl && (
              <a
                href={state.widgetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-glow md:col-span-2"
              >
                Abrir Hosted Widget
                <ExternalLink className="size-4" />
              </a>
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
        </CardContent>
      </Card>
    </div>
  );
}
