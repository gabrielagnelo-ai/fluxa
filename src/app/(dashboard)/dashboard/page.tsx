import { CreditCard, PiggyBank, TrendingDown, TrendingUp } from "lucide-react";
import { CreditAnalysis } from "@/components/dashboard/credit-analysis";
import { FinanceCharts } from "@/components/dashboard/finance-charts";
import { GoalsEvolution } from "@/components/dashboard/goals-evolution";
import { InvestmentSummaryCard } from "@/components/dashboard/investment-summary-card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { ProjectionCard } from "@/components/dashboard/projection-card";
import { WeeklyExpenseInsight } from "@/components/dashboard/weekly-expense-insight";
import { Logo } from "@/components/branding/logo";
import { PageHeader } from "@/components/layout/page-header";
import { creditOrigins, expensesByCategory, monthlyEvolutionFromTransactions, projectPeriod, summarizeTransactions, weeklyExpenseInsight } from "@/services/dashboard-service";
import { getCurrentBalanceUntil, getDashboardEvolutionTransactions, getDashboardTransactions, getGoalsForCurrentUser } from "@/services/finance-data-service";
import { buildInvestmentOverview, getInvestmentsForCurrentUser } from "@/services/investment-service";
import { getPeriodLabel, getPeriodRange } from "@/utils/period";

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const period = getPeriodRange(await searchParams);
  const [transactions, evolutionTransactions, goals, currentBalance, investments] = await Promise.all([
    getDashboardTransactions(period),
    getDashboardEvolutionTransactions(period.end),
    getGoalsForCurrentUser(),
    getCurrentBalanceUntil(period.end),
    getInvestmentsForCurrentUser()
  ]);
  const periodSummary = summarizeTransactions(transactions);
  const projection = projectPeriod(transactions, period);
  const weeklyInsight = weeklyExpenseInsight(evolutionTransactions, period.end);
  const investmentOverview = buildInvestmentOverview(investments);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <Logo size="sm" compact />
            Visão geral
          </span>
        }
        title="Dashboard financeiro"
        description={`Resumo de ${getPeriodLabel(period)} com saldo acumulado, fluxo do mês, categorias, metas e projeções. O saldo acumulado considera todas as transações até o fim do período selecionado.`}
        actions={<PeriodFilter start={period.start} end={period.end} />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Saldo acumulado" value={currentBalance} icon={CreditCard} tone="bg-blue-500/10 text-blue-500" />
        <KpiCard label="Receitas do período" value={periodSummary.income} icon={TrendingUp} tone="bg-emerald-500/10 text-emerald-600" />
        <KpiCard label="Despesas do período" value={periodSummary.expenses} icon={TrendingDown} tone="bg-red-500/10 text-red-600" />
        <KpiCard label="Economia do período" value={periodSummary.savings} icon={PiggyBank} tone="bg-blue-500/10 text-blue-600" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <ProjectionCard {...projection} />
        <WeeklyExpenseInsight {...weeklyInsight} />
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
