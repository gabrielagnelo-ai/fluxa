import { EconomicPlanManager } from "@/components/dashboard/economic-plan-manager";
import { PlanningMonthSelector } from "@/components/dashboard/planning-month-selector";
import { PageHeader } from "@/components/layout/page-header";
import { getPlanningOverview } from "@/services/planning-service";

function getPlanningDate(params?: Record<string, string | string[] | undefined>) {
  const dateParam = typeof params?.date === "string" ? params.date : undefined;
  if (dateParam && /^\d{4}-\d{2}$/.test(dateParam)) {
    const [year, month] = dateParam.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }

  const month = Number(typeof params?.month === "string" ? params.month : undefined);
  const year = Number(typeof params?.year === "string" ? params.year : undefined);
  if (month >= 1 && month <= 12 && year >= 2020 && year <= 2100) {
    return new Date(year, month - 1, 1);
  }

  return new Date();
}

export default async function PlanningPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const planningDate = getPlanningDate(await searchParams);
  const overview = await getPlanningOverview(planningDate);

  return (
    <div className="fluxa-page workspace-page planning-page">
      <PageHeader
        title={`Planejamento de ${overview.monthLabel}`}
        description="Informe sua renda, defina limites por categoria e depois importe os gastos reais. Um orçamento previsto não registra um pagamento. Se este mês ainda não tiver um plano, o último salvo aparece como sugestão."
        actions={<PlanningMonthSelector month={overview.month} year={overview.year} />}
      />
      <EconomicPlanManager overview={overview} />
    </div>
  );
}
