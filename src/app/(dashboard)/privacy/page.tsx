import Link from "next/link";
import { Database, KeyRound, ShieldCheck, Unplug } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DeleteDataButton } from "@/components/privacy/delete-data-button";
import { PageHeader } from "@/components/layout/page-header";

export default function PrivacyPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Privacidade e Segurança"
        title="Controle dos seus dados"
        description="Entenda quais dados o Fluxa usa, por que usa e como você pode desconectar bancos ou excluir sua conta."
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <SecurityCard
          icon={Database}
          title="Dados usados"
          description="Transações, categorias, metas, investimentos e consentimentos necessários para organizar sua vida financeira."
        />
        <SecurityCard
          icon={ShieldCheck}
          title="Finalidade"
          description="Dashboard financeiro, categorização automática, projeções, metas e análises agregadas com minimização de dados."
        />
        <SecurityCard
          icon={KeyRound}
          title="Segredos"
          description="Chaves de Belvo, Supabase, banco e IA ficam em variáveis server-side e não são enviadas ao navegador."
        />
      </section>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Open Finance</h2>
          <p className="text-sm text-muted-foreground">
            O acesso bancário depende de consentimento explícito. Você escolhe o prazo e pode impedir novas sincronizações pelo Fluxa.
          </p>
        </CardHeader>
        <CardContent>
          <Link href="/open-finance" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
            <Unplug className="size-4" />
            Gerenciar conexão bancária
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Excluir dados</h2>
          <p className="text-sm text-muted-foreground">
            Remove sua conta local do Fluxa e dados relacionados no banco da aplicação. Esta ação não substitui a revogação do consentimento na instituição financeira/Belvo.
          </p>
        </CardHeader>
        <CardContent>
          <DeleteDataButton />
        </CardContent>
      </Card>
    </div>
  );
}

function SecurityCard({ icon: Icon, title, description }: { icon: typeof ShieldCheck; title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
      </CardHeader>
      <CardContent>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
