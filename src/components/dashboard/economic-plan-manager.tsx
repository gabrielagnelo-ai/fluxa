"use client";

import { useActionState, useState } from "react";
import { Calculator, PiggyBank } from "lucide-react";
import { upsertSpendingPlan } from "@/app/(dashboard)/planning/actions";
import { FluxaLogo } from "@/components/brand/fluxa-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { economicModels } from "@/constants/economic-models";
import { formatCurrency } from "@/lib/utils";

type PlanningOverview = {
  month: number;
  year: number;
  plan: {
    monthlyIncome: number;
    model: string;
    needsPercent: number;
    wantsPercent: number;
    savingsPercent: number;
  } | null;
  actualIncome: number;
  groups: {
    key: "needs" | "wants" | "savings";
    name: string;
    planned: number;
    actual: number;
    percent: number;
  }[];
};

export function EconomicPlanManager({ overview }: { overview: PlanningOverview }) {
  const [state, action, pending] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => upsertSpendingPlan(formData),
    undefined
  );
  const [selectedModel, setSelectedModel] = useState(overview.plan?.model ?? "50/30/20");
  const isCustom = selectedModel === "custom";
  const selectedPreset = economicModels.find((model) => model.id === selectedModel) ?? economicModels[0];
  const needsPercent = overview.plan?.needsPercent ?? selectedPreset.needsPercent;
  const wantsPercent = overview.plan?.wantsPercent ?? selectedPreset.wantsPercent;
  const savingsPercent = overview.plan?.savingsPercent ?? selectedPreset.savingsPercent;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <FluxaLogo className="scale-90 origin-left" />
            <div>
              <h2 className="font-semibold">Modelo econômico mensal</h2>
              <p className="text-sm text-muted-foreground">Defina sua renda base e compare o gasto real com uma divisão saudável.</p>
            </div>
          </div>
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Calculator className="size-5" />
          </span>
        </CardHeader>
        <CardContent>
          <form action={action} className="grid gap-3 lg:grid-cols-[0.55fr_0.55fr_1fr_0.45fr_0.45fr_0.45fr_auto]">
            <input type="hidden" name="month" value={overview.month} />
            <input type="hidden" name="year" value={overview.year} />
            <Input name="monthlyIncome" defaultValue={overview.plan?.monthlyIncome ?? overview.actualIncome} type="number" min="0" step="0.01" placeholder="Renda mensal" />
            <select
              name="model"
              value={selectedModel}
              onChange={(event) => setSelectedModel(event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              {economicModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
              <option value="custom">Personalizado</option>
            </select>
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {isCustom ? "Ajuste os percentuais. A soma precisa ser 100%." : selectedPreset.description}
            </div>
            <Input name="needsPercent" defaultValue={needsPercent} type="number" min="0" max="100" disabled={!isCustom} aria-label="Necessidades %" />
            <Input name="wantsPercent" defaultValue={wantsPercent} type="number" min="0" max="100" disabled={!isCustom} aria-label="Desejos %" />
            <Input name="savingsPercent" defaultValue={savingsPercent} type="number" min="0" max="100" disabled={!isCustom} aria-label="Metas %" />
            <Button disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
            {state?.error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive lg:col-span-7">{state.error}</p>}
            {state?.success && <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary lg:col-span-7">{state.success}</p>}
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-3">
        {overview.groups.map((group) => {
          const usage = group.planned > 0 ? Math.round((group.actual / group.planned) * 100) : 0;
          const overLimit = group.actual > group.planned && group.planned > 0;

          return (
            <Card key={group.key}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{group.name}</h2>
                    <p className="text-sm text-muted-foreground">{group.percent}% da renda planejada</p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <PiggyBank className="size-5" />
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Usado</p>
                  <strong className={overLimit ? "block text-2xl text-red-500" : "block text-2xl"}>{formatCurrency(group.actual)}</strong>
                  <p className="text-sm text-muted-foreground">Limite recomendado: {formatCurrency(group.planned)}</p>
                  <div className="h-2 rounded-full bg-muted">
                    <div className={overLimit ? "h-2 rounded-full bg-red-500" : "h-2 rounded-full bg-emerald-500"} style={{ width: `${Math.min(100, usage)}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{usage}% do limite mensal usado</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
