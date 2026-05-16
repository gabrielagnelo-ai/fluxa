import { InvestmentManager, MarketQuotesPanel } from "@/components/investments/investment-manager";
import { PageHeader } from "@/components/layout/page-header";
import { buildInvestmentOverview, getInvestmentsForCurrentUser, getMarketQuotes } from "@/services/investment-service";

export default async function InvestmentsPage() {
  const assets = await getInvestmentsForCurrentUser();
  const overview = buildInvestmentOverview(assets);
  const tickers = assets.map((asset) => asset.ticker).filter(Boolean) as string[];
  const market = await getMarketQuotes(tickers.length ? tickers : ["PETR4", "VALE3", "ITUB4", "BOVA11"]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Carteira e mercado"
        title="Investimentos"
        description="Cadastre sua carteira, acompanhe alocação por classe de ativo e veja cotações de referência para apoiar suas decisões."
      />
      <MarketQuotesPanel quotes={market.quotes} currencies={market.currencies} error={market.error} />
      <InvestmentManager
        assets={assets.map((asset) => ({
          id: asset.id,
          name: asset.name,
          ticker: asset.ticker,
          type: asset.type,
          institution: asset.institution,
          quantity: asset.quantity ? Number(asset.quantity) : null,
          averagePrice: asset.averagePrice ? Number(asset.averagePrice) : null,
          investedAmount: Number(asset.investedAmount),
          currentAmount: Number(asset.currentAmount),
          acquiredAt: asset.acquiredAt?.toISOString() ?? null,
          notes: asset.notes
        }))}
        overview={overview}
      />
    </div>
  );
}
