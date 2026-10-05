"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TransactionCategorySelect } from "@/components/dashboard/transaction-category-select";
import { TransactionDeleteButton } from "@/components/dashboard/transaction-delete-button";
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
  const amount = (item: ParsedTransaction) => <span className={cn("whitespace-nowrap font-semibold tabular-nums", item.type === "INCOME" ? "text-emerald-500" : "text-red-500")}>{item.type === "INCOME" ? "+" : "−"} {formatCurrency(item.amount)}</span>;
  const actions = (item: ParsedTransaction) => item.id ? <div className="flex flex-wrap items-center justify-end gap-2"><TransactionEditor transaction={item} categories={categories} /><TransactionDeleteButton id={item.id} description={`${item.description} (${formatCurrency(item.amount)}, ${displayDate(item.date)})`} /></div> : null;
  return <Card>
    <CardHeader><h2 className="font-semibold">{title}</h2><p className="text-sm text-muted-foreground" role="status">{filtered.length} de {transactions.length} registros no período</p></CardHeader>
    <CardContent>
      <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <label className="min-w-0 text-xs text-muted-foreground">Buscar descrição ou origem<Input className="mt-1" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ex.: mercado" /></label>
        <label className="text-xs text-muted-foreground">Tipo<select className="premium-input mt-1 h-10 w-full rounded-xl px-3 text-sm" value={type} onChange={(event) => setType(event.target.value)}><option value="">Todos</option><option value="EXPENSE">Gastos</option><option value="INCOME">Receitas</option></select></label>
        <label className="text-xs text-muted-foreground">Categoria<select className="premium-input mt-1 h-10 w-full rounded-xl px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Todas</option>{categoryNames.map((name) => <option key={name}>{name}</option>)}</select></label>
      </div>
      {!filtered.length ? <div className="py-10 text-center text-sm text-muted-foreground"><p>{transactions.length ? "Nenhuma transação corresponde aos filtros." : "Nenhuma transação neste período. Adicione um gasto/receita ou importe um extrato."}</p>{transactions.length > 0 && <button className="mt-2 text-primary underline" onClick={() => { setSearch(""); setType(""); setCategory(""); }}>Limpar busca e filtros</button>}</div> : <>
        <div className="divide-y divide-border md:hidden">{filtered.map((item, index) => <article key={item.id ?? index} className="space-y-3 py-4 first:pt-0">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-sm font-medium">{item.description}</p><p className="mt-1 text-xs text-muted-foreground">{displayDate(item.date)} · {item.type === "INCOME" ? "Receita" : "Gasto"}</p></div>{amount(item)}</div>
          <p className="break-words text-xs text-muted-foreground">{item.category ?? "Outros"}{item.source && ` · ${item.source}`}</p>
          {actions(item)}
        </article>)}</div>
        <div className="hidden overflow-x-auto md:block"><table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr className="border-b border-border"><th className="py-3 font-medium">Data</th><th className="font-medium">Descrição</th><th className="font-medium">Categoria</th><th className="text-right font-medium">Valor</th><th className="text-right font-medium">Ações</th></tr></thead><tbody>{filtered.map((item, index) => <tr key={item.id ?? index} className="border-b border-border/60 last:border-0 hover:bg-muted/40"><td className="whitespace-nowrap py-3 pr-3 text-muted-foreground">{displayDate(item.date)}</td><td className="max-w-64 break-words pr-3 font-medium">{item.description}<p className="text-xs font-normal text-muted-foreground">{item.type === "INCOME" ? "Receita" : "Gasto"}{item.source && ` · ${item.source}`}</p></td><td className="pr-3"><TransactionCategorySelect transactionId={item.id} currentCategoryId={item.categoryId} currentCategory={item.category} categories={categories} /></td><td className="text-right">{amount(item)}</td><td className="pl-3">{actions(item)}</td></tr>)}</tbody></table></div>
      </>}
    </CardContent>
  </Card>;
}
