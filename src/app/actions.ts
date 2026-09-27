"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { secureLogger } from "@/lib/security/logger";
import { clearLocalAuthCookies, createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { authErrorMessage, authSiteUrl, authUnavailableMessage, safeAuthDestination, type AuthActionState } from "@/lib/supabase/auth-flow";
import { normalizeEmail } from "@/services/user-service";
import { hasVerifiedRecoverySession } from "@/lib/supabase/recovery";

const emailSchema = z.string().trim().email("Informe um e-mail válido.");
const passwordSchema = z.string().min(8, "Use pelo menos 8 caracteres na senha.").max(128, "Use no máximo 128 caracteres na senha.");

function reportFailure(operation: string, error: unknown): AuthActionState {
  const details = error as { code?: string; status?: number; name?: string };
  // Never log credentials, email addresses, full URLs, or tokens.
  secureLogger.warn(`Authentication ${operation} failed`, { code: details?.code, status: details?.status, name: details?.name });
  return { error: authErrorMessage(error), confirmationRequired: details?.code === "email_not_confirmed" };
}

export async function signIn(formData: FormData): Promise<AuthActionState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: email.error.issues[0]?.message, field: "email" };
  const password = z.string().min(1, "Informe sua senha.").safeParse(formData.get("password"));
  if (!password.success) return { error: password.error.issues[0]?.message, field: "password" };
  if (!isSupabaseConfigured()) return { error: authUnavailableMessage };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: normalizeEmail(email.data), password: password.data });
    if (error) return reportFailure("sign-in", error);
  } catch (error) {
    return reportFailure("sign-in", error);
  }
  revalidatePath("/", "layout");
  redirect(safeAuthDestination(formData.get("next")));
}

export async function signUp(formData: FormData): Promise<AuthActionState> {
  const parsed = z.object({ name: z.string().trim().min(2, "Informe seu nome."), email: emailSchema, password: passwordSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, field: parsed.error.issues[0]?.path[0] as AuthActionState["field"] };
  if (!isSupabaseConfigured()) return { error: authUnavailableMessage };
  const siteUrl = authSiteUrl(process.env);
  if (!siteUrl) return { error: authUnavailableMessage };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: normalizeEmail(parsed.data.email), password: parsed.data.password,
      options: { data: { name: parsed.data.name }, emailRedirectTo: `${siteUrl}/auth/callback?next=/email-confirmed` }
    });
    if (error) return reportFailure("sign-up", error);
    if (!data.session) return { success: "Confira seu e-mail para confirmar a conta. Abra o link recebido e volte ao Fluxa. Verifique também a pasta de spam.", confirmationRequired: true };
  } catch (error) {
    return reportFailure("sign-up", error);
  }
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function resendConfirmation(formData: FormData): Promise<AuthActionState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: email.error.issues[0]?.message, field: "email" };
  const siteUrl = authSiteUrl(process.env);
  if (!isSupabaseConfigured() || !siteUrl) return { error: authUnavailableMessage };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email: normalizeEmail(email.data), options: { emailRedirectTo: `${siteUrl}/auth/callback?next=/email-confirmed` } });
    if (error) return reportFailure("resend-confirmation", error);
    return { success: "Se a conta ainda precisar de confirmação, um novo link chegará ao seu e-mail. Verifique também o spam." };
  } catch (error) {
    return reportFailure("resend-confirmation", error);
  }
}

export async function resetPassword(formData: FormData): Promise<AuthActionState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: email.error.issues[0]?.message, field: "email" };
  const siteUrl = authSiteUrl(process.env);
  if (!isSupabaseConfigured() || !siteUrl) return { error: authUnavailableMessage };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email.data), { redirectTo: `${siteUrl}/auth/callback?next=/new-password` });
    if (error) return reportFailure("reset-password", error);
    return { success: "Se existir uma conta com este e-mail, enviaremos um link para criar uma nova senha. Verifique também a pasta de spam." };
  } catch (error) {
    return reportFailure("reset-password", error);
  }
}

export async function updatePassword(formData: FormData): Promise<AuthActionState> {
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) return { error: password.error.issues[0]?.message, field: "password" };
  if (password.data !== formData.get("confirmPassword")) return { error: "As senhas não coincidem. Digite a mesma senha nos dois campos.", field: "confirmPassword" };
  if (!isSupabaseConfigured()) return { error: authUnavailableMessage };
  try {
    const supabase = await createClient();
    if (!(await hasVerifiedRecoverySession(supabase.auth))) return { error: "Abra um link de recuperação recente para alterar a senha. Se o link expirou, solicite outro em Recuperar senha." };
    const { error } = await supabase.auth.updateUser({ password: password.data });
    if (error) return reportFailure("update-password", error);
    // A password update is successful even if the later revocation request fails.
    try { await supabase.auth.signOut({ scope: "local" }); } catch { /* Clear local cookies below. */ }
  } catch (error) {
    return reportFailure("update-password", error);
  }
  await clearLocalAuthCookies();
  revalidatePath("/", "layout");
  redirect("/login?password=updated");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Do not expose service details on a navigation action.
    }
  }
  await clearLocalAuthCookies();
  revalidatePath("/", "layout");
  redirect("/login");
}
