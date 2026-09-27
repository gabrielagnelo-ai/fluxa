"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/branding/logo";
import { PasswordInput } from "./password-input";
import { signIn, signUp, resetPassword, resendConfirmation, updatePassword } from "@/app/actions";
import { safeAuthDestination, type AuthActionState } from "@/lib/supabase/auth-flow";

type Mode = "login" | "signup" | "reset" | "new-password";
const actions = { login: signIn, signup: signUp, reset: resetPassword, "new-password": updatePassword };
const copy = {
  login: { title: "Entrar", description: "Acesse seu planejamento, seus gastos e suas metas.", submit: "Entrar na conta" },
  signup: { title: "Criar conta", description: "Comece a organizar seu dinheiro. Confirme seu e-mail após o cadastro.", submit: "Criar minha conta" },
  reset: { title: "Recuperar senha", description: "Informe o e-mail da sua conta para receber um link de recuperação.", submit: "Enviar link de recuperação" },
  "new-password": { title: "Criar nova senha", description: "Esta etapa fica disponível por 15 minutos após abrir o link. Escolha sua nova senha e entre novamente para continuar.", submit: "Salvar nova senha" }
};

export function AuthForm({ mode, next = "/dashboard", notice, confirmation = false }: { mode: Mode; next?: string; notice?: string; confirmation?: boolean }) {
  // Controlled fields survive rejected server actions; passwords never enter action results or storage.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, action, pending] = useActionState(
    async (_previousState: AuthActionState | undefined, formData: FormData) => {
      const result = await actions[mode](formData);
      if (result.success) { setPassword(""); setConfirmPassword(""); }
      return result;
    }, undefined
  );
  const [resendState, resendAction, resendPending] = useActionState(
    async (_previousState: AuthActionState | undefined, formData: FormData) => resendConfirmation(formData), undefined
  );
  const messageRef = useRef<HTMLParagraphElement>(null);
  const text = copy[mode];
  const newPassword = mode === "signup" || mode === "new-password";
  const showResend = mode !== "new-password" && mode !== "reset" && (state?.confirmationRequired || confirmation);
  useEffect(() => {
    if (state?.error || state?.success) messageRef.current?.focus();
  }, [state]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="items-center text-center">
        <Link href="/" aria-label="Fluxa, voltar ao início" className="rounded-md focus-visible:outline focus-visible:outline-primary"><Logo size="lg" compact className="mb-2 justify-center" /></Link>
        <h1 className="text-2xl font-semibold">{text.title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{text.description}</p>
      </CardHeader>
      <CardContent>
        {notice && <p role="status" className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-3 text-sm leading-6">{notice}</p>}
        <form action={action} onReset={(event) => event.preventDefault()} className="space-y-4" aria-busy={pending}>
          <input type="hidden" name="next" value={safeAuthDestination(next)} />
          {mode === "signup" && <div className="space-y-1.5"><label htmlFor="name" className="text-sm font-medium">Nome</label><Input id="name" name="name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" minLength={2} required aria-invalid={state?.field === "name"} aria-describedby={state?.field === "name" ? "auth-feedback" : undefined} className="h-11" /></div>}
          {mode !== "new-password" && <div className="space-y-1.5"><label htmlFor="email" className="text-sm font-medium">E-mail</label><Input id="email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required aria-invalid={state?.field === "email"} aria-describedby={state?.field === "email" ? "auth-feedback" : undefined} className="h-11" /></div>}
          {mode !== "reset" && <PasswordInput name="password" label={mode === "new-password" ? "Nova senha" : "Senha"} value={password} onChange={setPassword} newPassword={newPassword} invalid={state?.field === "password"} describedBy={[newPassword ? "password-help" : "", state?.field === "password" ? "auth-feedback" : ""].filter(Boolean).join(" ") || undefined} />}
          {newPassword && <p id="password-help" className="text-xs leading-5 text-muted-foreground">Use pelo menos 8 caracteres. Uma frase longa e exclusiva é mais fácil de lembrar.</p>}
          {mode === "new-password" && <PasswordInput name="confirmPassword" label="Confirmar nova senha" value={confirmPassword} onChange={setConfirmPassword} newPassword invalid={state?.field === "confirmPassword"} describedBy={state?.field === "confirmPassword" ? "auth-feedback" : undefined} />}
          {(state?.error || state?.success) && <p id="auth-feedback" ref={messageRef} tabIndex={-1} role={state.error ? "alert" : "status"} className={`rounded-lg border px-3 py-3 text-sm leading-6 focus:outline-none ${state.error ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-primary/30 bg-primary/10 text-foreground"}`}>{state.error ?? state.success}</p>}
          <Button className="min-h-11 w-full" disabled={pending}>{pending ? "Aguarde..." : text.submit}</Button>
        </form>
        {showResend && <form action={resendAction} className="mt-4 space-y-2 rounded-lg border border-border p-3">
          <input type="hidden" name="email" value={email} />
          <p className="text-sm text-muted-foreground">Confirme o e-mail no campo acima para receber outro link.</p>
          <Button className="min-h-11 w-full bg-muted text-foreground hover:bg-muted/80" disabled={resendPending || !email}>{resendPending ? "Enviando..." : "Reenviar confirmação"}</Button>
          {resendState?.error && <p role="alert" className="text-sm text-destructive">{resendState.error}</p>}
          {resendState?.success && <p role="status" className="text-sm text-muted-foreground">{resendState.success}</p>}
        </form>}
        <div className="mt-5 flex flex-wrap justify-between gap-x-4 gap-y-2 text-sm">
          {mode !== "login" && <Link className="rounded-md py-2 underline underline-offset-4 focus-visible:outline focus-visible:outline-primary" href="/login">Voltar para entrar</Link>}
          {mode === "login" && <Link className="rounded-md py-2 underline underline-offset-4 focus-visible:outline focus-visible:outline-primary" href="/signup">Criar conta</Link>}
          {(mode === "login" || mode === "new-password") && <Link className="rounded-md py-2 underline underline-offset-4 focus-visible:outline focus-visible:outline-primary" href="/reset-password">{mode === "new-password" ? "Solicitar novo link" : "Esqueci a senha"}</Link>}
        </div>
      </CardContent>
    </Card>
  );
}
