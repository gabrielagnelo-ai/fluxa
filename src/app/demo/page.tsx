import type { Metadata } from "next";
import Link from "next/link";
import { FluxaLogo } from "@/components/brand/fluxa-logo";
import { DemoExplorer } from "@/components/demo/demo-explorer";

export const metadata: Metadata = { title: "Demonstração", description: "Explore um exemplo do Fluxa com dados fictícios, sem criar uma conta." };

export default function DemoPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5"><Link href="/" aria-label="Fluxa, voltar ao início"><FluxaLogo /></Link><div className="flex items-center gap-3"><Link href="/login" className="rounded-md px-3 py-2 text-sm underline underline-offset-4">Entrar</Link><Link href="/signup" className="premium-button inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-primary-foreground">Criar minha conta</Link></div></header>
      <div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm leading-6"><strong>Demonstração com dados fictícios.</strong> Nenhuma conta bancária conectada. Esta página não lê nem altera os dados da sua conta.</div>
      <section className="mt-8"><h1 className="text-3xl font-semibold sm:text-4xl">Veja o Fluxa em uso</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Explore um mês de exemplo: acompanhe entradas e saídas, compare gastos com o planejamento e entenda de onde vêm os valores.</p><DemoExplorer /></section>
      <section className="my-10 flex flex-col gap-4 rounded-2xl border border-border bg-card/50 p-6 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Pronto para organizar seu mês?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Crie sua conta, informe sua renda, defina os limites e importe seu primeiro extrato.</p></div><Link href="/signup" className="premium-button inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl px-5 text-sm font-semibold text-primary-foreground">Começar com meus dados</Link></section>
    </main>
  );
}
