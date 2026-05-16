import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/services/finance-data-service";
import { investmentTypeColors, investmentTypeLabels } from "@/constants/investments";

export async function getInvestmentsForCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  return prisma.investmentAsset.findMany({
    where: { userId },
    orderBy: [{ currentAmount: "desc" }, { name: "asc" }]
  });
}

export function buildInvestmentOverview(assets: Awaited<ReturnType<typeof getInvestmentsForCurrentUser>>) {
  const totalInvested = assets.reduce((sum, asset) => sum + Number(asset.investedAmount), 0);
  const totalCurrent = assets.reduce((sum, asset) => sum + Number(asset.currentAmount), 0);
  const gain = totalCurrent - totalInvested;
  const gainPercent = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;
  const grouped = new Map<keyof typeof investmentTypeLabels, { type: keyof typeof investmentTypeLabels; label: string; value: number; invested: number; count: number; color: string }>();

  assets.forEach((asset) => {
    const type = asset.type as keyof typeof investmentTypeLabels;
    const current = grouped.get(type) ?? {
      type,
      label: investmentTypeLabels[type],
      value: 0,
      invested: 0,
      count: 0,
      color: investmentTypeColors[type]
    };

    current.value += Number(asset.currentAmount);
    current.invested += Number(asset.investedAmount);
    current.count += 1;
    grouped.set(type, current);
  });

  const allocation = Array.from(grouped.values())
    .sort((a, b) => b.value - a.value)
    .map((item) => ({
      ...item,
      share: totalCurrent > 0 ? Math.round((item.value / totalCurrent) * 100) : 0,
      gain: item.value - item.invested,
      gainPercent: item.invested > 0 ? ((item.value - item.invested) / item.invested) * 100 : 0
    }));

  return {
    totalInvested,
    totalCurrent,
    gain,
    gainPercent,
    assetCount: assets.length,
    allocation
  };
}

type BrapiQuoteResult = {
  symbol?: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  currency?: string;
  logourl?: string;
};

type BrapiCurrencyResult = {
  fromCurrency?: string;
  toCurrency?: string;
  name?: string;
  bidPrice?: string;
  bidVariation?: string;
  percentageChange?: string;
  updatedAtDate?: string;
};

async function fetchJson<T>(url: string) {
  const headers: HeadersInit = {};
  const token = process.env.BRAPI_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    headers,
    next: { revalidate: 300 }
  });

  if (!response.ok) throw new Error(`Brapi respondeu ${response.status}`);
  return response.json() as Promise<T>;
}

export async function getMarketQuotes(tickers: string[]) {
  const uniqueTickers = Array.from(new Set(tickers.map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))).slice(0, 12);
  const fallback = {
    quotes: [] as Array<{
      symbol: string;
      name: string;
      price: number;
      change: number;
      changePercent: number;
      currency: string;
      logoUrl?: string;
    }>,
    currencies: [] as Array<{
      symbol: string;
      name: string;
      price: number;
      change: number;
      changePercent: number;
      updatedAt?: string;
    }>,
    error: null as string | null
  };

  try {
    const [quoteResponse, currencyResponse] = await Promise.all([
      uniqueTickers.length
        ? fetchJson<{ results?: BrapiQuoteResult[] }>(`https://brapi.dev/api/quote/${uniqueTickers.join(",")}`)
        : Promise.resolve({ results: [] }),
      fetchJson<{ currency?: BrapiCurrencyResult[] }>("https://brapi.dev/api/v2/currency?currency=USD-BRL,EUR-BRL")
    ]);

    return {
      quotes: (quoteResponse.results ?? []).map((quote) => ({
        symbol: quote.symbol ?? "-",
        name: quote.shortName ?? quote.symbol ?? "Ativo",
        price: Number(quote.regularMarketPrice ?? 0),
        change: Number(quote.regularMarketChange ?? 0),
        changePercent: Number(quote.regularMarketChangePercent ?? 0),
        currency: quote.currency ?? "BRL",
        logoUrl: quote.logourl
      })),
      currencies: (currencyResponse.currency ?? []).map((currency) => ({
        symbol: `${currency.fromCurrency ?? ""}/${currency.toCurrency ?? ""}`,
        name: currency.name ?? "Moeda",
        price: Number(currency.bidPrice ?? 0),
        change: Number(currency.bidVariation ?? 0),
        changePercent: Number(currency.percentageChange ?? 0),
        updatedAt: currency.updatedAtDate
      })),
      error: null
    };
  } catch (error) {
    console.error(error);
    return {
      ...fallback,
      error: "Cotações indisponíveis agora. Configure BRAPI_TOKEN ou tente novamente em alguns minutos."
    };
  }
}
