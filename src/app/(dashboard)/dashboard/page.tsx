import { CreditCard, PiggyBank, TrendingDown, TrendingUp } from "lucide-react";
import { Logo } from "@/components/branding/logo";
import { BalanceBaselineCard } from "@/components/dashboard/balance-baseline-card";
import { CategoryForecastCard } from "@/components/dashboard/category-forecast-card";
import { CreditAnalysis } from "@/components/dashboard/credit-analysis";
import { FinanceCharts } from "@/components/dashboard/finance-charts";
import { FirstStepsCard } from "@/components/dashboard/first-steps-card";
import { GoalsEvolution } from "@/components/dashboard/goals-evolution";
import { InternalAlertsCard } from "@/components/dashboard/internal-alerts-card";
import { InvestmentSummaryCard } from "@/components/dashboard/investment-summary-card";
import { KpiCard } from "@/components/dashboard/kpi-card";
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
import { buildInvestmentOverview, getInvestmentsForCurrentUser } from "@/services/investment-service";
import { getPlanningOverview } from "@/services/planning-service";
import { getPeriodLabel, getPeriodRange } from "@/utils/period";

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const period = getPeriodRange(await searchParams);
  const [transactions, evolutionTransactions, goals, currentBalance, investments, planningOverview, balanceBaseline] = await Promise.all([
    getDashboardTransactions(period),
    getDashboardEvolutionTransactions(period.end),
    getGoalsForCurrentUser(),
    getCurrentBalanceUntil(period.end),
    getInvestmentsForCurrentUser(),
    getPlanningOverview(period.end),
    getBalanceBaselineForCurrentUser()
  ]);
  const periodSummary = summarizeTransactions(transactions);
  const projection = projectPeriod(transactions, period);
  const weeklyInsight = weeklyExpenseInsight(evolutionTransactions, period.end);
  const investmentOverview = buildInvestmentOverview(investments);
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
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <Logo size="sm" compact />
            Visao geral
          </span>
        }
        title="Dashboard financeiro"
        description={`Resumo de ${getPeriodLabel(period)} com saldo atual, fluxo do mes, categorias, metas e tendencia de fechamento. O saldo atual considera saldo inicial configurado mais entradas, menos saidas, ate o fim do periodo selecionado.`}
        actions={<PeriodFilter start={period.start} end={period.end} />}
      />

      {shouldShowFirstSteps && <FirstStepsCard />}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={balanceBaseline ? "Saldo atual" : "Saldo estimado"} value={currentBalance} icon={CreditCard} tone="bg-blue-500/10 text-blue-500" />
        <KpiCard label="Receitas do periodo" value={periodSummary.income} icon={TrendingUp} tone="bg-emerald-500/10 text-emerald-600" />
        <KpiCard label="Despesas do periodo" value={periodSummary.expenses} icon={TrendingDown} tone="bg-red-500/10 text-red-600" />
        <KpiCard label="Economia do periodo" value={periodSummary.savings} icon={PiggyBank} tone="bg-blue-500/10 text-blue-600" />
      </section>

      <BalanceBaselineCard baseline={balanceBaseline} currentBalance={currentBalance} defaultDate={period.start} />

      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <ProjectionCard {...projection} />
        <WeeklyExpenseInsight {...weeklyInsight} />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <CategoryForecastCard forecasts={forecasts} />
        <InternalAlertsCard alerts={alerts} />
      </section>
      <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <InvestmentSummaryCard {...investmentOverview} />
        <CreditAnalysis origins={creditOrigins(transactions)} />
      </section>
      <FinanceCharts categoryData={expensesByCategory(transactions)} evolutionData={monthlyEvolutionFromTransactions(evolutionTransactions)} />
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
  );
}
