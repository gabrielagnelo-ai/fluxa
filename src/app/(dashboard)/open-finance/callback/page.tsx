import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const statusCopy = {
  success: { title: "Você voltou do provedor", description: "O fluxo de consentimento retornou ao Fluxa. A importação automática ainda não está disponível; nenhum lançamento foi criado por este retorno." },
  exit: { title: "Fluxo de consentimento interrompido", description: "Você saiu antes de concluir o fluxo. Pode tentar novamente quando quiser ou importar um extrato." },
  event: { title: "Confira o status no provedor", description: "Não foi possível confirmar a conclusão do consentimento neste retorno. Verifique suas autorizações diretamente no banco ou no provedor." }
};

export default async function OpenFinanceCallbackPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const status = params?.status;
  const copy = status === "success" ? statusCopy.success : status === "exit" ? statusCopy.exit : statusCopy.event;
  // A query string is not proof of a bank authorization. Never persist an ACTIVE
  // connection from an unverified browser callback; verified sync is a future step.
  return <Card><CardHeader><h1 className="text-2xl font-semibold">{copy.title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.description}</p></CardHeader><CardContent className="flex flex-wrap gap-3"><Link href="/open-finance" className="premium-button inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-primary-foreground">Ver conexões bancárias</Link><Link href="/import" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm">Importar extrato</Link></CardContent></Card>;
}
