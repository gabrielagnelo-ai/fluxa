import Image from "next/image";
import Link from "next/link";

/** Floating glass bar for public pages: logo, sign in, one filled action. */
export function PublicNav({ cta = { href: "/signup", label: "Criar conta" } }: { cta?: { href: string; label: string } }) {
  return (
    <header className="landing-nav-wrap">
      <nav className="landing-nav glass" aria-label="Fluxa">
        <Link href="/" aria-label="Fluxa, início" className="landing-logo">
          <Image unoptimized src="/branding/fluxa-logo.png" alt="Fluxa" width={420} height={160} priority className="h-8 w-auto md:h-10" />
        </Link>
        <div className="landing-nav-actions">
          <Link href="/login" className="btn btn-plain landing-login">Entrar</Link>
          <Link href={cta.href} className="btn btn-filled landing-nav-cta">{cta.label}</Link>
        </div>
      </nav>
    </header>
  );
}
