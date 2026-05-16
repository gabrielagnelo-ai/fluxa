"use server";

import { getInsightContext, generateAiInsights } from "@/services/insights-service";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getCurrentUserId } from "@/services/finance-data-service";
import { getPeriodRange } from "@/utils/period";

export async function generateFinancialAnalysis(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) return { provider: "local", text: "Faça login para gerar análise financeira." };
  const rateLimit = checkRateLimit(`ai-insights:${userId}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!rateLimit.allowed) return { provider: "local", text: "Muitas análises em sequência. Aguarde alguns minutos e tente novamente." };

  const period = getPeriodRange(Object.fromEntries(formData) as Record<string, string>);
  const context = await getInsightContext(period);
  return generateAiInsights(context);
}
