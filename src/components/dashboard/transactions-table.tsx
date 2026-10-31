"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TransactionCategorySelect } from "@/components/dashboard/transaction-category-select";
import { TransactionEditor } from "@/app/(dashboard)/transactions/transaction-editor";
import { cn, formatCurrency, normalizeText } from "@/lib/utils";
import type { ParsedTransaction } from "@/types/finance";

type CategoryOption = { id: string; name: string };
const displayDate = (date: string) => date.slice(0, 10).split("-").reverse().join("/");

export function TransactionsTable({ transactions, title = "Últimas transações", categories = [] }: {
  transactions: ParsedTransaction[]; title?: string; categories?: CategoryOption[]; redirectTo?: string;
}) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const filtered = useMemo(() => transactions.filter((item) =>
    (!type || item.type === type) && (!category || (item.category ?? "Outros") === category) &&
    (!search || normalizeText(`${item.description} ${item.source ?? ""}`).includes(normalizeText(search)))
  ), [transactions, search, type, category]);
  const categoryNames = Array.from(new Set(transactions.map((item) => item.category ?? "Outros"))).sort();
  // Amounts stay neutral; the sign says the direction and income gets the green.
  const amount = (item: ParsedTransaction) => <span className={cn("whitespace-nowrap font-semibold tabular-nums", item.type === "INCOME" && "text-emerald-500")}>{item.type === "INCOME" ? "+" : "−"}{formatCurrency(item.amount)}</span>;
  // One quiet edit control per row; delete lives inside the edit sheet.
  const actions = (item: ParsedTransaction) => item.id ? <TransactionEditor transaction={item} categories={categories} /> : null;
  return <Card>
    <CardHeader><h2 className="font-semibold">{title}</h2><p className="text-sm text-muted-foreground" role="status">{filtered.length === transactions.length ? `${transactions.length} no período` : `${filtered.length} de ${transactions.length} no período`}</p></CardHeader>
    <CardContent>
      <div className="tx-filters">
        <label className="form-field tx-search"><span className="form-field-label">Buscar</span><Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Descrição ou origem, ex.: mercado" /></label>
        <div className="segmented" role="group" aria-label="Tipo">
          {[["", "Todos"], ["EXPENSE", "Gastos"], ["INCOME", "Receitas"]].map(([value, label]) => <button key={label} type="button" aria-pressed={type === value} onClick={() => setType(value)}>{label}</button>)}
        </div>
        <label className="form-field"><span className="form-field-label">Categoria</span><select className="premium-input h-10 w-full rounded-xl px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Todas</option>{categoryNames.map((name) => <option key={name}>{name}</option>)}</select></label>
      </div>
      {!filtered.length ? <div className="py-10 text-center text-sm text-muted-foreground"><p>{transactions.length ? "Nenhuma transação corresponde aos filtros." : "Nenhuma transação neste período. Adicione um gasto/receita ou importe um extrato."}</p>{transactions.length > 0 && <button className="mt-2 text-primary underline" onClick={() => { setSearch(""); setType(""); setCategory(""); }}>Limpar busca e filtros</button>}</div> : <>
        <ul className="tx-list md:hidden">{filtered.map((item, index) => <li key={item.id ?? index} className="tx-row">
          <div className="tx-row-top"><div className="min-w-0 flex-1"><p className="tx-row-title">{item.description}</p><p className="tx-row-sub">{displayDate(item.date)} · {item.category ?? "Outros"}{item.source && ` · ${item.source}`}</p></div>{amount(item)}{actions(item)}</div>
        </li>)}</ul>
        <div className="hidden overflow-x-auto md:block"><table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr className="border-b border-border"><th className="py-3 font-medium">Data</th><th className="font-medium">Descrição</th><th className="font-medium">Categoria</th><th className="text-right font-medium">Valor</th><th className="text-right font-medium"><span className="sr-only">Editar</span></th></tr></thead><tbody>{filtered.map((item, index) => <tr key={item.id ?? index} className="border-b border-border/60 last:border-0 hover:bg-muted/40"><td className="whitespace-nowrap py-3 pr-3 text-muted-foreground">{displayDate(item.date)}</td><td className="max-w-64 break-words pr-3 font-medium">{item.description}<p className="text-xs font-normal text-muted-foreground">{item.type === "INCOME" ? "Receita" : "Gasto"}{item.source && ` · ${item.source}`}</p></td><td className="pr-3"><TransactionCategorySelect transactionId={item.id} currentCategoryId={item.categoryId} currentCategory={item.category} categories={categories} /></td><td className="text-right">{amount(item)}</td><td className="pl-3">{actions(item)}</td></tr>)}</tbody></table></div>
      </>}
    </CardContent>
  </Card>;
}
