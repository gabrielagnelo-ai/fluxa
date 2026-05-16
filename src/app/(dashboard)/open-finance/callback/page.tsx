import Link from "next/link";
import { CheckCircle2, CircleAlert, CircleSlash } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { registerBelvoConnectionFromCallback } from "@/lib/belvo/server";
import { secureLogger } from "@/lib/security/logger";
import { getCurrentUserId } from "@/services/finance-data-service";

const statusCopy = {
  success: {
    icon: CheckCircle2,
    title: "Consentimento finalizado",
    description: "A Belvo retornou sucesso. O próximo passo é consultar links, contas e transações via API."
  },
  exit: {
    icon: CircleSlash,
    title: "Fluxo interrompido",
    description: "Você saiu do widget antes de finalizar a conexão."
  },
  event: {
    icon: CircleAlert,
    title: "Evento da Belvo",
    description: "A Belvo retornou um evento durante o fluxo. Confira os parâmetros da URL para depuração."
  }
};

export default async function OpenFinanceCallbackPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = String(params?.status ?? "event") as keyof typeof statusCopy;
  const copy = statusCopy[status] ?? statusCopy.event;
  const Icon = copy.icon;
  const userId = await getCurrentUserId();

  if (status === "success" && userId && params) {
    try {
      await registerBelvoConnectionFromCallback(userId, params);
    } catch (error) {
      secureLogger.error("Belvo callback registration failed", { error });
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{copy.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{copy.description}</p>
          </div>
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
        </CardHeader>
        <CardContent>
          <Link href="/open-finance" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
            Voltar para Open Finance
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
