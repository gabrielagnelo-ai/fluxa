import { Bot, CheckCircle2, Clock3, LockKeyhole, PlugZap } from "lucide-react";
import { CategoryKeywordsManager } from "@/components/dashboard/category-keywords-manager";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCategoriesForCurrentUser } from "@/services/finance-data-service";

const integrationStatus = [
  {
    title: "IA para análise financeira",
    description: "Ativa na aba Inteligência. Usa dados agregados do período e não envia descrições individuais das transações.",
    status: "Ativo",
    icon: Bot,
    tone: "bg-emerald-500/10 text-emerald-500"
  },
  {
    title: "IA para classificar importações",
    description: "Ativa na importação. O botão Classificar com IA sugere categorias, cria grupos e pode relacionar metas.",
    status: "Ativo",
    icon: CheckCircle2,
    tone: "bg-emerald-500/10 text-emerald-500"
  },
  {
    title: "Notificações de orçamento e metas",
    description: "Parcial. Hoje existem alertas internos na aba Inteligência; ainda falta email, push e central de lidos.",
    status: "Parcial",
    icon: Clock3,
    tone: "bg-amber-400/10 text-amber-400"
  },
  {
    title: "Previsão por categoria e recorrência",
    description: "Parcial. O dashboard projeta o período; ainda falta motor histórico por categoria e recorrências.",
    status: "Parcial",
    icon: Clock3,
    tone: "bg-amber-400/10 text-amber-400"
  },
  {
    title: "Open Finance",
    description: "Futuro. Ainda não há consentimento bancário, tokens por instituição ou sincronização automática.",
    status: "Futuro",
    icon: LockKeyhole,
    tone: "bg-muted text-muted-foreground"
  }
];

export default async function SettingsPage() {
  const categories = await getCategoriesForCurrentUser();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Categorização, segurança e integrações"
        title="Ajustes"
        description="Gerencie identificadores automáticos e acompanhe o status das integrações do Fluxa."
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">Integrações e inteligência</h2>
              <p className="text-sm text-muted-foreground">O que já está ativo no Fluxa e o que ainda é evolução futura.</p>
            </div>
            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <PlugZap className="size-5" />
            </span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {integrationStatus.map((item) => (
            <div key={item.title} className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${item.tone}`}>
                  <item.icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{item.title}</h3>
                    <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">{item.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
