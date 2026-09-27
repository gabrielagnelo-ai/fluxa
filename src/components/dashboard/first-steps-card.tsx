import Link from "next/link";
import { CheckCircle2, SlidersHorizontal, UploadCloud, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const steps = [
  {
    title: "Informe sua renda",
    description: "Informe quanto você espera receber neste mês e salve a divisão da renda.",
    href: "/planning#planning-income",
    icon: WalletCards
  },
  {
    title: "Defina seus limites",
    description: "Escolha quanto pretende gastar em Mercado, Transporte e outras categorias.",
    href: "/planning#planning-limits",
    icon: SlidersHorizontal
  },
  {
    title: "Importe e revise",
    description: "Envie um extrato, confira valores e categorias e salve. Assim você compara o previsto com o gasto real.",
    href: "/import",
    icon: UploadCloud
  }
];

export function FirstStepsCard({ incomeConfigured = false, limitsConfigured = false }: { incomeConfigured?: boolean; limitsConfigured?: boolean }) {
  const nextStep = !incomeConfigured ? 0 : !limitsConfigured ? 1 : 2;
  return (
    <Card className="border-primary/30 bg-primary/[0.04]">
      <CardHeader>
        <h2 className="font-semibold">Primeiros passos no Fluxa</h2>
        <p className="text-sm text-muted-foreground">Renda → limites → importação. Você pode revisar seu plano a qualquer momento.</p>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-3">
        {steps.map((step, index) => {
          const done = index === 0 ? incomeConfigured : index === 1 ? limitsConfigured : false;
          const Icon = done ? CheckCircle2 : step.icon;

          return (
            <Link key={step.title} href={step.href} className="group rounded-lg border border-border bg-background/40 p-4 transition hover:border-primary/60 hover:bg-primary/5">
              <div className="mb-4 flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="text-xs font-medium text-muted-foreground">{done ? "Configurado" : `Passo ${index + 1}`}</span>
              </div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{step.description}</p>
            </Link>
          );
        })}
        <div className="lg:col-span-3">
          <Link
            href={steps[nextStep].href}
            className="premium-button inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-primary-foreground"
          >
            {nextStep === 0 ? "Informar minha renda" : nextStep === 1 ? "Definir meus limites" : "Importar meu primeiro extrato"}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
