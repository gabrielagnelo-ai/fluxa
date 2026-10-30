"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { PasswordInput } from "./password-input";
import { signIn, signUp, resetPassword, resendConfirmation, updatePassword } from "@/app/actions";
import { safeAuthDestination, type AuthActionState } from "@/lib/supabase/auth-flow";

type Mode = "login" | "signup" | "reset" | "new-password";
type Field = NonNullable<AuthActionState["field"]>;
const actions = { login: signIn, signup: signUp, reset: resetPassword, "new-password": updatePassword };
const copy = {
  login: { title: "Entrar", description: "Acesse seu planejamento, seus gastos e suas metas.", submit: "Entrar na conta" },
  signup: { title: "Criar conta", description: "Depois do cadastro, confirme seu e-mail pelo link que vamos enviar.", submit: "Criar minha conta" },
  reset: { title: "Recuperar senha", description: "Informe o e-mail da sua conta para receber um link de recuperação.", submit: "Enviar link de recuperação" },
  "new-password": { title: "Nova senha", description: "Esta etapa fica disponível por 15 minutos após abrir o link. Escolha sua nova senha e entre novamente para continuar.", submit: "Salvar nova senha" }
};
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(mode: Mode, values: { name: string; email: string; password: string; confirmPassword: string }) {
  const errors: Partial<Record<Field, string>> = {};
  const newPassword = mode === "signup" || mode === "new-password";
  if (mode === "signup" && values.name.trim().length < 2) errors.name = "Informe seu nome, com pelo menos 2 letras.";
  if (mode !== "new-password") {
    if (!values.email.trim()) errors.email = "Informe seu e-mail.";
    else if (!emailPattern.test(values.email.trim())) errors.email = "Confira o e-mail: ele precisa ter @ e domínio, como nome@email.com.";
  }
  if (mode !== "reset") {
    if (!values.password) errors.password = "Informe sua senha.";
    else if (newPassword && values.password.length < 8) errors.password = "Use pelo menos 8 caracteres.";
  }
  if (mode === "new-password" && values.confirmPassword !== values.password) errors.confirmPassword = "As duas senhas precisam ser iguais.";
  return errors;
}

export function AuthForm({ mode, next = "/dashboard", notice, confirmation = false }: { mode: Mode; next?: string; notice?: string; confirmation?: boolean }) {
  // Controlled fields survive rejected server actions; passwords never enter action results or storage.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
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
  const formRef = useRef<HTMLFormElement>(null);
  const text = copy[mode];
  const newPassword = mode === "signup" || mode === "new-password";
  const showResend = mode !== "new-password" && mode !== "reset" && (state?.confirmationRequired || confirmation);
  // Server errors tied to a field show under that field; the rest show in the message box.
  const fieldError = (field: Field) => errors[field] ?? (state?.error && state.field === field ? state.error : undefined);
  const generalMessage = state?.error && !state.field ? state.error : state?.success;

  useEffect(() => {
    if (state?.error && state.field) formRef.current?.querySelector<HTMLInputElement>(`[name="${state.field}"]`)?.focus();
    else if (state?.error || state?.success) messageRef.current?.focus();
  }, [state]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const found = validate(mode, { name, email, password, confirmPassword });
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      event.preventDefault();
      event.currentTarget.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
    }
  }

  function clear(field: Field) {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  return (
    <div>
      <h1 className="display text-[clamp(52px,7vw,72px)]">{text.title}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-2">{text.description}</p>
      {notice && <p role="status" className="mt-6 rounded-xl border border-[var(--line-strong)] bg-[var(--brand-soft)] px-4 py-3 text-[15px] leading-relaxed">{notice}</p>}
      <form ref={formRef} action={action} onSubmit={onSubmit} noValidate onReset={(event) => event.preventDefault()} className="mt-8 space-y-5" aria-busy={pending}>
        <input type="hidden" name="next" value={safeAuthDestination(next)} />
        {mode === "signup" && <TextField name="name" label="Nome" value={name} onChange={(value) => { setName(value); clear("name"); }} autoComplete="name" error={fieldError("name")} />}
        {mode !== "new-password" && <TextField name="email" label="E-mail" type="email" inputMode="email" value={email} onChange={(value) => { setEmail(value); clear("email"); }} autoComplete="email" error={fieldError("email")} />}
        {mode !== "reset" && <PasswordInput name="password" label={mode === "new-password" ? "Nova senha" : "Senha"} value={password} onChange={(value) => { setPassword(value); clear("password"); }} newPassword={newPassword} error={fieldError("password")} describedBy={newPassword ? "password-help" : undefined} />}
        {newPassword && <p id="password-help" className="-mt-2 text-sm leading-relaxed text-2">Use pelo menos 8 caracteres. Uma frase longa e exclusiva é mais fácil de lembrar.</p>}
        {mode === "new-password" && <PasswordInput name="confirmPassword" label="Confirmar nova senha" value={confirmPassword} onChange={(value) => { setConfirmPassword(value); clear("confirmPassword"); }} newPassword error={fieldError("confirmPassword")} />}
        {generalMessage && <p id="auth-feedback" ref={messageRef} tabIndex={-1} role={state?.error ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-[15px] leading-relaxed focus:outline-none ${state?.error ? "border-[rgb(255_138_138/0.4)] bg-[rgb(255_138_138/0.08)] text-[var(--danger)]" : "border-[var(--line-strong)] bg-[var(--brand-soft)]"}`}>{generalMessage}</p>}
        <button type="submit" className="btn-brand w-full" disabled={pending}>{pending ? "Aguarde..." : text.submit}</button>
      </form>
      {showResend && <form action={resendAction} className="mt-5 space-y-3 rounded-xl border border-[var(--line)] p-4">
        <input type="hidden" name="email" value={email} />
        <p className="text-[15px] text-2">Confirme o e-mail no campo acima para receber outro link.</p>
        <button type="submit" className="btn-line w-full" disabled={resendPending || !email}>{resendPending ? "Enviando..." : "Reenviar confirmação"}</button>
        {resendState?.error && <p role="alert" className="field-error">{resendState.error}</p>}
        {resendState?.success && <p role="status" className="text-[15px] text-2">{resendState.success}</p>}
      </form>}
      <div className="mt-6 flex flex-wrap justify-between gap-x-6 text-[15px]">
        {mode !== "login" && <Link className="link-quiet" href="/login">Voltar para entrar</Link>}
        {mode === "login" && <Link className="link-quiet" href="/signup">Criar conta</Link>}
        {(mode === "login" || mode === "new-password") && <Link className="link-quiet" href="/reset-password">{mode === "new-password" ? "Solicitar novo link" : "Esqueci a senha"}</Link>}
      </div>
    </div>
  );
}

function TextField({ name, label, value, onChange, error, type = "text", inputMode, autoComplete }: {
  name: string; label: string; value: string; onChange: (value: string) => void; error?: string;
  type?: string; inputMode?: "email" | "text"; autoComplete?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-[15px] font-medium">{label}</label>
      <input id={name} name={name} type={type} inputMode={inputMode} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} autoCapitalize={type === "email" ? "none" : undefined} spellCheck={type === "email" ? false : undefined} required aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className="field-input" />
      {error && <p id={`${name}-error`} className="field-error">{error}</p>}
    </div>
  );
}
