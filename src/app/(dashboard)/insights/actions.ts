"use server";

import { getInsightContext, generateAiInsights } from "@/services/insights-service";
import { getPeriodRange } from "@/utils/period";

export async function generateFinancialAnalysis(formData: FormData) {
  const period = getPeriodRange(Object.fromEntries(formData) as Record<string, string>);
  const context = await getInsightContext(period);
  return generateAiInsights(context);
}
