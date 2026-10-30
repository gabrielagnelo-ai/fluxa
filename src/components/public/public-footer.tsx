import Link from "next/link";
import { Logo } from "@/components/branding/logo";

const links = [
  { href: "/demo", label: "Demonstração" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/termos", label: "Termos" },
  { href: "/login", label: "Entrar" }
];

export function PublicFooter() {
  return (
    <footer className="relative z-10 border-t border-[var(--line)] bg-[var(--ink)]">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-10">
        <div className="flex flex-col gap-3">
          <Logo size="sm" />
          <p className="mono-label !normal-case !tracking-normal">Os valores desta página são de um mês de exemplo, com dados fictícios.</p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-6">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="link-quiet text-[15px]">{link.label}</Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
