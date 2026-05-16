import type { ParsedTransaction } from "@/types/finance";
import { differenceInCalendarDaysInclusive, type PeriodRange } from "@/utils/period";

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
    .replace(/transfer[eê]ncia recebida pelo pix\s*-\s*/i, "")
    .replace(/transfer[eê]ncia recebida\s*-\s*/i, "")
    .replace(/\s*-\s*\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}.*$/i, "")
    .replace(/\s*-\s*•+.*$/i, "")
    .replace(/\s*ag[êe]ncia:.*$/i, "")
    .trim();

  return cleaned || description;
}

export function creditOrigins(transactions: ParsedTransaction[]) {
  const grouped = new Map<string, { name: string; amount: number; count: number; dates: Set<string> }>();

  transactions
    .filter((transaction) => transaction.type === "INCOME")
    .forEach((transaction) => {
      const name = cleanCreditOrigin(transaction.description);
      const current = grouped.get(name) ?? { name, amount: 0, count: 0, dates: new Set<string>() };
      current.amount += transaction.amount;
      current.count += 1;
      current.dates.add(new Date(transaction.date).toISOString().slice(0, 10));
      grouped.set(name, current);
    });

  const total = Array.from(grouped.values()).reduce((sum, item) => sum + item.amount, 0);

  return Array.from(grouped.values())
    .sort((a, b) => b.amount - a.amount)
    .map((item) => ({
      name: item.name,
      amount: item.amount,
      count: item.count,
      share: total > 0 ? Math.round((item.amount / total) * 100) : 0,
      recurring: item.count >= 2 || item.dates.size >= 2
    }));
}

export function monthlyEvolutionFromTransactions(transactions: ParsedTransaction[]) {
  const grouped = new Map<string, { month: string; receitas: number; despesas: number; saldo: number; date: Date }>();

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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
    return { projectedIncome: 0, projectedExpenses: 0, projectedSavings: 0 };
  }

  const today = new Date();
  const projectionEnd = period.end < today ? period.end : today;
  const elapsedDays = differenceInCalendarDaysInclusive(period.start, projectionEnd);
  const totalDays = differenceInCalendarDaysInclusive(period.start, period.end);
  const summary = summarizeTransactions(transactions);
  const factor = totalDays / elapsedDays;

  const projectedIncome = summary.income;
  const projectedExpenses = summary.expenses * factor;
  const projectedNetBalance = projectedIncome - projectedExpenses;

  return {
    projectedIncome,
    projectedExpenses,
    projectedSavings: Math.max(0, projectedNetBalance)
  };
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
