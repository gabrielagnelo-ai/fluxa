import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, FileUp, Flag, ShieldCheck, Sparkles } from "lucide-react";
import { FluxaLogo } from "@/components/brand/fluxa-logo";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const benefits = [
  { title: "Importação inteligente", description: "CSV, XLSX e PDF em um fluxo simples.", icon: FileUp },
  { title: "Categorias automáticas", description: "Regras e IA para reduzir trabalho manual.", icon: Sparkles },
  { title: "Dashboard claro", description: "Saldo, gastos e receitas por período.", icon: BarChart3 },
  { title: "Metas e orçamento", description: "Limites por categoria e acompanhamento.", icon: Flag },
  { title: "Visual seguro", description: "Interface limpa, moderna e responsiva.", icon: ShieldCheck }
];

const steps = [
  "Importe extratos bancários ou registre gastos pelo WhatsApp.",
  "Revise categorias e metas identificadas automaticamente.",
  "Acompanhe saldo, gastos previstos, metas e insights em tempo real."
];

const metrics = [
  ["Saldo atual", -2154.19, "text-red-400"],
  ["Receitas", 309.51, "text-success"],
  ["Despesas", 2463.7, "text-red-400"],
  ["Economia", 0, "text-success"]
] as const;

const primaryCta =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm shadow-glow transition hover:-translate-y-0.5 hover:shadow-glow";
const secondaryCta =
  "inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-muted";

function DashboardPreview() {
  return (
    <div className="relative mx-auto mt-10 w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-card/80 p-4 shadow-card backdrop-blur">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-left">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Preview Fluxa</p>
          <h2 className="text-lg font-semibold">Dashboard financeiro</h2>
        </div>
        <span className="rounded-md bg-primary/15 px-3 py-1 text-xs text-primary">Maio 2026</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value, tone]) => (
          <div key={label} className="rounded-lg border border-border bg-background/55 p-4 text-left">
            <p className="text-sm text-muted-foreground">{label}</p>
            <strong className={`mt-2 block text-xl ${tone}`}>{formatCurrency(value)}</strong>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-lg border border-border bg-background/55 p-4">
          <p className="text-sm font-medium">Gastos por categoria</p>
          <div className="mt-4 grid place-items-center">
            <div className="relative size-28 rounded-full border-[16px] border-primary border-r-red-500 border-t-success">
              <div className="absolute inset-4 rounded-full bg-background/95" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background/55 p-4">
          <p className="text-sm font-medium">Últimas transações</p>
          <div className="mt-4 space-y-2 text-sm">
            {[
              ["IFOOD SAO PAULO", "Saída", "text-red-400"],
              ["RU UTFPR", "Saída", "text-red-400"],
              ["META RESERVA", "Meta", "text-success"]
            ].map(([item, type, tone]) => (
              <div key={item} className="flex items-center justify-between gap-4 rounded-md bg-card/70 px-3 py-2">
                <span className="truncate font-medium">{item}</span>
                <span className={tone}>{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <FluxaLogo />
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground">
            Entrar
          </Link>
          <Link href="/signup" className={primaryCta}>
            Começar agora
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 pb-12 pt-8 text-center sm:px-6 lg:px-8">
        <p className="mx-auto inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">
          Entenda para onde seu dinheiro vai.
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold tracking-normal text-foreground sm:text-6xl">
          Seu dinheiro explicado de forma simples.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Importe extratos, categorize gastos automaticamente e acompanhe sua vida financeira em um dashboard claro.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/signup" className={`${primaryCta} w-full sm:w-auto`}>
            Começar agora
            <ArrowRight className="size-4" />
          </Link>
          <Link href="/dashboard" className={`${secondaryCta} w-full sm:w-auto`}>
            Ver demonstração
          </Link>
        </div>
        <DashboardPreview />
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-2 lg:grid-cols-5 lg:px-8">
        {benefits.map((benefit) => (
          <Card key={benefit.title} className="min-h-32">
            <CardContent className="p-5">
              <benefit.icon className="mb-4 size-5 text-primary" />
              <p className="text-sm font-semibold">{benefit.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{benefit.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-medium text-primary">Como funciona</p>
            <h2 className="mt-2 max-w-md text-3xl font-semibold">Da importação à clareza financeira.</h2>
          </div>
          <div className="grid gap-3">
            {steps.map((step) => (
              <div key={step} className="flex gap-3 rounded-lg border border-border bg-card/70 p-4">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                <p className="text-sm text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
