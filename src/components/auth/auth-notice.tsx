import Link from "next/link";

export function AuthNotice({ title, description, href, action }: { title: string; description: string; href: string; action: string }) {
  return (
    <section className="auth-card" aria-labelledby="auth-notice-title">
      <h1 id="auth-notice-title" className="auth-title">{title}</h1>
      <p className="auth-description">{description}</p>
      <Link href={href} className="btn btn-filled btn-large auth-submit">{action}</Link>
      <div className="auth-links"><Link href="/" className="btn btn-plain">Voltar ao início</Link></div>
    </section>
  );
}
