import { AiInsightsPanel } from "@/components/dashboard/ai-insights-panel";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { PageHeader } from "@/components/layout/page-header";
import { buildLocalInsights, buildNotifications, getInsightContext } from "@/services/insights-service";
import { getPeriodLabel, getPeriodRange } from "@/utils/period";

export default async function InsightsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const period = getPeriodRange(await searchParams);
  const context = await getInsightContext(period);
  const localAnalysis = buildLocalInsights(context);
  const notifications = buildNotifications(context);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="IA e alertas"
        title="Inteligência financeira"
        description={`Análise baseada no mesmo fluxo filtrado do dashboard: ${getPeriodLabel(period)}.`}
        actions={<PeriodFilter start={period.start} end={period.end} />}
      />
      <AiInsightsPanel localAnalysis={localAnalysis} notifications={notifications} start={period.start} end={period.end} />
    </div>
  );
}
