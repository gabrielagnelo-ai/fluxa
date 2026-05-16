"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertTriangle, Calculator, CheckCircle2, PiggyBank, Target, WalletCards } from "lucide-react";
import { saveCategoryLimits, upsertSpendingPlan } from "@/app/(dashboard)/planning/actions";
import { FluxaLogo } from "@/components/brand/fluxa-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { economicModels } from "@/constants/economic-models";
import { cn, formatCurrency } from "@/lib/utils";

type LimitFilter = "all" | "planned" | "spent" | "over";

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
  categoryLimits: {
    categoryId: string;
    categoryName: string;
    planned: number;
    actual: number;
    difference: number;
    usage: number;
    type: "FIXED" | "VARIABLE" | "GOAL";
  }[];
  limitSummary: {
    plannedTotal: number;
    actualWithLimit: number;
    difference: number;
    overLimitCount: number;
    plannedCount: number;
    spentCount: number;
  };
};

const limitTypeLabels = {
  FIXED: "Fixo",
  VARIABLE: "Variável",
  GOAL: "Meta/reserva"
};

const filterLabels: Record<LimitFilter, string> = {
  all: "Todas",
  planned: "Com limite",
  spent: "Com gasto",
  over: "Estouradas"
};

export function EconomicPlanManager({ overview }: { overview: PlanningOverview }) {
  const [state, action, pending] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => upsertSpendingPlan(formData),
    undefined
  );
  const [limitState, limitAction, limitPending] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => saveCategoryLimits(formData),
    undefined
  );
  const [selectedModel, setSelectedModel] = useState(overview.plan?.model ?? "50/30/20");
  const [limitFilter, setLimitFilter] = useState<LimitFilter>("spent");
  const isCustom = selectedModel === "custom";
  const selectedPreset = economicModels.find((model) => model.id === selectedModel) ?? economicModels[0];
  const needsPercent = overview.plan?.needsPercent ?? selectedPreset.needsPercent;
  const wantsPercent = overview.plan?.wantsPercent ?? selectedPreset.wantsPercent;
  const savingsPercent = overview.plan?.savingsPercent ?? selectedPreset.savingsPercent;

  const visibleLimits = useMemo(() => {
    return overview.categoryLimits.filter((item) => {
      if (limitFilter === "planned") return item.planned > 0;
      if (limitFilter === "spent") return item.planned > 0 || item.actual > 0;
      if (limitFilter === "over") return item.planned > 0 && item.actual > item.planned;
      return true;
    });
  }, [overview.categoryLimits, limitFilter]);

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

      <Card>
        <CardHeader className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="font-semibold">Limites por categoria</h2>
            <p className="text-sm text-muted-foreground">
              Defina quanto pretende gastar em cada categoria neste mês. O Fluxa compara automaticamente com as transações importadas.
            </p>
          </div>
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Target className="size-5" />
          </span>
        </CardHeader>
        <CardContent>
          <form action={limitAction} className="space-y-5">
            <input type="hidden" name="month" value={overview.month} />
            <input type="hidden" name="year" value={overview.year} />

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <LimitSummaryCard icon={WalletCards} label="Previsto no mês" value={formatCurrency(overview.limitSummary.plannedTotal)} detail={`${overview.limitSummary.plannedCount} categoria(s) com limite`} />
              <LimitSummaryCard icon={Target} label="Realizado com limite" value={formatCurrency(overview.limitSummary.actualWithLimit)} detail="Gasto nas categorias planejadas" />
              <LimitSummaryCard
                icon={overview.limitSummary.difference < 0 ? AlertTriangle : CheckCircle2}
                label="Saldo dos limites"
                value={formatCurrency(overview.limitSummary.difference)}
                detail={overview.limitSummary.difference < 0 ? "Acima do previsto" : "Ainda disponível"}
                tone={overview.limitSummary.difference < 0 ? "danger" : "success"}
              />
              <LimitSummaryCard
                icon={AlertTriangle}
                label="Categorias estouradas"
                value={String(overview.limitSummary.overLimitCount)}
                detail={`${overview.limitSummary.spentCount} categoria(s) com gasto no mês`}
                tone={overview.limitSummary.overLimitCount > 0 ? "danger" : "success"}
              />
            </section>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-background/50 p-1">
                {(Object.keys(filterLabels) as LimitFilter[]).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setLimitFilter(filter)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground",
                      limitFilter === filter && "bg-primary text-primary-foreground shadow-[0_0_18px_rgba(37,99,235,0.2)] hover:text-primary-foreground"
                    )}
                  >
                    {filterLabels[filter]}
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Use Todas para definir limite em uma categoria sem gasto neste mês.</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[880px] text-sm">
                <thead className="bg-background/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 font-medium">Categoria</th>
                    <th className="px-4 font-medium">Tipo</th>
                    <th className="px-4 font-medium">Limite do mês</th>
                    <th className="px-4 text-right font-medium">Realizado</th>
                    <th className="px-4 text-right font-medium">Diferença</th>
                    <th className="px-4 font-medium">Uso</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLimits.map((item) => {
                    const overLimit = item.planned > 0 && item.actual > item.planned;
                    const hasLimit = item.planned > 0;

                    return (
                      <tr key={item.categoryId} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-3 font-medium">
                          <input type="hidden" name="categoryId" value={item.categoryId} />
                          {item.categoryName}
                        </td>
                        <td className="px-4">
                          <select name="type" defaultValue={item.type} className="h-9 w-36 rounded-md border border-border bg-background px-2">
                            {Object.entries(limitTypeLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4">
                          <Input name="amount" type="number" min="0" step="0.01" defaultValue={item.planned || ""} placeholder="0,00" className="max-w-36" />
                        </td>
                        <td className="px-4 text-right font-semibold">{formatCurrency(item.actual)}</td>
                        <td className={cn("px-4 text-right font-semibold", !hasLimit && "text-muted-foreground", hasLimit && (overLimit ? "text-red-500" : "text-emerald-500"))}>
                          {hasLimit ? formatCurrency(item.difference) : "-"}
                        </td>
                        <td className="min-w-44 px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 rounded-full bg-background">
                              <div className={overLimit ? "h-2 rounded-full bg-red-500" : "h-2 rounded-full bg-emerald-500"} style={{ width: `${hasLimit ? Math.min(100, item.usage) : 0}%` }} />
                            </div>
                            <span className="w-12 text-right text-xs text-muted-foreground">{hasLimit ? `${item.usage}%` : "-"}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {visibleLimits.length === 0 && <p className="px-4 py-6 text-sm text-muted-foreground">Nenhuma categoria encontrada para este filtro.</p>}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Deixe o valor zerado para remover o limite da categoria.</p>
              <Button disabled={limitPending}>{limitPending ? "Salvando..." : "Salvar limites"}</Button>
            </div>
            {limitState?.error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{limitState.error}</p>}
            {limitState?.success && <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{limitState.success}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function LimitSummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "neutral"
}: {
  icon: typeof Target;
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "success" | "danger";
}) {
  return (
    <div className="rounded-xl border border-border bg-background/45 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <strong className={cn("mt-1 block text-xl", tone === "success" && "text-emerald-500", tone === "danger" && "text-red-500")}>{value}</strong>
        </div>
        <span className={cn("grid size-9 place-items-center rounded-lg bg-primary/10 text-primary", tone === "success" && "bg-emerald-500/10 text-emerald-500", tone === "danger" && "bg-red-500/10 text-red-500")}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
