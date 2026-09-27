import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DeleteDataButton } from "@/components/privacy/delete-data-button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function PrivacyPage() {
  let signedIn = false;
  if (isSupabaseConfigured()) {
    try { const supabase = await createClient(); const { data } = await supabase.auth.getUser(); signedIn = Boolean(data.user); } catch { /* Explain access below without exposing provider errors. */ }
  }
  return (
    <div className="space-y-5">
      <PageHeader title="Privacidade e dados" description="Entenda quais informações o Fluxa usa e quais controles estão disponíveis na sua conta." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardHeader><h2 className="text-lg font-semibold">Informações da sua conta</h2></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-muted-foreground"><p>O Fluxa usa nome e e-mail para identificar sua conta. Seu histórico financeiro reúne as transações que você adiciona ou importa, categorias, planejamento, metas e investimentos cadastrados.</p><p>Os valores apresentados dependem desses registros. Importar um arquivo ou definir um orçamento não conecta automaticamente seu banco.</p></CardContent></Card>
        <Card><CardHeader><h2 className="text-lg font-semibold">Quando você usa inteligência artificial</h2></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-muted-foreground"><p>A análise financeira trabalha com totais e indicadores do período. Na classificação de extratos, as descrições das transações podem ser processadas por um provedor de IA após a remoção automática de identificadores detectados.</p><p>A remoção automática pode não reconhecer todas as informações pessoais. Você pode revisar e classificar as transações manualmente.</p><Link href="/import" className="inline-block rounded-md py-2 text-primary underline underline-offset-4">Revisar minhas importações</Link></CardContent></Card>
        <Card><CardHeader><h2 className="text-lg font-semibold">Conexões e consentimentos</h2></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-muted-foreground"><p>Conexões bancárias, quando habilitadas, exigem um consentimento separado. A opção de desconectar bloqueia a conexão registrada no Fluxa; a revogação no banco ou no provedor deve ser feita também no respectivo aplicativo.</p><p>Uma lista recebida do ShapeOS atualiza uma previsão de gastos com Mercado. Ela não representa uma compra paga.</p><Link href="/open-finance" className="inline-block rounded-md py-2 text-primary underline underline-offset-4">Ver conexões bancárias</Link></CardContent></Card>
        <Card><CardHeader><h2 className="text-lg font-semibold">Excluir dados do Fluxa</h2></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-muted-foreground"><p>A exclusão remove seu perfil local, histórico financeiro, planejamento, metas, investimentos e vínculos locais com integrações. Essa ação não pode ser desfeita.</p><p>O cadastro de acesso no provedor de autenticação e os consentimentos concedidos diretamente ao banco continuam existindo. Registros técnicos já recebidos podem permanecer sem o vínculo com seu perfil. Ao entrar novamente, um perfil financeiro vazio será criado.</p>{signedIn ? <DeleteDataButton /> : <Link href="/login?next=/privacy" className="inline-block rounded-md py-2 text-primary underline underline-offset-4">Entrar para gerenciar meus dados</Link>}</CardContent></Card>
      </div>
    </div>
  );
}
