import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/public/public-nav";

export const metadata: Metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return (
    <div className="landing not-found">
      <PublicNav />
      <main className="not-found-main">
        <p className="landing-eyebrow rise" style={{ "--i": 0 } as CSSProperties}>Erro 404 · Página não encontrada</p>
        <h1 className="landing-title rise" style={{ "--i": 1 } as CSSProperties}>Este endereço <span>não existe.</span></h1>
        <p className="landing-lead rise" style={{ "--i": 2 } as CSSProperties}>O link pode estar incompleto ou a página mudou de lugar. Volte ao início ou entre na sua conta.</p>
        <div className="landing-ctas rise" style={{ "--i": 3 } as CSSProperties}>
          <Link href="/" className="btn btn-filled btn-large">Voltar ao início</Link>
          <Link href="/login" className="btn btn-gray btn-large">Entrar na conta</Link>
        </div>
      </main>
    </div>
  );
}
