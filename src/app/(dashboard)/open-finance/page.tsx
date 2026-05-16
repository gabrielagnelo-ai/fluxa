import { BelvoConnectForm } from "@/components/open-finance/belvo-connect-form";
import { PageHeader } from "@/components/layout/page-header";
import { isBelvoConfigured } from "@/services/belvo-service";

export default function OpenFinancePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Open Finance"
        title="Conexão bancária"
        description="Teste a Belvo com Hosted Widget, consentimento explícito e credenciais isoladas no servidor."
      />
      <BelvoConnectForm configured={isBelvoConfigured()} />
    </div>
  );
}
