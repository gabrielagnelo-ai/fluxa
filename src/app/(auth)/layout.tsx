import type { ReactNode } from "react";
import { FluxaLogo } from "@/components/brand/fluxa-logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_520px]">
      <section className="hidden border-r border-border bg-card/70 px-10 py-12 backdrop-blur-xl lg:flex lg:flex-col lg:justify-between">
        <FluxaLogo compact />
        <div>
          <p className="text-sm font-medium text-primary">Entenda para onde seu dinheiro vai.</p>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold tracking-normal">Seu dinheiro explicado de forma simples.</h1>
          <p className="mt-5 max-w-lg text-muted-foreground">
            Importe extratos, categorize gastos automaticamente e acompanhe sua vida financeira em um dashboard claro.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center px-5 py-10">{children}</section>
    </main>
  );
}
