export type TransactionType = "INCOME" | "EXPENSE";

export type ParsedTransaction = {
  id?: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category?: string;
  categoryLocked?: boolean;
  tag?: string;
  goalId?: string;
  source?: string;
  importId?: string;
};

export type CategoryRule = {
  name: string;
  color: string;
  icon: string;
  keywords: string[];
};

export type DashboardSummary = {
  balance: number;
  income: number;
  expenses: number;
  savings: number;
};
