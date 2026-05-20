import { InvestmentManager, StockDiscoveryPanel } from "@/components/investments/investment-manager";
import { PageHeader } from "@/components/layout/page-header";
import { buildInvestmentOverview, getInvestmentsForCurrentUser, getStockList } from "@/services/investment-service";

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InvestmentsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const stockFilters = {
    search: getSingleParam(params?.stockSearch),
    type: getSingleParam(params?.stockType) ?? "all",
    sector: getSingleParam(params?.stockSector) ?? "all"
  };
  const assets = await getInvestmentsForCurrentUser();
  const overview = buildInvestmentOverview(assets);
  const stockList = await getStockList(stockFilters);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Carteira e mercado"
        title="Investimentos"
        description="Cadastre sua carteira, acompanhe alocação por classe de ativo e veja ativos de referência para apoiar suas decisões."
      />
      <StockDiscoveryPanel data={stockList} filters={stockFilters} />
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
