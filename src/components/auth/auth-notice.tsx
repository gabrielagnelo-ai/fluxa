import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AuthNotice({ title, description, href, action }: { title: string; description: string; href: string; action: string }) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Link href={href} className="premium-button inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">{action}</Link>
        <Link href="/" className="block rounded-md py-2 text-center text-sm text-muted-foreground underline underline-offset-4 focus-visible:outline focus-visible:outline-primary">Voltar ao início</Link>
      </CardContent>
    </Card>
  );
}
