import { formatCurrency } from "@/lib/utils";
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
import { getPeriodLabel, getPeriodRange } from "@/utils/period";

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

  return (
    <div className="fluxa-page dashboard-page">
      <TutorialStarter eligible={shouldShowFirstSteps} incomeConfigured={Number(planningOverview.plan?.monthlyIncome ?? 0) > 0} limitsConfigured={planningOverview.categoryLimits.some(item => item.planned > 0)} />
      <PageHeader title="Seu panorama financeiro" description={`Acompanhe seu dinheiro em ${getPeriodLabel(period)}.`} actions={<PeriodFilter start={period.start} end={period.end} />} />

      <OverviewPanels balance={currentBalance} estimated={!balanceBaseline}
        income={periodSummary.income} expenses={periodSummary.expenses}
        categories={expensesByCategory(transactions)}
        goals={goalSnapshots} />
      <FinanceCharts categoryData={expensesByCategory(transactions)} evolutionData={monthlyEvolutionFromTransactions(evolutionTransactions)} />
      <section aria-label="Detalhes financeiros do mês">
        <div className="dashboard-detail-grid">
          <section className="dashboard-period-totals" aria-label="Indicadores do período"><div>Receitas<strong>{formatCurrency(periodSummary.income)}</strong></div><div>Despesas<strong>{formatCurrency(periodSummary.expenses)}</strong></div><div>Resultado do período<strong className={periodSummary.balance < 0 ? "text-red-400" : "text-emerald-400"}>{formatCurrency(periodSummary.balance)}</strong></div></section>
          <p className="period-metric-note">Entradas e saídas registradas no período selecionado. Resultado = receitas − despesas; não inclui o saldo inicial nem representa o saldo disponível no banco.</p>

          <div className="dashboard-section-heading"><h2>Seu mês em detalhe</h2><p>Projeções, alertas e acompanhamento das suas metas.</p></div>
          <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <ProjectionCard {...projection} />
            <WeeklyExpenseInsight {...weeklyInsight} />
          </section>
          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <CategoryForecastCard forecasts={forecasts} />
            <InternalAlertsCard alerts={alerts} />
          </section>
          <CreditAnalysis origins={creditOrigins(transactions)} />
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
          <BalanceBaselineCard baseline={balanceBaseline} currentBalance={currentBalance} defaultDate={period.start} />
        </div>
      </section>
    </div>
  );
}
