"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Calculator, CheckCircle2, CircleDollarSign, SlidersHorizontal, WalletCards, type LucideIcon } from "lucide-react";
import { saveCategoryLimit, saveCategoryLimits, upsertSpendingPlan } from "@/app/(dashboard)/planning/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { economicModels } from "@/constants/economic-models";
import { cn, formatCurrency } from "@/lib/utils";

type LimitFilter = "active" | "planned" | "over" | "all";

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
  VARIABLE: "Variável"
};

const filterLabels: Record<LimitFilter, string> = {
  active: "Relevantes",
  planned: "Com limite",
  over: "Estouradas",
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
            <h2 className="font-semibold">Modelo econômico</h2>
            <p className="text-sm text-muted-foreground">Defina renda e percentuais. O Fluxa compara com seus gastos reais.</p>
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
              {isCustom ? "Ajuste os percentuais. A soma precisa ser 100%." : selectedPreset.description}
            </div>
            <Input name="needsPercent" defaultValue={needsPercent} type="number" min="0" max="100" disabled={!isCustom} aria-label="Necessidades %" />
            <Input name="wantsPercent" defaultValue={wantsPercent} type="number" min="0" max="100" disabled={!isCustom} aria-label="Desejos %" />
            <Input name="savingsPercent" defaultValue={savingsPercent} type="number" min="0" max="100" disabled={!isCustom} aria-label="Metas %" />
            <Button disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
            {state?.error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive xl:col-span-7">{state.error}</p>}
            {state?.success && <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary xl:col-span-7">{state.success}</p>}
          </form>

          <section className="grid gap-3 md:grid-cols-3">
            {modelUsage.map((group) => (
              <div key={group.key} className="rounded-lg border border-border bg-background/35 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-sm text-muted-foreground">{group.percent}% da renda</p>
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

      {overview.nextMonthImpact.hasSalaryAdvance && (
        <Card className="border-red-500/30 bg-red-500/[0.04]">
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-semibold">Impacto no próximo salário</h2>
              <p className="text-sm text-muted-foreground">
                Adiantamentos e vales deste mês reduzem a renda disponível em {overview.nextMonthImpact.monthLabel}. A sobra abaixo considera todos os limites registrados.
              </p>
            </div>
            <span className="grid size-10 place-items-center rounded-lg bg-red-500/10 text-red-500">
              <WalletCards className="size-5" />
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <section className="grid gap-3 md:grid-cols-4">
              <CompactMetric icon={CircleDollarSign} label="Salário base" value={formatCurrency(overview.nextMonthImpact.baseIncome)} detail="renda mensal configurada" />
              <CompactMetric
                icon={AlertTriangle}
                label="Adiantamento/vale"
                value={`-${formatCurrency(overview.nextMonthImpact.salaryAdvanceTotal)}`}
                detail={`${overview.nextMonthImpact.salaryAdvanceCount} entrada(s) identificada(s)`}
                tone="danger"
              />
              <CompactMetric icon={WalletCards} label="Salário ajustado" value={formatCurrency(overview.nextMonthImpact.adjustedIncome)} detail="estimado para o próximo mês" />
              <CompactMetric
                icon={overview.nextMonthImpact.leftoverAfterPlanned < 0 ? AlertTriangle : CheckCircle2}
                label="Sobra prevista"
                value={formatCurrency(overview.nextMonthImpact.leftoverAfterPlanned)}
                detail={`${overview.nextMonthImpact.plannedCount} limite(s) registrado(s)`}
                tone={overview.nextMonthImpact.leftoverAfterPlanned < 0 ? "danger" : "success"}
              />
            </section>
            <div className="rounded-lg border border-red-500/20 bg-background/35 px-3 py-2 text-sm text-muted-foreground">
              Cálculo: salário base menos adiantamento/vale, depois menos os limites definidos em Planejamento. Isso não altera sua renda salva automaticamente.
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-semibold">Limites por categoria</h2>
            <p className="text-sm text-muted-foreground">Controle somente as categorias importantes. Linhas sem limite e sem gasto ficam fora da visão principal.</p>
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
              <CompactMetric icon={CircleDollarSign} label="Planejado" value={formatCurrency(overview.limitSummary.plannedTotal)} detail={`${overview.limitSummary.plannedCount} com limite`} />
              <CompactMetric icon={CheckCircle2} label="Realizado" value={formatCurrency(overview.limitSummary.actualWithLimit)} detail="gasto monitorado" />
              <CompactMetric
                icon={overview.limitSummary.difference < 0 ? AlertTriangle : CheckCircle2}
                label="Saldo"
                value={formatCurrency(overview.limitSummary.difference)}
                detail={overview.limitSummary.difference < 0 ? "acima do previsto" : "ainda disponível"}
                tone={overview.limitSummary.difference < 0 ? "danger" : "success"}
              />
              <CompactMetric
                icon={overview.limitSummary.overLimitCount > 0 ? AlertTriangle : CheckCircle2}
                label="Estouradas"
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
              <p className="text-sm text-muted-foreground">Use “Todas” para criar limite em uma categoria que ainda não apareceu no mês.</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-background/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 font-medium">Categoria</th>
                    <th className="px-4 font-medium">Tipo</th>
                    <th className="px-4 font-medium">Limite</th>
                    <th className="px-4 text-right font-medium">Gasto</th>
                    <th className="px-4 font-medium">Situação</th>
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
              <p className="text-sm text-muted-foreground">{limitPending ? "Salvando alterações..." : "As mudanças salvam ao alterar o tipo ou sair do campo de valor."}</p>
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
      label: "Sem limite",
      detail: item.actual > 0 ? "Gasto sem meta definida" : "Sem movimento no mês",
      barClass: "bg-muted",
      textClass: "text-muted-foreground"
    };
  }

  if (item.actual > item.planned) {
    return {
      label: `${item.usage}%`,
      detail: `${formatCurrency(Math.abs(item.difference))} acima do limite`,
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
