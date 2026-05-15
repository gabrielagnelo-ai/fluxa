import { CategoryKeywordsManager } from "@/components/dashboard/category-keywords-manager";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCategoriesForCurrentUser } from "@/services/finance-data-service";

export default async function SettingsPage() {
  const categories = await getCategoriesForCurrentUser();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Categorização, segurança e integrações"
        title="Ajustes"
        description="Gerencie identificadores automáticos e prepare a base para integrações futuras."
      />

      <CategoryKeywordsManager
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          keywords: category.keywords
        }))}
      />

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Próximas integrações</h2>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <p>Open Finance com consentimento explícito e tokens isolados.</p>
          <p>IA para análise financeira com dados minimizados por usuário.</p>
          <p>Previsão de gastos por categoria e recorrência.</p>
          <p>Notificações de orçamento e metas.</p>
        </CardContent>
      </Card>
    </div>
  );
}
