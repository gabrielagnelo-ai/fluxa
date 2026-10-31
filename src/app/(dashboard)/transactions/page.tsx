import { createHash } from "node:crypto";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { DeletePeriodTransactionsButton } from "@/components/dashboard/transaction-delete-button";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency } from "@/lib/utils";
import { getCategoriesForCurrentUser, getTransactionsForCurrentUser } from "@/services/finance-data-service";
import { formatDateInput, getPeriodLabel, getPeriodRange } from "@/utils/period";
import { TransactionEditor } from "./transaction-editor";

export default async function TransactionsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const period = getPeriodRange(await searchParams);
  const redirectTo = `/transactions?start=${formatDateInput(period.start)}&end=${formatDateInput(period.end)}`;
  const [transactions, categories] = await Promise.all([
    getTransactionsForCurrentUser({ period }),
    getCategoriesForCurrentUser()
  ]);
  const income = transactions.filter((item) => item.type === "INCOME").reduce((sum, item) => sum + item.amount, 0);
  const expenses = transactions.filter((item) => item.type === "EXPENSE").reduce((sum, item) => sum + item.amount, 0);
  const categoryOptions = categories.map((category) => ({ id: category.id, name: category.name }));
  const snapshot = createHash("sha256").update(transactions.map((item) => item.id).filter(Boolean).sort().join("\n")).digest("hex");

  return (
    <div className="fluxa-page workspace-page transactions-page">
      <PageHeader
        title="Transações"
        description={`De ${getPeriodLabel(period)}.`}
        actions={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <PeriodFilter start={period.start} end={period.end} />
            <TransactionEditor categories={categoryOptions} />
          </div>
        }
      />
      <section className="card summary-strip summary-strip-lit" aria-label="Resumo do período">
        <div><p className="overview-label">Saídas</p><strong className="summary-strip-main num">{formatCurrency(expenses)}</strong></div>
        <div><p className="overview-label">Entradas</p><strong className="num">{formatCurrency(income)}</strong></div>
        <div><p className="overview-label">Transações</p><strong className="num">{transactions.length}</strong></div>
      </section>
      <TransactionsTable
        transactions={transactions}
        title="Transações do período"
        categories={categoryOptions}
        redirectTo={redirectTo}
      />
      <div className="danger-zone"><DeletePeriodTransactionsButton start={period.start} end={period.end} count={transactions.length} snapshot={snapshot} /></div>
    </div>
  );
}
