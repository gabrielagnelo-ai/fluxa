import Link from "next/link";

export function AuthNotice({ title, description, href, action }: { title: string; description: string; href: string; action: string }) {
  return (
    <div>
      <h1 className="display text-[clamp(44px,6vw,64px)]">{title}</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-2">{description}</p>
      <Link href={href} className="btn-cyan mt-8 w-full">{action}</Link>
      <Link href="/" className="link-quiet mt-3 w-full justify-center text-[15px]">Voltar ao início</Link>
    </div>
  );
}
