import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, FileUp, Flag, ShieldCheck, Sparkles } from "lucide-react";
import { FluxaLogo } from "@/components/brand/fluxa-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const benefits = [
  { title: "Importação inteligente de extratos", icon: FileUp },
  { title: "Categorias automáticas", icon: Sparkles },
  { title: "Dashboard financeiro claro", icon: BarChart3 },
  { title: "Metas e orçamento mensal", icon: Flag },
  { title: "Visual moderno e seguro", icon: ShieldCheck }
];

const steps = [
  "Importe extratos bancários em CSV, XLSX ou PDF.",
  "Revise categorias e marcadores identificados automaticamente.",
  "Acompanhe saldo, gastos, metas e projeções por período."
];

function DashboardPreview() {
  return (
    <div className="mx-auto mt-12 w-full max-w-5xl rounded-xl border border-border bg-card/80 p-4 shadow-card backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Preview Fluxa</p>
          <h2 className="text-lg font-semibold">Dashboard financeiro</h2>
        </div>
        <span className="rounded-md bg-primary/15 px-3 py-1 text-xs text-primary">Maio 2026</span>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {[
          ["Saldo atual", -2154.19, "text-red-400"],
          ["Receitas", 309.51, "text-success"],
          ["Despesas", 2463.7, "text-red-400"],
          ["Economia", -2154.19, "text-red-400"]
        ].map(([label, value, tone]) => (
          <div key={String(label)} className="rounded-lg border border-border bg-background/55 p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <strong className={`mt-2 block text-xl ${tone}`}>{formatCurrency(Number(value))}</strong>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-border bg-background/55 p-4">
          <p className="text-sm font-medium">Gastos por categoria</p>
          <div className="mt-5 grid place-items-center">
            <div className="size-32 rounded-full border-[18px] border-primary border-r-red-500 border-t-success" />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background/55 p-4">
          <p className="text-sm font-medium">Últimas transações</p>
          <div className="mt-4 space-y-3 text-sm">
            {["IFOOD SAO PAULO", "RU UTFPR", "META RESERVA"].map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-md bg-card/70 px-3 py-2">
                <span>{item}</span>
                <span className={index === 2 ? "text-success" : "text-red-400"}>{index === 2 ? "Meta" : "Saída"}</span>
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
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <FluxaLogo />
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground">
            Entrar
          </Link>
          <Link href="/signup">
            <Button>Começar agora</Button>
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 text-center sm:px-6 lg:px-8">
        <p className="mx-auto inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">
          Entenda para onde seu dinheiro vai.
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-semibold tracking-normal text-foreground sm:text-6xl">
          Seu dinheiro explicado de forma simples.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Importe extratos, categorize gastos automaticamente e descubra para onde seu dinheiro vai todos os meses.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/signup">
            <Button className="w-full shadow-glow sm:w-auto">
              Começar agora
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button className="w-full border border-border bg-card text-foreground hover:bg-muted sm:w-auto">Ver demonstração</Button>
          </Link>
        </div>
        <DashboardPreview />
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-5 lg:px-8">
        {benefits.map((benefit) => (
          <Card key={benefit.title}>
            <CardContent className="pt-5">
              <benefit.icon className="mb-4 size-5 text-primary" />
              <p className="text-sm font-medium">{benefit.title}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-medium text-primary">Como funciona</p>
            <h2 className="mt-2 text-3xl font-semibold">Da importação à clareza financeira.</h2>
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
