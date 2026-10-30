import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/branding/logo";
import { SceneMode } from "@/components/public/scene-mode";

export const preferredRegion = "gru1";

// Same scene as the landing page: the camera settles on the month's bars, the form sits on the right.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public-site lg:grid lg:min-h-[100dvh] lg:grid-cols-[1fr_minmax(440px,500px)]">
      <SceneMode mode="auth" />
      <div className="flex flex-col justify-between px-5 pb-6 pt-4 md:px-10 lg:py-8">
        <Link href="/" aria-label="Fluxa, voltar ao início" className="-ml-1 inline-flex min-h-11 w-fit items-center rounded-md p-1">
          <Logo size="sm" />
        </Link>
        <p className="mono-label hidden max-w-[36ch] lg:block">Mês de exemplo · cada coluna é uma categoria, a altura é o quanto saiu</p>
      </div>
      <main className="flex items-start justify-center px-3 pb-10 sm:px-5 lg:items-center lg:border-l lg:border-[var(--line)] lg:bg-[var(--panel)] lg:px-12 lg:pb-0 lg:backdrop-blur-xl">
        <div className="w-full max-w-[420px] rounded-[24px] border border-[var(--line)] bg-[var(--panel)] px-5 py-8 backdrop-blur-xl sm:px-8 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          {children}
        </div>
      </main>
    </div>
  );
}
