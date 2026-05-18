import type { ParsedTransaction } from "@/types/finance";
import { differenceInCalendarDaysInclusive, type PeriodRange } from "@/utils/period";

type CategoryLimitSnapshot = {
  categoryName: string;
  planned: number;
  actual: number;
  difference: number;
  usage: number;
  type: "FIXED" | "VARIABLE" | "GOAL";
};

type GoalSnapshot = {
  name: string;
  targetAmount: number;
  contributedAmount: number;
};

export function summarizeTransactions(transactions: ParsedTransaction[]) {
  const income = transactions.filter((item) => item.type === "INCOME").reduce((sum, item) => sum + item.amount, 0);
  const expenses = transactions.filter((item) => item.type === "EXPENSE").reduce((sum, item) => sum + item.amount, 0);
  const netBalance = income - expenses;

  return {
    balance: netBalance,
    income,
    expenses,
    savings: Math.max(0, netBalance)
  };
}

export function signedAmount(transaction: ParsedTransaction) {
  return transaction.type === "INCOME" ? transaction.amount : -transaction.amount;
}

export function expensesByCategory(transactions: ParsedTransaction[]) {
  const grouped = new Map<string, number>();

  transactions
    .filter((item) => item.type === "EXPENSE")
    .forEach((item) => grouped.set(item.category ?? "Outros", (grouped.get(item.category ?? "Outros") ?? 0) + item.amount));

  return Array.from(grouped.entries()).map(([name, value]) => ({ name, value }));
}

function cleanCreditOrigin(description: string) {
  const cleaned = description
    .replace(/^whatsapp\s*-\s*/i, "")
    .replace(/^entrada\s*-\s*/i, "")
    .replace(/transferência recebida pelo pix\s*-\s*/i, "")
    .replace(/transfer[eê]ncia recebida pelo pix\s*-\s*/i, "")
    .replace(/transferência recebida\s*-\s*/i, "")
    .replace(/transfer[eê]ncia recebida\s*-\s*/i, "")
    .replace(/\s*-\s*\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}.*$/i, "")
    .replace(/\s*-\s*•+.*$/i, "")
    .replace(/\s*ag[êe]ncia:.*$/i, "")
    .trim();

  return cleaned || description;
}

function originTokens(value: string) {
  const ignored = new Set(["PIX", "PELO", "PELA", "TRANSFERENCIA", "TRANSFERÊNCIA", "RECEBIDA", "RECEBIDO", "WHATSAPP", "LTDA", "DA", "DE", "DO", "DAS", "DOS"]);
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !ignored.has(token));
}

function isSameCreditOrigin(left: string, right: string) {
  const leftTokens = originTokens(left);
  const rightTokens = originTokens(right);
  if (leftTokens.length === 0 || rightTokens.length === 0) return false;

  const rightSet = new Set(rightTokens);
  const matches = leftTokens.filter((token) => rightSet.has(token)).length;
  return matches >= 2 || matches / Math.min(leftTokens.length, rightTokens.length) >= 0.67;
}

function preferredCreditOriginName(left: string, right: string) {
  const leftTokens = originTokens(left).length;
  const rightTokens = originTokens(right).length;
  if (rightTokens > leftTokens) return right;
  if (right.length > left.length && rightTokens === leftTokens) return right;
  return left;
}

export function creditOrigins(transactions: ParsedTransaction[]) {
  const grouped: { name: string; amount: number; count: number; dates: Set<string> }[] = [];

  transactions
    .filter((transaction) => transaction.type === "INCOME")
    .forEach((transaction) => {
      const name = cleanCreditOrigin(transaction.description);
      const current = grouped.find((item) => isSameCreditOrigin(item.name, name)) ?? { name, amount: 0, count: 0, dates: new Set<string>() };
      if (!grouped.includes(current)) grouped.push(current);
      current.name = preferredCreditOriginName(current.name, name);
      current.amount += transaction.amount;
      current.count += 1;
      current.dates.add(new Date(transaction.date).toISOString().slice(0, 10));
    });

  const total = grouped.reduce((sum, item) => sum + item.amount, 0);

  return grouped
    .sort((a, b) => b.amount - a.amount)
    .map((item) => ({
      name: item.name,
      amount: item.amount,
      count: item.count,
      share: total > 0 ? Math.round((item.amount / total) * 100) : 0,
      recurring: item.count >= 2 || item.dates.size >= 2
    }));
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthlyEvolutionFromTransactions(transactions: ParsedTransaction[]) {
  const grouped = new Map<string, { month: string; receitas: number; despesas: number; saldo: number; date: Date }>();

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const key = monthKey(date);
    const month = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", "");
    const current = grouped.get(key) ?? { month, receitas: 0, despesas: 0, saldo: 0, date };

    if (transaction.type === "INCOME") current.receitas += transaction.amount;
    if (transaction.type === "EXPENSE") current.despesas += transaction.amount;
    current.saldo = current.receitas - current.despesas;
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-6)
    .map((item) => ({
      month: item.month,
      receitas: item.receitas,
      despesas: item.despesas,
      saldo: item.saldo
    }));
}

export function projectPeriod(transactions: ParsedTransaction[], period: PeriodRange) {
  if (!transactions.length) {
    return {
      projectedIncome: 0,
      projectedExpenses: 0,
      projectedSavings: 0,
      elapsedDays: 0,
      totalDays: differenceInCalendarDaysInclusive(period.start, period.end),
      confidence: "Baixa"
    };
  }

  const today = new Date();
  const projectionEnd = period.end < today ? period.end : today;
  const elapsedDays = differenceInCalendarDaysInclusive(period.start, projectionEnd);
  const totalDays = differenceInCalendarDaysInclusive(period.start, period.end);
  const summary = summarizeTransactions(transactions);
  const factor = totalDays / elapsedDays;
  const periodProgress = elapsedDays / totalDays;

  // Receitas costumam ser pontuais, como salário e PIX recebidos. Projetar por média diária
  // pode inflar o fechamento. Por isso a previsão usa receitas já registradas e projeta só despesas.
  const projectedIncome = summary.income;
  const projectedExpenses = summary.expenses * factor;
  const projectedNetBalance = projectedIncome - projectedExpenses;
  const confidence = periodProgress >= 0.6 && transactions.length >= 15 ? "Alta" : periodProgress >= 0.35 && transactions.length >= 8 ? "Média" : "Baixa";

  return {
    projectedIncome,
    projectedExpenses,
    projectedSavings: Math.max(0, projectedNetBalance),
    elapsedDays,
    totalDays,
    confidence
  };
}

export function categoryForecast(
  currentTransactions: ParsedTransaction[],
  historyTransactions: ParsedTransaction[],
  period: PeriodRange,
  categoryLimits: CategoryLimitSnapshot[] = []
) {
  const today = new Date();
  const projectionEnd = period.end < today ? period.end : today;
  const elapsedDays = differenceInCalendarDaysInclusive(period.start, projectionEnd);
  const totalDays = differenceInCalendarDaysInclusive(period.start, period.end);
  const factor = totalDays / elapsedDays;
  const limitByCategory = new Map(categoryLimits.map((limit) => [limit.categoryName, limit]));
  const currentByCategory = new Map<string, number>();
  const monthsByCategory = new Map<string, Set<string>>();
  const monthlyTotalsByCategory = new Map<string, Map<string, number>>();
  const currentPeriodKey = monthKey(period.start);

  currentTransactions
    .filter((transaction) => transaction.type === "EXPENSE")
    .forEach((transaction) => {
      const category = transaction.category ?? "Outros";
      currentByCategory.set(category, (currentByCategory.get(category) ?? 0) + transaction.amount);
    });

  historyTransactions
    .filter((transaction) => transaction.type === "EXPENSE")
    .forEach((transaction) => {
      const date = new Date(transaction.date);
      const key = monthKey(date);
      const category = transaction.category ?? "Outros";
      if (key === currentPeriodKey) return;

      const months = monthsByCategory.get(category) ?? new Set<string>();
      months.add(key);
      monthsByCategory.set(category, months);

      const monthlyTotals = monthlyTotalsByCategory.get(category) ?? new Map<string, number>();
      monthlyTotals.set(key, (monthlyTotals.get(key) ?? 0) + transaction.amount);
      monthlyTotalsByCategory.set(category, monthlyTotals);
    });

  const categories = new Set([...currentByCategory.keys(), ...limitByCategory.keys(), ...monthsByCategory.keys()]);

  return Array.from(categories)
    .map((categoryName) => {
      const actual = currentByCategory.get(categoryName) ?? 0;
      const limit = limitByCategory.get(categoryName);
      const months = monthsByCategory.get(categoryName)?.size ?? 0;
      const monthlyTotals = Array.from(monthlyTotalsByCategory.get(categoryName)?.values() ?? []);
      const historicalAverage = monthlyTotals.length > 0 ? monthlyTotals.reduce((sum, value) => sum + value, 0) / monthlyTotals.length : 0;
      const recurring = months >= 2 || limit?.type === "FIXED";
      const projected = recurring ? Math.max(actual, historicalAverage) : actual * factor;
      const planned = limit?.planned ?? 0;
      const projectedUsage = planned > 0 ? Math.round((projected / planned) * 100) : 0;
      const status: "leak" | "over" | "warning" | "ok" =
        planned === 0 && actual > 0 ? "leak" : planned > 0 && projected > planned ? "over" : planned > 0 && projectedUsage >= 80 ? "warning" : "ok";

      return {
        categoryName,
        actual,
        projected,
        planned,
        projectedUsage,
        recurring,
        months,
        status
      };
    })
    .filter((item) => item.actual > 0 || item.planned > 0 || item.recurring)
    .sort((a, b) => {
      const statusWeight = { leak: 4, over: 3, warning: 2, ok: 1 };
      const byStatus = statusWeight[b.status] - statusWeight[a.status];
      if (byStatus !== 0) return byStatus;
      return b.projected - a.projected;
    });
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function internalAlerts({
  forecasts,
  goals,
  projectedExpenses,
  projectedIncome
}: {
  forecasts: ReturnType<typeof categoryForecast>;
  goals: GoalSnapshot[];
  projectedExpenses: number;
  projectedIncome: number;
}) {
  const alerts: { id: string; title: string; description: string; severity: "danger" | "warning" | "info" | "success" }[] = [];

  forecasts
    .filter((item) => item.status === "leak")
    .slice(0, 4)
    .forEach((item) => {
      alerts.push({
        id: `category-leak-${item.categoryName}`,
        title: `${item.categoryName} sem limite definido`,
        description: `Já houve ${formatMoney(item.actual)} de gasto sem planejamento. Isso é tratado como vazamento de orçamento.`,
        severity: "danger"
      });
    });

  forecasts
    .filter((item) => item.planned > 0 && item.projected > item.planned)
    .slice(0, 4)
    .forEach((item) => {
      alerts.push({
        id: `category-over-${item.categoryName}`,
        title: `${item.categoryName} deve estourar o limite`,
        description: `Fechamento estimado em ${formatMoney(item.projected)} para limite de ${formatMoney(item.planned)}.`,
        severity: "danger"
      });
    });

  forecasts
    .filter((item) => item.planned > 0 && item.projected <= item.planned && item.projectedUsage >= 80)
    .slice(0, 3)
    .forEach((item) => {
      alerts.push({
        id: `category-warning-${item.categoryName}`,
        title: `${item.categoryName} perto do limite`,
        description: `Uso estimado de ${item.projectedUsage}% do limite mensal.`,
        severity: "warning"
      });
    });

  forecasts
    .filter((item) => item.recurring && item.planned === 0 && item.projected > 0 && item.status !== "leak")
    .slice(0, 2)
    .forEach((item) => {
      alerts.push({
        id: `recurring-no-limit-${item.categoryName}`,
        title: `${item.categoryName} parece recorrente`,
        description: `Apareceu em ${item.months} meses recentes. Vale definir um limite no Planejamento.`,
        severity: "info"
      });
    });

  goals
    .filter((goal) => goal.targetAmount > 0)
    .forEach((goal) => {
      const progress = Math.round((goal.contributedAmount / goal.targetAmount) * 100);
      if (progress >= 100) {
        alerts.push({
          id: `goal-complete-${goal.name}`,
          title: `Meta ${goal.name} concluída`,
          description: `${formatMoney(goal.contributedAmount)} aportados de ${formatMoney(goal.targetAmount)}.`,
          severity: "success"
        });
      } else if (progress >= 80) {
        alerts.push({
          id: `goal-near-${goal.name}`,
          title: `Meta ${goal.name} está perto`,
          description: `${progress}% concluído pelos aportes relacionados.`,
          severity: "info"
        });
      }
    });

  if (projectedIncome > 0 && projectedExpenses > projectedIncome) {
    alerts.unshift({
      id: "projected-deficit",
      title: "Fechamento tende a ficar negativo",
      description: `Despesas estimadas em ${formatMoney(projectedExpenses)} contra ${formatMoney(projectedIncome)} de receita considerada.`,
      severity: "danger"
    });
  }

  return alerts.slice(0, 8);
}

function startOfWeekMonday(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

export function weeklyExpenseInsight(transactions: ParsedTransaction[], fallbackDate = new Date()) {
  const expenses = transactions.filter((transaction) => transaction.type === "EXPENSE");
  const referenceDate = expenses.length
    ? expenses.reduce((latest, transaction) => {
        const date = new Date(transaction.date);
        return date > latest ? date : latest;
      }, new Date(expenses[0].date))
    : fallbackDate;
  const weekStart = startOfWeekMonday(referenceDate);
  const previousWeekStart = addDays(weekStart, -7);
  const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
  const days = labels.map((label, index) => {
    const date = addDays(weekStart, index);
    const amount = expenses.filter((transaction) => isSameDay(new Date(transaction.date), date)).reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      label,
      amount,
      date: date.toISOString()
    };
  });
  const total = days.reduce((sum, day) => sum + day.amount, 0);
  const previousTotal = expenses
    .filter((transaction) => {
      const date = new Date(transaction.date);
      return date >= previousWeekStart && date < weekStart;
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const difference = total - previousTotal;
  const trendPercent = previousTotal > 0 ? Math.round((Math.abs(difference) / previousTotal) * 100) : total > 0 ? 100 : 0;

  return {
    total,
    previousTotal,
    difference,
    trendPercent,
    increased: difference > 0,
    decreased: difference < 0,
    days
  };
}
