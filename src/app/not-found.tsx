import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/branding/logo";
import { SceneMode } from "@/components/public/scene-mode";

export const metadata: Metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return (
    <div className="public-site flex min-h-[100dvh] flex-col">
      <SceneMode mode="lost" />
      <header className="mx-auto flex h-16 w-full max-w-[1400px] items-center px-5 md:px-10">
        <Link href="/" aria-label="Fluxa, voltar ao início" className="-ml-1 rounded-md p-1"><Logo size="sm" /></Link>
      </header>
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-end px-5 pb-16 md:justify-center md:px-10">
        <div className="copy-plate max-w-[760px]">
          <p className="mono-label"><span className="text-brand">404</span> · Página não encontrada</p>
          <h1 className="display mt-4 text-[clamp(56px,10vw,150px)]">Este endereço <span className="text-brand">não existe.</span></h1>
          <p className="mt-5 max-w-[42ch] text-[17px] leading-relaxed text-2">O link pode estar incompleto ou a página mudou de lugar. Volte ao início ou entre na sua conta.</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/" className="btn-brand">Voltar ao início</Link>
            <Link href="/login" className="link-quiet">Entrar na conta</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
