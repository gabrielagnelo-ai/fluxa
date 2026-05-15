import { PeriodFilter } from "@/components/dashboard/period-filter";
import { DeletePeriodTransactionsButton } from "@/components/dashboard/transaction-delete-button";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { PageHeader } from "@/components/layout/page-header";
import { getCategoriesForCurrentUser, getTransactionsForCurrentUser } from "@/services/finance-data-service";
import { getPeriodLabel, getPeriodRange } from "@/utils/period";

export default async function TransactionsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const period = getPeriodRange(await searchParams);
  const redirectTo = `/transactions?start=${period.start.toISOString().slice(0, 10)}&end=${period.end.toISOString().slice(0, 10)}`;
  const [transactions, categories] = await Promise.all([
    getTransactionsForCurrentUser({ period }),
    getCategoriesForCurrentUser()
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Histórico e categorização manual"
        title="Transações"
        description={`Listando somente transações de ${getPeriodLabel(period)}.`}
        actions={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <PeriodFilter start={period.start} end={period.end} />
            <DeletePeriodTransactionsButton start={period.start} end={period.end} />
          </div>
        }
      />
      <TransactionsTable
        transactions={transactions}
        title="Transações do período"
        categories={categories.map((category) => ({ id: category.id, name: category.name }))}
        redirectTo={redirectTo}
      />
    </div>
  );
}
