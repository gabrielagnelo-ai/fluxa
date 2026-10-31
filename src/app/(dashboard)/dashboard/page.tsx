import type { CSSProperties } from "react";
import { BalanceBaselineCard } from "@/components/dashboard/balance-baseline-card";
import { CategoryForecastCard } from "@/components/dashboard/category-forecast-card";
import { CreditAnalysis } from "@/components/dashboard/credit-analysis";
import { FinanceCharts } from "@/components/dashboard/finance-charts";
import { TutorialStarter } from "@/components/onboarding/guided-tutorial";
import { GoalsEvolution } from "@/components/dashboard/goals-evolution";
import { InternalAlertsCard } from "@/components/dashboard/internal-alerts-card";
import { OverviewPanels } from "@/components/dashboard/overview-panels";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { ProjectionCard } from "@/components/dashboard/projection-card";
import { WeeklyExpenseInsight } from "@/components/dashboard/weekly-expense-insight";
import { PageHeader } from "@/components/layout/page-header";
import {
  categoryForecast,
  creditOrigins,
  expensesByCategory,
  internalAlerts,
  monthlyEvolutionFromTransactions,
  projectPeriod,
  salaryAdvanceCredits,
  summarizeTransactions,
  weeklyExpenseInsight
} from "@/services/dashboard-service";
import {
  getBalanceBaselineForCurrentUser,
  getCurrentBalanceUntil,
  getDashboardEvolutionTransactions,
  getDashboardTransactions,
  getGoalsForCurrentUser
} from "@/services/finance-data-service";
import { getPlanningOverview } from "@/services/planning-service";
import { getPeriodRange } from "@/utils/period";

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const period = getPeriodRange(await searchParams);
  const [transactions, evolutionTransactions, goals, currentBalance, planningOverview, balanceBaseline] = await Promise.all([
    getDashboardTransactions(period),
    getDashboardEvolutionTransactions(period.end),
    getGoalsForCurrentUser(),
    getCurrentBalanceUntil(period.end),
    getPlanningOverview(period.end),
    getBalanceBaselineForCurrentUser()
  ]);
  const periodSummary = summarizeTransactions(transactions);
  const projection = projectPeriod(transactions, period);
  const weeklyInsight = weeklyExpenseInsight(evolutionTransactions, period.end);
  const goalSnapshots = goals.map((goal) => ({
    name: goal.name,
    targetAmount: Number(goal.targetAmount),
    contributedAmount: goal.contributions.reduce((sum, contribution) => sum + Number(contribution.amount), 0)
  }));
  const forecasts = categoryForecast(transactions, evolutionTransactions, period, planningOverview.categoryLimits);
  const shouldShowFirstSteps = evolutionTransactions.length === 0 && transactions.length === 0;
  const alerts = internalAlerts({
    forecasts,
    goals: goalSnapshots,
    projectedExpenses: projection.projectedExpenses,
    projectedIncome: projection.projectedIncome,
    salaryAdvance: salaryAdvanceCredits(transactions)
  });

  const categories = expensesByCategory(transactions);
  const hasData = transactions.length > 0 || evolutionTransactions.length > 0;

  return (
    <div className="fluxa-page dashboard-page">
      <TutorialStarter eligible={shouldShowFirstSteps} incomeConfigured={Number(planningOverview.plan?.monthlyIncome ?? 0) > 0} limitsConfigured={planningOverview.categoryLimits.some(item => item.planned > 0)} />
      <PageHeader title="Visão geral" description={describePeriod(period)} actions={<PeriodFilter start={period.start} end={period.end} />} />

      <div className="dashboard-grid">
        <div className="span-7 rise" style={{ "--i": 0 } as CSSProperties}>
          <OverviewPanels balance={currentBalance} estimated={!balanceBaseline} income={periodSummary.income} expenses={periodSummary.expenses} hasData={hasData} />
        </div>
        <div className="span-5 rise" style={{ "--i": 1 } as CSSProperties}><ProjectionCard {...projection} /></div>
        <div className="span-6 rise" style={{ "--i": 2 } as CSSProperties}><InternalAlertsCard alerts={alerts} /></div>
        <div className="span-6 rise" style={{ "--i": 3 } as CSSProperties}><CategoryForecastCard forecasts={forecasts} /></div>
      </div>

      <div className="dashboard-section-heading"><h2 className="section-title">Para onde o dinheiro foi</h2></div>
      <div className="dashboard-grid">
        <div className="span-7"><FinanceCharts categoryData={categories} evolutionData={[]} view="categories" /></div>
        <div className="span-5"><WeeklyExpenseInsight {...weeklyInsight} /></div>
        <div className="span-12"><FinanceCharts categoryData={categories} evolutionData={monthlyEvolutionFromTransactions(evolutionTransactions)} view="evolution" /></div>
        <div className="span-12"><CreditAnalysis origins={creditOrigins(transactions)} /></div>
      </div>

      <div className="dashboard-section-heading"><h2 className="section-title">Metas e conta</h2></div>
      <div className="dashboard-grid">
        <div className="span-12">
          <GoalsEvolution
            goals={goals.map((goal) => ({
              id: goal.id,
              name: goal.name,
              targetAmount: Number(goal.targetAmount),
              contributedAmount: goal.contributions.reduce((sum, contribution) => sum + Number(contribution.amount), 0),
              contributions: goal.contributions.map((contribution) => ({
                date: contribution.date.toISOString(),
                amount: Number(contribution.amount)
              }))
            }))}
          />
        </div>
        <div className="span-12"><BalanceBaselineCard baseline={balanceBaseline} currentBalance={currentBalance} defaultDate={period.start} /></div>
      </div>
    </div>
  );
}

function describePeriod({ start, end }: { start: Date; end: Date }) {
  const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const fullMonth = start.getDate() === 1 && end.getFullYear() === start.getFullYear() && end.getMonth() === start.getMonth() && end.getDate() === lastDay;
  if (fullMonth) {
    const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(start);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  const format = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric" });
  return `${format.format(start).replace(/\./g, "")} a ${format.format(end).replace(/\./g, "")}`;
}
