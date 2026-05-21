import Link from "next/link";
import { CheckCircle2, UploadCloud, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const steps = [
  {
    title: "Informe sua renda",
    description: "Comece pelo Planejamento para o Fluxa saber quanto entra no mes.",
    href: "/planning",
    icon: WalletCards
  },
  {
    title: "Importe um extrato",
    description: "Envie CSV, XLSX ou PDF do banco para criar as primeiras transacoes.",
    href: "/import",
    icon: UploadCloud
  },
  {
    title: "Revise as categorias",
    description: "Depois da importacao, confira se os gastos foram reconhecidos corretamente.",
    href: "/transactions",
    icon: CheckCircle2
  }
];

export function FirstStepsCard() {
  return (
    <Card className="border-primary/30 bg-primary/[0.04]">
      <CardHeader>
        <h2 className="font-semibold">Primeiros passos no Fluxa</h2>
        <p className="text-sm text-muted-foreground">Para o dashboard fazer sentido, siga estes passos uma vez.</p>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <Link key={step.title} href={step.href} className="group rounded-lg border border-border bg-background/40 p-4 transition hover:border-primary/60 hover:bg-primary/5">
              <div className="mb-4 flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="text-xs font-medium text-muted-foreground">Passo {index + 1}</span>
              </div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{step.description}</p>
            </Link>
          );
        })}
        <div className="lg:col-span-3">
          <Link
            href="/planning"
            className="premium-button inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-primary-foreground"
          >
            Comecar pelo planejamento
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
