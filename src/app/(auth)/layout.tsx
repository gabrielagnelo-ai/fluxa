import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export const preferredRegion = "gru1";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      <header className="auth-header">
        <Link href="/" aria-label="Fluxa, voltar ao início" className="landing-logo"><Image unoptimized src="/branding/fluxa-logo.png" alt="Fluxa" width={420} height={160} priority className="h-8 w-auto" /></Link>
      </header>
      <main className="auth-main">{children}</main>
    </div>
  );
}
