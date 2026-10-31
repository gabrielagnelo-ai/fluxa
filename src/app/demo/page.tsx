import type { Metadata } from "next";
import Link from "next/link";
import { DemoExplorer } from "@/components/demo/demo-explorer";
import { RevealObserver } from "@/components/motion/reveal-observer";
import { PublicNav } from "@/components/public/public-nav";

export const metadata: Metadata = { title: "Demonstração", description: "Explore o Fluxa com um mês de dados fictícios, sem criar uma conta." };

export default function DemoPage() {
  return (
    <div className="landing">
      <RevealObserver />
      <PublicNav />
      <main className="demo-main">
        <header className="page-header">
          <div className="page-header-copy">
            <p className="page-eyebrow">Demonstração</p>
            <h1 className="page-title">Veja o Fluxa em uso</h1>
            <p className="page-description">Um mês de exemplo nas telas de verdade do Fluxa. Os dados são fictícios: nada aqui lê ou altera uma conta.</p>
          </div>
        </header>
        <DemoExplorer />
        <section className="card demo-cta" aria-labelledby="demo-cta-title">
          <div>
            <h2 id="demo-cta-title" className="card-title">Pronto para organizar seu mês?</h2>
            <p className="card-subtitle">Crie sua conta, informe sua renda, defina os limites e importe o primeiro extrato.</p>
          </div>
          <Link href="/signup" className="btn btn-filled btn-large">Começar com meus dados</Link>
        </section>
      </main>
    </div>
  );
}
