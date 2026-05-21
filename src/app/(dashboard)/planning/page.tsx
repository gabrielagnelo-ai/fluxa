import { EconomicPlanManager } from "@/components/dashboard/economic-plan-manager";
import { PageHeader } from "@/components/layout/page-header";
import { getPlanningOverview } from "@/services/planning-service";

export default async function PlanningPage() {
  const overview = await getPlanningOverview();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Seu plano do mes"
        title="Planejamento"
        description="Defina sua renda e diga quanto pretende gastar em contas essenciais, desejos e dinheiro guardado."
      />
      <EconomicPlanManager overview={overview} />
    </div>
  );
}
