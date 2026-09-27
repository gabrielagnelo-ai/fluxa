import { createHash } from "node:crypto";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { DeletePeriodTransactionsButton } from "@/components/dashboard/transaction-delete-button";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { PageHeader } from "@/components/layout/page-header";
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
  const categoryOptions = categories.map((category) => ({ id: category.id, name: category.name }));
  const snapshot = createHash("sha256").update(transactions.map((item) => item.id).filter(Boolean).sort().join("\n")).digest("hex");

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Histórico e categorização manual"
        title="Transações"
        description={`Listando somente transações de ${getPeriodLabel(period)}.`}
        actions={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <PeriodFilter start={period.start} end={period.end} />
            <TransactionEditor categories={categoryOptions} />
          </div>
        }
      />
      <TransactionsTable
        transactions={transactions}
        title="Transações do período"
        categories={categoryOptions}
        redirectTo={redirectTo}
      />
      <div className="flex justify-end"><DeletePeriodTransactionsButton start={period.start} end={period.end} count={transactions.length} snapshot={snapshot} /></div>
    </div>
  );
}
