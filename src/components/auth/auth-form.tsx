"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/branding/logo";
import { signIn, signUp, resetPassword } from "@/app/actions";

type Mode = "login" | "signup" | "reset";

const actions = {
  login: signIn,
  signup: signUp,
  reset: resetPassword
};

export function AuthForm({ mode }: { mode: Mode }) {
  const [state, action, pending] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => actions[mode](formData),
    undefined
  );
  const title = mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar senha";
  const error = state && "error" in state ? state.error : undefined;
  const success = state && "success" in state ? state.success : undefined;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="items-center text-center">
        <Logo size="lg" compact className="mb-2 justify-center" />
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">Entenda para onde seu dinheiro vai.</p>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {mode === "signup" && <Input name="name" placeholder="Nome" autoComplete="name" required />}
          <Input name="email" type="email" placeholder="Email" autoComplete="email" required />
          {mode !== "reset" && <Input name="password" type="password" placeholder="Senha" autoComplete="current-password" required />}
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          {success && <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{success}</p>}
          <Button className="w-full" disabled={pending}>
            {pending ? "Processando..." : title}
          </Button>
        </form>
        <div className="mt-5 flex justify-between text-sm text-muted-foreground">
          {mode !== "login" && <Link href="/login">Já tenho conta</Link>}
          {mode !== "signup" && <Link href="/signup">Criar conta</Link>}
          {mode !== "reset" && <Link href="/reset-password">Esqueci a senha</Link>}
        </div>
      </CardContent>
    </Card>
  );
}
