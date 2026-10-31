import Image from "next/image";
import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer-inner">
        <Link href="/" aria-label="Fluxa, início" className="landing-logo"><Image src="/branding/fluxa-logo.png" alt="Fluxa" width={420} height={160} className="h-7 w-auto" /></Link>
        <nav aria-label="Rodapé" className="public-footer-links">
          <Link href="/demo">Demonstração</Link>
          <Link href="/login">Entrar</Link>
          <Link href="/signup">Criar conta</Link>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos de uso</Link>
        </nav>
        <p className="public-footer-note">Fluxa organiza finanças pessoais. Não é banco e não movimenta dinheiro.</p>
      </div>
    </footer>
  );
}
