"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Calculator, CheckCircle2, CircleDollarSign, ListChecks, Plus, SlidersHorizontal, Target, Trash2, WalletCards, type LucideIcon } from "lucide-react";
import { createPlannedExpense, deleteCategoryLimit, deletePlannedExpense, saveCategoryLimit, saveCategoryLimits, updatePlannedExpense, upsertSpendingPlan } from "@/app/(dashboard)/planning/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { economicModels } from "@/constants/economic-models";
import { cn, formatCurrency } from "@/lib/utils";

type LimitFilter = "active" | "planned" | "over" | "all";

type PlanningOverview = {
  month: number;
  year: number;
  monthLabel: string;
  planSource: string | null;
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
  paymentPlan: {
    fixedPlanned: number;
    variablePlanned: number;
    totalPlanned: number;
    paid: number;
    remaining: number;
    availableForGoals: number;
  };
  plannedItems: {
    id: string;
    name: string;
    planned: number;
    actual: number;
    difference: number;
    usage: number;
    type: "FIXED" | "VARIABLE";
    source: "category" | "manual";
    sourceMonth: number;
    sourceYear: number;
    inherited: boolean;
    note?: string;
  }[];
  goals: {
    id: string;
    name: string;
    targetAmount: number;
    savedAmount: number;
    remainingAmount: number;
  }[];
  nextMonthImpact: {
    monthLabel: string;
    baseIncome: number;
    salaryAdvanceTotal: number;
    salaryAdvanceCount: number;
    adjustedIncome: number;
    plannedExpenses: number;
    plannedCount: number;
    leftoverAfterPlanned: number;
    hasSalaryAdvance: boolean;
  };
};

const limitTypeLabels = {
  FIXED: "Fixo",
  VARIABLE: "Variavel"
};

const filterLabels: Record<LimitFilter, string> = {
  active: "Relevantes",
  planned: "Com valor",
  over: "Passou do limite",
  all: "Todas"
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
  const [plannedExpenseState, plannedExpenseAction, plannedExpensePending] = useActionState(createPlannedExpense, undefined as { error?: string; success?: string } | undefined);
  const [selectedModel, setSelectedModel] = useState(overview.plan?.model ?? "50/30/20");
  const [limitFilter, setLimitFilter] = useState<LimitFilter>("active");
  const isCustom = selectedModel === "custom";
  const selectedPreset = economicModels.find((model) => model.id === selectedModel) ?? economicModels[0];
  const needsPercent = overview.plan?.needsPercent ?? selectedPreset.needsPercent;
  const wantsPercent = overview.plan?.wantsPercent ?? selectedPreset.wantsPercent;
  const savingsPercent = overview.plan?.savingsPercent ?? selectedPreset.savingsPercent;
  const modelUsage = overview.groups.map((group) => {
    const usage = group.planned > 0 ? Math.round((group.actual / group.planned) * 100) : 0;
    return { ...group, usage, overLimit: group.planned > 0 && group.actual > group.planned };
  });
  const fixedBills = overview.plannedItems.filter((item) => item.planned > 0 && item.type === "FIXED");
  const variableBills = overview.plannedItems.filter((item) => item.planned > 0 && item.type !== "FIXED");

  const visibleLimits = useMemo(() => {
    return overview.categoryLimits
      .filter((item) => {
        if (limitFilter === "planned") return item.planned > 0;
        if (limitFilter === "active") return item.planned > 0 || item.actual >= 100;
        if (limitFilter === "over") return item.planned > 0 && item.actual > item.planned;
        return true;
      })
      .sort((a, b) => {
        const overA = a.planned > 0 && a.actual > a.planned ? 1 : 0;
        const overB = b.planned > 0 && b.actual > b.planned ? 1 : 0;
        if (overA !== overB) return overB - overA;
        const plannedA = a.planned > 0 ? 1 : 0;
        const plannedB = b.planned > 0 ? 1 : 0;
        if (plannedA !== plannedB) return plannedB - plannedA;
        if (a.actual !== b.actual) return b.actual - a.actual;
        return a.categoryName.localeCompare(b.categoryName);
      });
  }, [overview.categoryLimits, limitFilter]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-semibold">Plano de pagamentos e metas</h2>
            <p className="text-sm text-muted-foreground">Confira o que precisa pagar em {overview.monthLabel} e quanto pode sobrar para guardar.</p>
          </div>
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <ListChecks className="size-5" />
          </span>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={plannedExpenseAction} className="grid gap-3 rounded-xl border border-border bg-background/35 p-3 xl:grid-cols-[1fr_150px_150px_auto]">
            <input type="hidden" name="month" value={overview.month} />
            <input type="hidden" name="year" value={overview.year} />
            <Input name="name" placeholder="Ex: Apple Watch parcela" />
            <Input name="amount" inputMode="decimal" placeholder="Valor" />
            <select name="type" defaultValue="FIXED" className="h-10 rounded-xl border border-border bg-background px-3 text-sm">
              <option value="FIXED">Fixo</option>
              <option value="VARIABLE">Variavel</option>
            </select>
            <Button disabled={plannedExpensePending} className="whitespace-nowrap">
              <Plus className="size-4" />
              {plannedExpensePending ? "Adicionando..." : "Adicionar conta"}
            </Button>
            {plannedExpenseState?.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive xl:col-span-4">{plannedExpenseState.error}</p>}
            {plannedExpenseState?.success && <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary xl:col-span-4">{plannedExpenseState.success}</p>}
          </form>

          <section className="grid gap-3 md:grid-cols-4">
            <CompactMetric icon={CircleDollarSign} label="Renda planejada" value={formatCurrency(overview.nextMonthImpact.adjustedIncome)} detail="ja considera vale/adiantamento" />
            <CompactMetric icon={WalletCards} label="Contas fixas" value={formatCurrency(overview.paymentPlan.fixedPlanned)} detail={`${fixedBills.length} item(ns) marcado(s) como fixo`} />
            <CompactMetric icon={SlidersHorizontal} label="Gastos variaveis" value={formatCurrency(overview.paymentPlan.variablePlanned)} detail={`${variableBills.length} item(ns) flexiveis`} />
            <CompactMetric
              icon={Target}
              label="Sobra para metas"
              value={formatCurrency(overview.paymentPlan.availableForGoals)}
              detail="renda menos fixos e variaveis"
              tone={overview.paymentPlan.availableForGoals < 0 ? "danger" : "success"}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-3 md:grid-cols-2">
              <BillList title="Contas fixas" description="O que costuma ser obrigatorio pagar." items={fixedBills} month={overview.month} year={overview.year} emptyText="Nenhuma conta fixa marcada ainda." />
              <BillList title="Gastos combinados" description="Limites flexiveis para controlar o mes." items={variableBills} month={overview.month} year={overview.year} emptyText="Nenhum gasto variavel planejado ainda." />
            </div>
            <GoalPlanCard goals={overview.goals} availableForGoals={overview.paymentPlan.availableForGoals} />
          </section>
        </CardContent>
      </Card>

      <Card className={cn(overview.nextMonthImpact.hasSalaryAdvance && "border-red-500/30 bg-red-500/[0.04]")}>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-semibold">Projecao de {overview.nextMonthImpact.monthLabel}</h2>
            <p className="text-sm text-muted-foreground">
              Veja quanto pode sobrar considerando sua renda, vales ou adiantamentos do mes anterior e os gastos previstos.
            </p>
          </div>
          <span className={cn("grid size-10 place-items-center rounded-lg", overview.nextMonthImpact.hasSalaryAdvance ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary")}>
            <WalletCards className="size-5" />
          </span>
        </CardHeader>
        <CardContent className="space-y-4">
          <section className="grid gap-3 md:grid-cols-4">
            <CompactMetric icon={CircleDollarSign} label="Renda planejada" value={formatCurrency(overview.nextMonthImpact.baseIncome)} detail="renda mensal configurada" />
            <CompactMetric
              icon={AlertTriangle}
              label="Adiantamento/vale"
              value={`-${formatCurrency(overview.nextMonthImpact.salaryAdvanceTotal)}`}
              detail={
                overview.nextMonthImpact.salaryAdvanceCount > 0
                  ? `${overview.nextMonthImpact.salaryAdvanceCount} entrada(s) no mes anterior`
                  : "nenhum vale identificado"
              }
              tone={overview.nextMonthImpact.salaryAdvanceTotal > 0 ? "danger" : "neutral"}
            />
            <CompactMetric icon={WalletCards} label="Gastos previstos" value={formatCurrency(overview.nextMonthImpact.plannedExpenses)} detail={`${overview.nextMonthImpact.plannedCount} categoria(s) planejada(s)`} />
            <CompactMetric
              icon={overview.nextMonthImpact.leftoverAfterPlanned < 0 ? AlertTriangle : CheckCircle2}
              label="Sobra prevista"
              value={formatCurrency(overview.nextMonthImpact.leftoverAfterPlanned)}
              detail="renda ajustada menos gastos previstos"
              tone={overview.nextMonthImpact.leftoverAfterPlanned < 0 ? "danger" : "success"}
            />
          </section>
          <div className="rounded-lg border border-border bg-background/35 px-3 py-2 text-sm text-muted-foreground">
            Pense assim: renda planejada menos vales/adiantamentos do mes anterior, depois menos todos os valores previstos nas categorias.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-semibold">Divisao da renda</h2>
            <p className="text-sm text-muted-foreground">Informe quanto entra no mes e escolha uma divisao simples para acompanhar seus gastos.</p>
          </div>
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Calculator className="size-5" />
          </span>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={action} className="grid gap-3 xl:grid-cols-[180px_180px_1fr_90px_90px_90px_auto]">
            <input type="hidden" name="month" value={overview.month} />
            <input type="hidden" name="year" value={overview.year} />
            <Input name="monthlyIncome" defaultValue={overview.plan?.monthlyIncome ?? overview.actualIncome} type="number" min="0" step="0.01" placeholder="Renda mensal" />
            <select name="model" value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
              {economicModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
              <option value="custom">Personalizado</option>
            </select>
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {isCustom ? "Ajuste os percentuais. A soma precisa ser 100%." : "Necessidades sao contas essenciais. Desejos sao gastos flexiveis. Metas sao dinheiro guardado."}
            </div>
            <Input name="needsPercent" defaultValue={needsPercent} type="number" min="0" max="100" disabled={!isCustom} aria-label="Necessidades %" />
            <Input name="wantsPercent" defaultValue={wantsPercent} type="number" min="0" max="100" disabled={!isCustom} aria-label="Desejos %" />
            <Input name="savingsPercent" defaultValue={savingsPercent} type="number" min="0" max="100" disabled={!isCustom} aria-label="Metas %" />
            <Button disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
            {state?.error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive xl:col-span-7">{state.error}</p>}
            {state?.success && <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary xl:col-span-7">{state.success}</p>}
          </form>

          {overview.planSource && (
            <p className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
              Base deste mes: {overview.planSource}. Ajuste os valores e clique em Salvar para gravar o planejamento de {overview.monthLabel}.
            </p>
          )}

          <section className="grid gap-3 md:grid-cols-3">
            {modelUsage.map((group) => (
              <div key={group.key} className="rounded-lg border border-border bg-background/35 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-sm text-muted-foreground">{group.percent}% da renda</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {group.key === "needs" ? "Ex.: aluguel, luz, mercado" : group.key === "wants" ? "Ex.: delivery, lazer, compras" : "Ex.: reserva e objetivos"}
                    </p>
                  </div>
                  <strong className={cn("text-sm", group.overLimit ? "text-red-500" : "text-emerald-500")}>{group.usage}%</strong>
                </div>
                <div className="mt-3 h-2 rounded-full bg-background">
                  <div className={cn("h-2 rounded-full", group.overLimit ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, group.usage)}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatCurrency(group.actual)} de {formatCurrency(group.planned)}
                </p>
              </div>
            ))}
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-semibold">Gastos previstos por categoria</h2>
            <p className="text-sm text-muted-foreground">Preencha quanto pretende gastar. O Fluxa compara esse valor com o que aconteceu no mes.</p>
          </div>
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <SlidersHorizontal className="size-5" />
          </span>
        </CardHeader>
        <CardContent>
          <form action={limitAction} className="space-y-4">
            <input type="hidden" name="month" value={overview.month} />
            <input type="hidden" name="year" value={overview.year} />

            <section className="grid gap-3 md:grid-cols-4">
              <CompactMetric icon={CircleDollarSign} label="Previsto" value={formatCurrency(overview.limitSummary.plannedTotal)} detail={`${overview.limitSummary.plannedCount} com valor definido`} />
              <CompactMetric icon={CheckCircle2} label="Ja gasto" value={formatCurrency(overview.limitSummary.actualWithLimit)} detail="gasto acompanhado" />
              <CompactMetric
                icon={overview.limitSummary.difference < 0 ? AlertTriangle : CheckCircle2}
                label="Saldo"
                value={formatCurrency(overview.limitSummary.difference)}
                detail={overview.limitSummary.difference < 0 ? "acima do previsto" : "ainda disponível"}
                tone={overview.limitSummary.difference < 0 ? "danger" : "success"}
              />
              <CompactMetric
                icon={overview.limitSummary.overLimitCount > 0 ? AlertTriangle : CheckCircle2}
                label="Passaram"
                value={String(overview.limitSummary.overLimitCount)}
                detail={`${overview.limitSummary.spentCount} com gasto`}
                tone={overview.limitSummary.overLimitCount > 0 ? "danger" : "success"}
              />
            </section>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex w-fit flex-wrap gap-1 rounded-lg border border-border bg-background/50 p-1">
                {(Object.keys(filterLabels) as LimitFilter[]).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setLimitFilter(filter)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground",
                      limitFilter === filter && "bg-primary text-primary-foreground hover:text-primary-foreground"
                    )}
                  >
                    {filterLabels[filter]}
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Use Todas para definir um valor em uma categoria que ainda nao apareceu no mes.</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-background/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 font-medium">Categoria</th>
                    <th className="px-4 font-medium">Tipo</th>
                    <th className="px-4 font-medium">Valor previsto</th>
                    <th className="px-4 text-right font-medium">Ja gasto</th>
                    <th className="px-4 font-medium">Situacao</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLimits.map((item) => (
                    <CategoryLimitRow key={item.categoryId} item={item} month={overview.month} year={overview.year} />
                  ))}
                </tbody>
              </table>
              {visibleLimits.length === 0 && <p className="px-4 py-6 text-sm text-muted-foreground">Nenhuma categoria encontrada neste filtro.</p>}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">{limitPending ? "Salvando alteracoes..." : "As mudancas salvam ao alterar o tipo ou sair do campo de valor."}</p>
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

function BillList({
  title,
  description,
  items,
  month,
  year,
  emptyText
}: {
  title: string;
  description: string;
  items: PlanningOverview["plannedItems"];
  month: number;
  year: number;
  emptyText: string;
}) {
  const total = items.reduce((sum, item) => sum + item.planned, 0);

  return (
    <div className="rounded-xl border border-border bg-background/35 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <strong className="text-sm">{formatCurrency(total)}</strong>
      </div>

      <div className="mt-4 space-y-2">
        {items.length === 0 && <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">{emptyText}</p>}
        {items.map((item) => {
          if (item.source === "manual") return <PlannedExpenseInlineForm key={`${item.source}-${item.id}`} item={item} month={month} year={year} />;

          const remaining = item.planned - item.actual;
          const paid = item.planned > 0 && item.actual >= item.planned;

          return (
            <div key={`${item.source}-${item.id}`} className="rounded-lg border border-border/70 bg-card/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.actual)} pago de {formatCurrency(item.planned)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", paid ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-400/10 text-amber-300")}>
                    {paid ? "pago" : `${formatCurrency(Math.max(0, remaining))} falta`}
                  </span>
                  <DeleteCategoryLimitButton categoryId={item.id} month={month} year={year} />
                </div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-background">
                <div className={cn("h-2 rounded-full", paid ? "bg-emerald-500" : "bg-primary")} style={{ width: `${Math.min(100, item.usage)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlannedExpenseInlineForm({ item, month, year }: { item: PlanningOverview["plannedItems"][number]; month: number; year: number }) {
  const [state, action, pending] = useActionState(updatePlannedExpense, undefined as { error?: string; success?: string } | undefined);

  return (
    <div className="rounded-lg border border-border/70 bg-card/40 p-3">
      <form action={action} className="space-y-2">
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="month" value={month} />
        <input type="hidden" name="year" value={year} />
        <input type="hidden" name="note" value={item.note ?? ""} />
        <Input name="name" defaultValue={item.name} aria-label="Nome da conta planejada" placeholder="Nome da conta" />
        <div className="grid grid-cols-[1fr_120px] gap-2">
          <Input name="amount" defaultValue={item.planned.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} inputMode="decimal" aria-label="Valor planejado" />
          <select name="type" defaultValue={item.type} className="h-10 rounded-xl border border-border bg-background px-3 text-sm">
            <option value="FIXED">Fixo</option>
            <option value="VARIABLE">Variavel</option>
          </select>
        </div>
        <Button disabled={pending} className="h-10 w-full px-3 text-sm">
          {pending ? "Salvando..." : "Salvar alteracoes"}
        </Button>
      </form>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{item.inherited ? "Copiada do planejamento anterior" : "Conta adicionada manualmente"}</p>
        <DeletePlannedExpenseButton id={item.id} name={item.name} type={item.type} month={month} year={year} />
      </div>
      {state?.error && <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{state.error}</p>}
      {state?.success && <p className="mt-2 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">{state.success}</p>}
    </div>
  );
}

function GoalPlanCard({ goals, availableForGoals }: { goals: PlanningOverview["goals"]; availableForGoals: number }) {
  const activeGoals = goals.slice(0, 4);
  const suggestion = activeGoals.length > 0 ? Math.max(0, availableForGoals) / activeGoals.length : 0;

  return (
    <div className="rounded-xl border border-border bg-background/35 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Metas de economia</h3>
          <p className="text-sm text-muted-foreground">Use a sobra do mes para decidir quanto guardar.</p>
        </div>
        <Target className={cn("size-5", availableForGoals < 0 ? "text-red-500" : "text-emerald-500")} />
      </div>

      <div className="mt-4 rounded-lg border border-border/70 bg-card/40 p-3">
        <p className="text-sm text-muted-foreground">Disponivel para guardar</p>
        <strong className={cn("mt-1 block text-2xl", availableForGoals < 0 ? "text-red-500" : "text-emerald-500")}>{formatCurrency(availableForGoals)}</strong>
        <p className="mt-1 text-xs text-muted-foreground">Calculado depois dos gastos fixos e variaveis planejados.</p>
      </div>

      <div className="mt-4 space-y-2">
        {activeGoals.length === 0 && <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">Crie uma meta para o Fluxa mostrar como distribuir a sobra.</p>}
        {activeGoals.map((goal) => {
          const progress = goal.targetAmount > 0 ? Math.round((goal.savedAmount / goal.targetAmount) * 100) : 0;

          return (
            <div key={goal.id} className="rounded-lg border border-border/70 bg-card/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{goal.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(goal.savedAmount)} de {formatCurrency(goal.targetAmount)}
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{progress}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-background">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, progress)}%` }} />
              </div>
              {suggestion > 0 && <p className="mt-2 text-xs text-muted-foreground">Sugestao se dividir igual: {formatCurrency(Math.min(suggestion, goal.remainingAmount))}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeleteCategoryLimitButton({ categoryId, month, year }: { categoryId: string; month: number; year: number }) {
  const [, action, pending] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => deleteCategoryLimit(formData),
    undefined
  );

  return (
    <form action={action}>
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="year" value={year} />
      <button
        type="submit"
        disabled={pending}
        className="grid size-7 place-items-center rounded-lg border border-red-500/20 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
        aria-label="Remover limite desta categoria"
        title="Remover limite desta categoria"
      >
        <Trash2 className="size-3.5" />
      </button>
    </form>
  );
}

function DeletePlannedExpenseButton({ id, name, type, month, year }: { id: string; name: string; type: "FIXED" | "VARIABLE"; month: number; year: number }) {
  const [, action, pending] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => deletePlannedExpense(formData),
    undefined
  );

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="year" value={year} />
      <button
        type="submit"
        disabled={pending}
        className="grid size-7 place-items-center rounded-lg border border-red-500/20 text-red-400 transition hover:bg-red-500/10"
        aria-label="Remover conta planejada"
        title="Remover conta planejada"
      >
        <Trash2 className="size-3.5" />
      </button>
    </form>
  );
}

function CategoryLimitRow({
  item,
  month,
  year
}: {
  item: PlanningOverview["categoryLimits"][number];
  month: number;
  year: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(formatLimitInput(item.planned));
  const [type, setType] = useState<"FIXED" | "VARIABLE">(item.type === "FIXED" ? "FIXED" : "VARIABLE");
  const [error, setError] = useState<string>();
  const [isSaving, startTransition] = useTransition();
  const status = getLimitStatus(item);

  useEffect(() => {
    setAmount(formatLimitInput(item.planned));
    setType(item.type === "FIXED" ? "FIXED" : "VARIABLE");
  }, [item.categoryId, item.planned, item.type]);

  const save = (next?: { amount?: string; type?: "FIXED" | "VARIABLE" }) => {
    const payload = {
      month,
      year,
      categoryId: item.categoryId,
      amount: next?.amount ?? amount,
      type: next?.type ?? type
    };

    startTransition(async () => {
      const result = await saveCategoryLimit(payload);
      setError(result.error);
      if (!result.error) router.refresh();
    });
  };

  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-4 py-3">
        <input type="hidden" name="categoryId" value={item.categoryId} />
        <p className="font-medium">{item.categoryName}</p>
        <p className={cn("mt-1 text-xs", error ? "text-red-400" : "text-muted-foreground")}>{error ?? status.detail}</p>
      </td>
      <td className="px-4">
        <select
          name="type"
          value={type}
          onChange={(event) => {
            const nextType = event.target.value as "FIXED" | "VARIABLE";
            setType(nextType);
            save({ type: nextType });
          }}
          disabled={isSaving}
          className="h-9 w-32 rounded-md border border-border bg-background px-2 disabled:opacity-60"
        >
          {Object.entries(limitTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4">
        <Input
          name="amount"
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          onBlur={(event) => save({ amount: event.currentTarget.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
          disabled={isSaving}
          placeholder="0,00"
          className="max-w-32 disabled:opacity-60"
        />
      </td>
      <td className="px-4 text-right font-semibold">{formatCurrency(item.actual)}</td>
      <td className="min-w-56 px-4">
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 rounded-full bg-background">
            <div className={cn("h-2 rounded-full", status.barClass)} style={{ width: `${item.planned > 0 ? Math.min(100, item.usage) : 0}%` }} />
          </div>
          <span className={cn("w-20 text-right text-xs font-medium", isSaving ? "text-primary" : status.textClass)}>{isSaving ? "Salvando" : status.label}</span>
        </div>
      </td>
    </tr>
  );
}

function CompactMetric({
  icon: Icon,
  label,
  value,
  detail,
  tone = "neutral"
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "success" | "danger";
}) {
  return (
    <div className="rounded-lg border border-border bg-background/35 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <strong className={cn("mt-1 block truncate text-lg", tone === "success" && "text-emerald-500", tone === "danger" && "text-red-500")}>{value}</strong>
        </div>
        <Icon className={cn("size-4 shrink-0", tone === "danger" ? "text-red-500" : tone === "success" ? "text-emerald-500" : "text-primary")} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function getLimitStatus(item: PlanningOverview["categoryLimits"][number]) {
  if (item.planned <= 0) {
    return {
      label: "Sem valor",
      detail: item.actual > 0 ? "Gasto sem valor previsto" : "Sem movimento no mes",
      barClass: "bg-muted",
      textClass: "text-muted-foreground"
    };
  }

  if (item.actual > item.planned) {
    return {
      label: `${item.usage}%`,
      detail: `${formatCurrency(Math.abs(item.difference))} acima do previsto`,
      barClass: "bg-red-500",
      textClass: "text-red-500"
    };
  }

  if (item.usage >= 80) {
    return {
      label: `${item.usage}%`,
      detail: `${formatCurrency(item.difference)} restante`,
      barClass: "bg-amber-400",
      textClass: "text-amber-300"
    };
  }

  return {
    label: `${item.usage}%`,
    detail: `${formatCurrency(item.difference)} restante`,
    barClass: "bg-emerald-500",
    textClass: "text-emerald-500"
  };
}

function formatLimitInput(value: number) {
  if (value <= 0) return "";

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(value);
}
