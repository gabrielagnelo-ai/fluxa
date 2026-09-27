export type AuthActionState = {
  error?: string;
  success?: string;
  confirmationRequired?: boolean;
  field?: "name" | "email" | "password" | "confirmPassword";
};

const destinations = new Set([
  "/dashboard", "/import", "/transactions", "/goals", "/investments", "/planning",
  "/insights", "/settings", "/privacy", "/new-password", "/email-confirmed"
]);

/** Only known, local app destinations can follow an authentication link. */
export function safeAuthDestination(value: unknown, fallback = "/dashboard") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) return fallback;
  try {
    const url = new URL(value, "https://fluxa.invalid");
    if (url.origin !== "https://fluxa.invalid" || !destinations.has(url.pathname)) return fallback;
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}

export function validHttpUrl(value: string | undefined) {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.username || url.password || (url.protocol !== "https:" && !(local && url.protocol === "http:"))) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

/** Do not construct email links from a request's untrusted Host header. */
export function authSiteUrl(env: Record<string, string | undefined>) {
  const configured = env.NEXT_PUBLIC_SITE_URL || env.NEXT_PUBLIC_APP_URL;
  if (configured) return validHttpUrl(configured);
  const deployment = env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL;
  if (deployment) return validHttpUrl(`https://${deployment}`);
  return env.NODE_ENV === "production" ? undefined : "http://localhost:3000";
}

export function authErrorMessage(error: unknown) {
  const item = error as { code?: string; message?: string; status?: number } | undefined;
  const code = item?.code ?? "";
  const message = item?.message?.toLowerCase() ?? "";
  if (item?.status === 429 || code.includes("rate_limit") || message.includes("rate limit")) return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
  if (code === "invalid_credentials" || message.includes("invalid login credentials")) return "E-mail ou senha incorretos. Confira os dados e tente novamente.";
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar. Verifique também a pasta de spam ou solicite um novo link abaixo.";
  if (["user_already_exists", "email_exists"].includes(code) || message.includes("already registered")) return "Já existe uma conta com este e-mail. Entre na sua conta ou recupere a senha.";
  if (code === "weak_password") return "Esta senha é muito fácil de adivinhar. Use uma combinação mais longa de letras, números e símbolos.";
  if (code === "same_password") return "Escolha uma senha diferente da atual.";
  if (["otp_expired", "flow_state_expired", "flow_state_not_found"].includes(code)) return "Este link expirou ou já foi utilizado. Solicite um novo link para continuar.";
  if (code === "signup_disabled") return "O cadastro está temporariamente indisponível. Tente novamente mais tarde.";
  if (message.includes("fetch") || message.includes("network") || (item?.status ?? 0) >= 500 || item?.status === 0) return "O serviço de acesso está indisponível no momento. Seus dados continuam no formulário; tente novamente em instantes.";
  return "Não foi possível concluir o acesso. Tente novamente em instantes.";
}

export const authUnavailableMessage = "O acesso está temporariamente indisponível. Tente novamente mais tarde.";
