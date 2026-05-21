import { Bot, CheckCircle2, LockKeyhole, PlugZap } from "lucide-react";
import { CategoryKeywordsManager } from "@/components/dashboard/category-keywords-manager";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCategoriesForCurrentUser } from "@/services/finance-data-service";

const integrationStatus = [
  {
    title: "Analise inteligente",
    description: "Ativa na aba Inteligencia com um resumo simples do periodo.",
    status: "Ativo",
    icon: Bot,
    tone: "bg-emerald-500/10 text-emerald-500"
  },
  {
    title: "Categorias automaticas",
    description: "Ativa na importacao para sugerir onde cada gasto entra.",
    status: "Ativo",
    icon: CheckCircle2,
    tone: "bg-emerald-500/10 text-emerald-500"
  },
  {
    title: "Avisos de orçamento e metas",
    description: "Ativos no dashboard para mostrar limites, metas e pontos de atencao.",
    status: "Ativo",
    icon: CheckCircle2,
    tone: "bg-emerald-500/10 text-emerald-500"
  },
  {
    title: "Estimativa por categoria",
    description: "Ativa no dashboard para mostrar gastos que podem passar do combinado.",
    status: "Ativo",
    icon: CheckCircle2,
    tone: "bg-emerald-500/10 text-emerald-500"
  },
  {
    title: "Conexao automatica com bancos",
    description: "Open Finance fica desativado por enquanto para manter o app simples.",
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
        eyebrow="Regras do Fluxa"
        title="Ajustes"
        description="Ajuste como o Fluxa reconhece seus gastos e veja o que ja esta ativo."
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
              <h2 className="font-semibold">Recursos ativos</h2>
              <p className="text-sm text-muted-foreground">Resumo rapido do que ja funciona e do que ainda e futuro.</p>
            </div>
            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <PlugZap className="size-5" />
            </span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 lg:grid-cols-2">
          {integrationStatus.map((item) => (
            <div key={item.title} className="rounded-lg border border-border bg-background/30 p-3">
              <div className="flex items-start gap-3">
                <span className={`grid size-8 shrink-0 place-items-center rounded-md ${item.tone}`}>
                  <item.icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{item.title}</h3>
                    <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">{item.status}</span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
