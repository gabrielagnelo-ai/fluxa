import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TransactionCategorySelect } from "@/components/dashboard/transaction-category-select";
import { TransactionDeleteButton } from "@/components/dashboard/transaction-delete-button";
import { cn, formatCurrency } from "@/lib/utils";
import type { ParsedTransaction } from "@/types/finance";

type CategoryOption = {
  id: string;
  name: string;
};

export function TransactionsTable({
  transactions,
  title = "Últimas transações",
  categories = [],
  redirectTo
}: {
  transactions: ParsedTransaction[];
  title?: string;
  categories?: CategoryOption[];
  redirectTo?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{transactions.length} registro(s) no período</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-3 font-medium">Data</th>
                <th className="font-medium">Descrição</th>
                <th className="font-medium">Categoria</th>
                <th className="font-medium">Tipo</th>
                <th className="text-right font-medium">Valor</th>
                <th className="text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td className="py-10 text-center text-muted-foreground" colSpan={6}>
                    Nenhuma transação encontrada no período selecionado.
                  </td>
                </tr>
              ) : (
                transactions.map((item, index) => {
                  const income = item.type === "INCOME";
                  const Icon = income ? ArrowUpRight : ArrowDownLeft;

                  return (
                    <tr key={`${item.description}-${item.date}-${index}`} className="border-b border-border/60 transition last:border-0 hover:bg-muted/40">
                      <td className="py-3 text-muted-foreground">{format(new Date(item.date), "dd/MM/yyyy")}</td>
                      <td className="max-w-[320px] truncate font-medium">{item.description}</td>
                      <td>
                        <TransactionCategorySelect transactionId={item.id} currentCategory={item.category} categories={categories} redirectTo={redirectTo} />
                      </td>
                      <td>
                        <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs", income ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600")}>
                          <Icon className="size-3" />
                          {income ? "Entrada" : "Saída"}
                        </span>
                      </td>
                      <td className={income ? "text-right font-semibold text-emerald-500" : "text-right font-semibold text-red-500"}>
                        {income ? "+" : "-"} {formatCurrency(item.amount)}
                      </td>
                      <td className="text-right">
                        <TransactionDeleteButton id={item.id} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
