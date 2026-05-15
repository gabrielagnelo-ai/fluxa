import { EconomicPlanManager } from "@/components/dashboard/economic-plan-manager";
import { PageHeader } from "@/components/layout/page-header";
import { getPlanningOverview } from "@/services/planning-service";

export default async function PlanningPage() {
  const overview = await getPlanningOverview();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Orçamento e modelo econômico"
        title="Planejamento"
        description="Use modelos como 50/30/20 ou 60/30/10 para distribuir sua renda entre necessidades, desejos e metas."
      />
      <EconomicPlanManager overview={overview} />
    </div>
  );
}
