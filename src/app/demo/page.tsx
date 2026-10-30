import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/branding/logo";
import { DemoExplorer } from "@/components/demo/demo-explorer";
import { PublicFooter } from "@/components/public/public-footer";

export const metadata: Metadata = { title: "Demonstração", description: "Explore um exemplo do Fluxa com dados fictícios, sem criar uma conta." };

export default function DemoPage() {
  return (
    <div className="public-site public-solid">
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Fluxa, voltar ao início" className="-ml-1 shrink-0 rounded-md p-1"><Logo size="sm" /></Link>
          <nav aria-label="Acesso" className="flex items-center gap-1 sm:gap-4">
            <Link href="/login" className="link-quiet px-2 text-[15px]">Entrar</Link>
            <Link href="/signup" className="btn-cyan !min-h-11 !px-4 !text-[15px]">Criar conta</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <p className="mono-label">Demonstração · dados fictícios</p>
        <h1 className="display mt-3 text-[clamp(48px,8vw,96px)]">Veja o Fluxa <span className="text-cyan">em uso.</span></h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-2">Um mês de exemplo: entradas e saídas, gastos comparados com o planejamento e de onde vêm os valores. Nenhuma conta bancária conectada; esta página não lê nem altera os dados de ninguém.</p>
        <DemoExplorer />
        <section className="mt-14 flex flex-col gap-5 border-t border-[var(--line)] pt-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="display text-[clamp(36px,5vw,56px)]">Pronto para o seu mês?</h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-2">Crie sua conta, informe sua renda, defina os limites e importe seu primeiro extrato.</p>
          </div>
          <Link href="/signup" className="btn-cyan shrink-0">Começar com meus dados <ArrowRight className="size-4" aria-hidden="true" /></Link>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
