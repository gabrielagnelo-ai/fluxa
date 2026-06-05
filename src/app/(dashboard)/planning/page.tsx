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
    <div className="space-y-5">
      <PageHeader
        eyebrow="Seu plano do mes"
        title={`Planejamento de ${overview.monthLabel}`}
        description="Escolha o mes que quer organizar. Se ainda nao existir um plano para ele, o Fluxa usa o ultimo planejamento salvo como sugestao."
        actions={<PlanningMonthSelector month={overview.month} year={overview.year} />}
      />
      <EconomicPlanManager overview={overview} />
    </div>
  );
}
