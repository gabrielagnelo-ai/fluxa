import type { ReactNode } from "react";
import { RevealObserver } from "@/components/motion/reveal-observer";
import { PublicFooter } from "./public-footer";
import { PublicNav } from "./public-nav";

// Short text pages linked from the footer (privacy, terms): one grouped card per topic.
export function PlainPage({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <div className="landing">
      <RevealObserver />
      <PublicNav />
      <main className="plain-main">
        <header className="page-header">
          <div className="page-header-copy">
            <p className="page-eyebrow">{label}</p>
            <h1 className="page-title">{title}</h1>
            <p className="page-description">Versão resumida. O texto completo ainda está em revisão.</p>
          </div>
        </header>
        <div className="card plain-card" data-reveal>{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}
