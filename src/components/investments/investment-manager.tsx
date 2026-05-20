"use client";

import { useActionState, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { BriefcaseBusiness, LineChart, Plus, Search, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { deleteInvestmentAsset, upsertInvestmentAsset } from "@/app/(dashboard)/investments/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { investmentTypeLabels } from "@/constants/investments";
import { cn, formatCurrency } from "@/lib/utils";

type InvestmentAsset = {
  id: string;
  name: string;
  ticker: string | null;
  type: keyof typeof investmentTypeLabels;
  institution: string | null;
  quantity: number | null;
  averagePrice: number | null;
  investedAmount: number;
  currentAmount: number;
  acquiredAt: string | null;
  notes: string | null;
};

type InvestmentOverview = {
  totalInvested: number;
  totalCurrent: number;
  gain: number;
  gainPercent: number;
  assetCount: number;
  allocation: {
    type: keyof typeof investmentTypeLabels;
    label: string;
    value: number;
    invested: number;
    count: number;
    color: string;
    share: number;
    gain: number;
    gainPercent: number;
  }[];
};

type StockDiscoveryResult = {
  stocks: {
    symbol: string;
    name: string;
    price: number;
    changePercent: number;
    volume: number;
    marketCap: number | null;
    sector: string | null;
    type: string | null;
    logoUrl: string | null;
  }[];
  indexes: {
    symbol: string;
    name: string;
  }[];
  availableSectors: string[];
  availableStockTypes: string[];
  error: string | null;
};

const sectorLabels: Record<string, string> = {
  "Commercial Services": "Serviços comerciais",
  Communications: "Comunicações",
  "Consumer Durables": "Bens duráveis",
  "Consumer Non-Durables": "Consumo básico",
  "Consumer Services": "Serviços ao consumidor",
  "Distribution Services": "Distribuição",
  "Electronic Technology": "Tecnologia eletrônica",
  "Energy Minerals": "Energia e petróleo",
  Finance: "Financeiro",
  "Health Services": "Saúde",
  "Health Technology": "Tecnologia em saúde",
  "Industrial Services": "Serviços industriais",
  Miscellaneous: "Diversos",
  "Non-Energy Minerals": "Mineração e materiais",
  "Process Industries": "Indústria de processo",
  "Producer Manufacturing": "Manufatura",
  "Retail Trade": "Varejo",
  "Technology Services": "Tecnologia",
  Transportation: "Transporte",
  Utilities: "Utilidades públicas"
};

const stockTypeLabels: Record<string, string> = {
  bdr: "BDR",
  fund: "Fundo",
  stock: "Ação"
};

function formatLargeNumber(value: number | null) {
  if (value == null || Number.isNaN(value)) return "-";

  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function getAddAssetHref(symbol: string, name: string) {
  const params = new URLSearchParams({
    stockToAdd: symbol,
    stockName: name
  });

  return `/investments?${params.toString()}#novo-investimento`;
}

function warningMessage(error: string | null) {
  if (!error) return null;

  return <p className="rounded-md border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-300">{error}</p>;
}

export function StockDiscoveryPanel({
  data,
  filters
}: {
  data: StockDiscoveryResult;
  filters: {
    search?: string;
    type?: string;
    sector?: string;
  };
}) {
  const hasActiveFilters = Boolean(filters.search || (filters.type && filters.type !== "all") || (filters.sector && filters.sector !== "all"));

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-semibold">Radar de ativos</h2>
          <p className="text-sm text-muted-foreground">Pesquise ativos da BRAPI e envie um ticker direto para o cadastro da carteira.</p>
        </div>
        <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <LineChart className="size-5" />
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_1fr_auto_auto]">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Buscar</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="stockSearch" defaultValue={filters.search ?? ""} placeholder="PETR, ITAU, BOVA..." className="pl-9" />
            </div>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Tipo</span>
            <select name="stockType" defaultValue={filters.type ?? "all"} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
              <option value="all">Todos</option>
              {data.availableStockTypes.map((type) => (
                <option key={type} value={type}>
                  {stockTypeLabels[type] ?? type}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Setor</span>
            <select name="stockSector" defaultValue={filters.sector ?? "all"} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
              <option value="all">Todos</option>
              {data.availableSectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sectorLabels[sector] ?? sector}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <Button className="w-full lg:w-auto">Filtrar</Button>
          </div>

          {hasActiveFilters && (
            <div className="flex items-end">
              <a href="/investments" className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border px-4 text-sm font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-foreground lg:w-auto">
                Limpar
              </a>
            </div>
          )}
        </form>

        {warningMessage(data.error)}

        {data.stocks.length === 0 ? (
          <div className="grid min-h-32 place-items-center rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            Nenhum ativo encontrado para os filtros atuais.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-background/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 font-medium">Ativo</th>
                  <th className="px-4 font-medium">Tipo</th>
                  <th className="px-4 font-medium">Setor</th>
                  <th className="px-4 text-right font-medium">Preço</th>
                  <th className="px-4 text-right font-medium">Variação</th>
                  <th className="px-4 text-right font-medium">Volume</th>
                  <th className="px-4 text-right font-medium">Valor mercado</th>
                  <th className="px-4 text-right font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {data.stocks.map((stock) => {
                  const positive = stock.changePercent >= 0;
                  const Icon = positive ? TrendingUp : TrendingDown;

                  return (
                    <tr key={stock.symbol} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3">
                        <strong className="text-base">{stock.symbol}</strong>
                        <p className="mt-1 line-clamp-1 max-w-[260px] text-xs text-muted-foreground">{stock.name}</p>
                      </td>
                      <td className="px-4 text-muted-foreground">{stockTypeLabels[stock.type ?? ""] ?? stock.type ?? "Ativo"}</td>
                      <td className="px-4 text-muted-foreground">{stock.sector ? sectorLabels[stock.sector] ?? stock.sector : "-"}</td>
                      <td className="px-4 text-right font-semibold">{formatCurrency(stock.price)}</td>
                      <td className="px-4 text-right">
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold", positive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                          <Icon className="size-3" />
                          {positive ? "+" : ""}
                          {stock.changePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 text-right text-muted-foreground">{formatLargeNumber(stock.volume)}</td>
                      <td className="px-4 text-right text-muted-foreground">{formatLargeNumber(stock.marketCap)}</td>
                      <td className="px-4 text-right">
                        <a href={getAddAssetHref(stock.symbol, stock.name)} className="inline-flex h-8 items-center justify-center rounded-md bg-primary/10 px-3 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground">
                          Adicionar
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {data.indexes.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <p className="text-sm font-semibold">Índices de referência</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.indexes.slice(0, 10).map((index) => (
                <span key={index.symbol} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  {index.symbol} · {index.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function InvestmentManager({
  assets,
  overview,
  draftAsset
}: {
  assets: InvestmentAsset[];
  overview: InvestmentOverview;
  draftAsset?: { ticker?: string; name?: string };
}) {
  const [selectedAsset, setSelectedAsset] = useState<InvestmentAsset | null>(null);
  const [state, action, pending] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => {
      const result = await upsertInvestmentAsset(formData);
      if (!result?.error) setSelectedAsset(null);
      return result;
    },
    undefined
  );

  const draftKey = selectedAsset?.id ?? `${draftAsset?.ticker ?? "new"}-${draftAsset?.name ?? ""}`;
  const defaultName = selectedAsset?.name ?? draftAsset?.name ?? "";
  const defaultTicker = selectedAsset?.ticker ?? draftAsset?.ticker ?? "";

  function startEditing(asset: InvestmentAsset) {
    setSelectedAsset(asset);
    window.requestAnimationFrame(() => {
      document.getElementById("novo-investimento")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.2fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Patrimônio investido</p>
              <h2 className="mt-1 text-3xl font-semibold">{formatCurrency(overview.totalCurrent)}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {overview.assetCount} ativo(s) cadastrados · aplicado: {formatCurrency(overview.totalInvested)}
              </p>
            </div>
            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <BriefcaseBusiness className="size-5" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/25 p-3">
                <p className="text-sm text-muted-foreground">Resultado</p>
                <strong className={cn("text-xl", overview.gain >= 0 ? "text-emerald-500" : "text-red-500")}>{formatCurrency(overview.gain)}</strong>
              </div>
              <div className="rounded-lg border border-border bg-muted/25 p-3">
                <p className="text-sm text-muted-foreground">Rentabilidade</p>
                <strong className={cn("text-xl", overview.gainPercent >= 0 ? "text-emerald-500" : "text-red-500")}>
                  {overview.gainPercent >= 0 ? "+" : ""}
                  {overview.gainPercent.toFixed(2)}%
                </strong>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Distribuição da carteira</h2>
            <p className="text-sm text-muted-foreground">Alocação por classe de ativo.</p>
          </CardHeader>
          <CardContent>
            {overview.allocation.length === 0 ? (
              <div className="grid h-56 place-items-center rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                Cadastre seu primeiro investimento para visualizar a alocação.
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-[14rem_1fr]">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={overview.allocation} dataKey="value" nameKey="label" innerRadius="58%" outerRadius="78%" paddingAngle={4} stroke="#0B1220" strokeWidth={3}>
                        {overview.allocation.map((item) => (
                          <Cell key={item.type} fill={item.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) =>
                          active && payload?.[0] ? (
                            <div className="rounded-lg border border-border bg-[#0B1220]/95 px-3 py-2 text-xs shadow-2xl">
                              <p className="font-medium text-foreground">{payload[0].name}</p>
                              <p className="text-muted-foreground">{formatCurrency(Number(payload[0].value))}</p>
                            </div>
                          ) : null
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {overview.allocation.map((item) => (
                    <div key={item.type} className="rounded-lg border border-border bg-muted/20 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 font-medium">
                          <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.label}
                        </span>
                        <strong>{formatCurrency(item.value)}</strong>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {item.count} ativo(s) · {item.share}% da carteira
                        </span>
                        <span className={item.gain >= 0 ? "text-emerald-500" : "text-red-500"}>
                          {item.gain >= 0 ? "+" : ""}
                          {item.gainPercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Minha carteira</h2>
          <p className="text-sm text-muted-foreground">Ativos cadastrados manualmente. Clique em um ativo para editar.</p>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="grid min-h-36 place-items-center rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
              <div>
                <p className="font-semibold">Sua carteira ainda está vazia.</p>
                <p className="mt-1 text-sm text-muted-foreground">Cadastre um CDB, Tesouro, ação ou fundo para acompanhar patrimônio e rentabilidade.</p>
                <a href="#novo-investimento" className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                  Adicionar primeiro ativo
                </a>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-background/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 font-medium">Ativo</th>
                    <th className="px-4 font-medium">Tipo</th>
                    <th className="px-4 font-medium">Instituição</th>
                    <th className="px-4 text-right font-medium">Aplicado</th>
                    <th className="px-4 text-right font-medium">Atual</th>
                    <th className="px-4 text-right font-medium">Resultado</th>
                    <th className="px-4 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => {
                    const gain = asset.currentAmount - asset.investedAmount;
                    const gainPercent = asset.investedAmount > 0 ? (gain / asset.investedAmount) * 100 : 0;

                    return (
                      <tr key={asset.id} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => startEditing(asset)} className="text-left font-semibold transition hover:text-primary">
                            {asset.name}
                          </button>
                          <p className="text-xs text-muted-foreground">{asset.ticker ?? "Sem ticker"}</p>
                        </td>
                        <td className="px-4">{investmentTypeLabels[asset.type]}</td>
                        <td className="px-4 text-muted-foreground">{asset.institution ?? "-"}</td>
                        <td className="px-4 text-right font-medium">{formatCurrency(asset.investedAmount)}</td>
                        <td className="px-4 text-right font-medium">{formatCurrency(asset.currentAmount)}</td>
                        <td className={cn("px-4 text-right font-semibold", gain >= 0 ? "text-emerald-500" : "text-red-500")}>
                          {formatCurrency(gain)} · {gain >= 0 ? "+" : ""}
                          {gainPercent.toFixed(2)}%
                        </td>
                        <td className="px-4 text-right">
                          <form
                            action={async (formData) => {
                              await deleteInvestmentAsset(formData);
                            }}
                          >
                            <input type="hidden" name="id" value={asset.id} />
                            <button className="inline-grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500" aria-label={`Excluir ${asset.name}`}>
                              <Trash2 className="size-4" />
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <details id="novo-investimento" className="group rounded-xl border border-border bg-card p-6" open={assets.length === 0 || Boolean(draftAsset?.ticker) || Boolean(selectedAsset)}>
        <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <span>
            <span className="block font-semibold">{selectedAsset ? "Editar investimento" : "Novo investimento"}</span>
            <span className="mt-1 block text-sm text-muted-foreground">Preencha o essencial agora. Quantidade, preço médio e observações podem ficar vazios.</span>
          </span>
          <span className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold text-muted-foreground transition group-open:bg-primary/10 group-open:text-primary">
            {selectedAsset ? "Editando" : "Abrir cadastro"}
          </span>
        </summary>
        <div className="mt-5 border-t border-border pt-5">
          {selectedAsset && (
            <div className="mb-4 flex justify-end">
              <Button type="button" onClick={() => setSelectedAsset(null)} className="bg-muted text-foreground hover:shadow-none">
                <Plus className="mr-2 size-4" />
                Novo ativo
              </Button>
            </div>
          )}
          <form key={draftKey} action={action} className="grid gap-3 lg:grid-cols-4">
            <input type="hidden" name="id" value={selectedAsset?.id ?? ""} />
            <Input name="name" defaultValue={defaultName} placeholder="Nome do ativo" required />
            <Input name="ticker" defaultValue={defaultTicker} placeholder="Ticker, ex: PETR4" />
            <select name="type" defaultValue={selectedAsset?.type ?? "FIXED_INCOME"} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
              {Object.entries(investmentTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Input name="institution" defaultValue={selectedAsset?.institution ?? ""} placeholder="Banco/corretora" />
            <Input name="investedAmount" type="number" min="0" step="0.01" defaultValue={selectedAsset?.investedAmount ?? ""} placeholder="Valor aplicado" required />
            <Input name="currentAmount" type="number" min="0" step="0.01" defaultValue={selectedAsset?.currentAmount ?? ""} placeholder="Valor atual" required />
            <Input name="quantity" type="number" min="0" step="0.00000001" defaultValue={selectedAsset?.quantity ?? ""} placeholder="Quantidade" />
            <Input name="averagePrice" type="number" min="0" step="0.01" defaultValue={selectedAsset?.averagePrice ?? ""} placeholder="Preço médio" />
            <Input name="acquiredAt" type="date" defaultValue={selectedAsset?.acquiredAt?.slice(0, 10) ?? ""} />
            <textarea
              name="notes"
              defaultValue={selectedAsset?.notes ?? ""}
              placeholder="Observações"
              className="min-h-10 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 lg:col-span-2"
            />
            <Button disabled={pending}>{pending ? "Salvando..." : selectedAsset ? "Salvar alterações" : "Salvar investimento"}</Button>
            {state?.error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive lg:col-span-4">{state.error}</p>}
            {state?.success && <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary lg:col-span-4">{state.success}</p>}
          </form>
        </div>
      </details>
    </div>
  );
}

export function MarketQuotesPanel({
  quotes,
  currencies,
  error
}: {
  quotes: { symbol: string; name: string; price: number; change: number; changePercent: number; currency: string; logoUrl?: string }[];
  currencies: { symbol: string; name: string; price: number; change: number; changePercent: number; updatedAt?: string }[];
  error: string | null;
}) {
  const items = [
    ...currencies.map((item) => ({ ...item, currency: "BRL", kind: "Câmbio" })),
    ...quotes.map((item) => ({ ...item, kind: "Bolsa" }))
  ];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold">Cotações de mercado</h2>
          <p className="text-sm text-muted-foreground">Dólar, euro e ativos da B3 para apoiar suas decisões. Dados informativos, com atualização em cache.</p>
        </div>
        <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <LineChart className="size-5" />
        </span>
      </CardHeader>
      <CardContent>
        {warningMessage(error)}
        {items.length === 0 ? (
          <div className="grid h-32 place-items-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
            Sem cotações ao vivo. Cadastre BRAPI_TOKEN na Vercel para ativar dados de mercado.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const positive = item.changePercent >= 0;
              const Icon = positive ? TrendingUp : TrendingDown;

              return (
                <div key={`${item.kind}-${item.symbol}`} className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.kind}</p>
                      <h3 className="mt-1 font-semibold">{item.symbol}</h3>
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.name}</p>
                    </div>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold", positive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                      <Icon className="size-3" />
                      {positive ? "+" : ""}
                      {item.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <strong className="text-xl">{formatCurrency(item.price)}</strong>
                    <span className={cn("text-sm font-medium", positive ? "text-emerald-500" : "text-red-500")}>
                      {positive ? "+" : ""}
                      {formatCurrency(item.change)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
