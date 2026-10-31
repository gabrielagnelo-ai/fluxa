"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
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
    <section className="auth-card" aria-labelledby="auth-title">
      <h1 id="auth-title" className="auth-title">{text.title}</h1>
      <p className="auth-description">{text.description}</p>
      {notice && <p role="status" className="auth-notice">{notice}</p>}
      <form action={action} onReset={event => event.preventDefault()} aria-busy={pending}>
        <input type="hidden" name="next" value={safeAuthDestination(next)} />
        <div className="auth-fields">
          {mode === "signup" && <div className="auth-field"><label htmlFor="name">Nome</label><div className="auth-field-control"><input id="name" name="name" value={name} onChange={event => setName(event.target.value)} autoComplete="name" minLength={2} required aria-invalid={state?.field === "name"} aria-describedby={state?.field === "name" ? "auth-feedback" : undefined} /></div></div>}
          {mode !== "new-password" && <div className="auth-field"><label htmlFor="email">E-mail</label><div className="auth-field-control"><input id="email" name="email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required aria-invalid={state?.field === "email"} aria-describedby={state?.field === "email" ? "auth-feedback" : undefined} /></div></div>}
          {mode !== "reset" && <PasswordInput name="password" label={mode === "new-password" ? "Nova senha" : "Senha"} value={password} onChange={setPassword} newPassword={newPassword} invalid={state?.field === "password"} describedBy={[newPassword ? "password-help" : "", state?.field === "password" ? "auth-feedback" : ""].filter(Boolean).join(" ") || undefined} />}
          {mode === "new-password" && <PasswordInput name="confirmPassword" label="Confirmar nova senha" value={confirmPassword} onChange={setConfirmPassword} newPassword invalid={state?.field === "confirmPassword"} describedBy={state?.field === "confirmPassword" ? "auth-feedback" : undefined} />}
        </div>
        {newPassword && <p id="password-help" className="auth-help">Use pelo menos 8 caracteres. Uma frase longa e exclusiva é mais fácil de lembrar.</p>}
        {(state?.error || state?.success) && <p id="auth-feedback" ref={messageRef} tabIndex={-1} role={state.error ? "alert" : "status"} className={state.error ? "auth-message is-error" : "auth-message"}>{state.error ?? state.success}</p>}
        <button type="submit" className="btn btn-filled btn-large auth-submit" disabled={pending}>{pending ? "Aguarde..." : text.submit}</button>
      </form>
      {showResend && <form action={resendAction} className="auth-resend">
        <input type="hidden" name="email" value={email} />
        <p>Confirme o e-mail no campo acima para receber outro link.</p>
        <button type="submit" className="btn btn-gray auth-submit" disabled={resendPending || !email}>{resendPending ? "Enviando..." : "Reenviar confirmação"}</button>
        {resendState?.error && <p role="alert" className="auth-message is-error">{resendState.error}</p>}
        {resendState?.success && <p role="status" className="auth-message">{resendState.success}</p>}
      </form>}
      <div className="auth-links">
        {mode !== "login" && <Link className="btn btn-plain" href="/login">Voltar para entrar</Link>}
        {mode === "login" && <Link className="btn btn-plain" href="/signup">Criar conta</Link>}
        {(mode === "login" || mode === "new-password") && <Link className="btn btn-plain" href="/reset-password">{mode === "new-password" ? "Solicitar novo link" : "Esqueci a senha"}</Link>}
      </div>
    </section>
  );
}
