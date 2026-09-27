import Link from "next/link";
import { Landmark, FileUp, Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BelvoConnectForm } from "@/components/open-finance/belvo-connect-form";
import { isBelvoConfigured } from "@/services/belvo-service";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function OpenFinancePage() {
  let configured = false;
  let available = true;
  let signedIn = false;
  try { configured = isBelvoConfigured(); } catch { available = false; }
  if (isSupabaseConfigured()) {
    try { const supabase = await createClient(); const { data } = await supabase.auth.getUser(); signedIn = Boolean(data.user); } catch { /* The information page remains available. */ }
  }
  const sandbox = process.env.BELVO_ENVIRONMENT !== "production";
  return (
    <div className="space-y-5">
      <PageHeader title="Conexões bancárias" description="Veja o que já está disponível e como trazer seus dados para o Fluxa." />
      <Card><CardHeader><div className="flex items-start gap-3"><Landmark className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" /><div><h2 className="text-lg font-semibold">Open Finance</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{!available ? "Não foi possível verificar a disponibilidade da conexão neste momento." : configured ? `O fluxo de consentimento está habilitado${sandbox ? " em ambiente de testes" : " neste ambiente"}. Isso não confirma que seu banco esteja conectado.` : "A conexão automática com bancos ainda não está habilitada neste ambiente."}</p></div></div></CardHeader><CardContent className="space-y-4"><div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-6"><p className="font-semibold text-foreground">Importação automática em preparação</p><p className="mt-1 text-muted-foreground">Nesta versão, o fluxo disponível solicita consentimento. Ele ainda não importa contas, saldos ou transações automaticamente. Concluir a autorização não adiciona lançamentos ao seu histórico.</p></div><p className="flex gap-2 text-sm leading-6 text-muted-foreground"><Info className="mt-1 size-4 shrink-0" aria-hidden="true" />Importar um extrato é uma ação separada. Nenhum banco é conectado por visitar esta página.</p></CardContent></Card>
      <Card><CardHeader><h2 className="text-lg font-semibold">Use seus extratos agora</h2><p className="text-sm leading-6 text-muted-foreground">Envie CSV, XLSX ou PDF, confira as transações reconhecidas e salve somente após revisar.</p></CardHeader><CardContent><Link href="/import" className="premium-button inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-primary-foreground"><FileUp className="size-4" aria-hidden="true" />Importar extrato</Link></CardContent></Card>
      {configured && signedIn && <details className="rounded-2xl border border-border bg-card/40 p-5"><summary className="cursor-pointer py-2 font-semibold">{sandbox ? "Abrir teste de consentimento" : "Abrir fluxo de consentimento"}</summary><p className="my-4 text-sm leading-6 text-muted-foreground">{sandbox ? "Este é um ambiente de testes. Siga as instruções do provedor para usar dados de teste." : "Você verá os dados solicitados e o prazo da autorização antes de confirmar com o provedor."}</p><BelvoConnectForm configured /></details>}
      {configured && !signedIn && <p className="rounded-xl border border-border p-4 text-sm"><Link href="/login?next=/open-finance" className="text-primary underline underline-offset-4">Entre na sua conta</Link> para acessar o fluxo de consentimento.</p>}
      <p className="text-sm text-muted-foreground">Você controla suas autorizações. <Link href="/privacy" className="text-primary underline underline-offset-4">Entenda os controles de privacidade e exclusão.</Link></p>
    </div>
  );
}
