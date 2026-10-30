import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/branding/logo";
import { PublicFooter } from "./public-footer";

// Short text pages linked from the footer (privacy, terms).
export function PlainPage({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <div className="public-site public-solid">
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link href="/" aria-label="Fluxa, voltar ao início" className="-ml-1 rounded-md p-1"><Logo size="sm" /></Link>
          <Link href="/login" className="link-quiet text-[15px]">Entrar</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-20 pt-12">
        <p className="mono-label">{label}</p>
        <h1 className="display mt-3 text-[clamp(48px,8vw,88px)]">{title}</h1>
        <p className="mt-6 rounded-xl border border-[var(--line-strong)] bg-[var(--brand-soft)] px-4 py-3 text-[15px] leading-relaxed">Versão resumida. O texto completo ainda está em revisão.</p>
        <div className="mt-10 space-y-8 text-[17px] leading-relaxed text-2 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[var(--text)]">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}
