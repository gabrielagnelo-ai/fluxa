import type { SupabaseClient } from "@supabase/supabase-js";
import { safeAuthDestination } from "./auth-flow";
import { isRecentRecoveryClaims } from "./recovery";

type EmailAuth = Pick<SupabaseClient["auth"], "exchangeCodeForSession" | "verifyOtp" | "getClaims">;

/** Both Supabase SSR email-template links and the default PKCE callback work. */
export async function exchangeEmailLink(params: URLSearchParams, auth: EmailAuth) {
  const type = params.get("type");
  // These are navigation hints only. Authorization comes from verified claims.
  const requestsRecovery = type === "recovery" || safeAuthDestination(params.get("next")).split("?")[0] === "/new-password";
  const failure = `/auth-error?flow=${requestsRecovery ? "recovery" : "confirmation"}`;
  if (params.has("error")) return { destination: failure, success: false };
  try {
    const tokenHash = params.get("token_hash");
    const code = params.get("code");
    let result;
    if (tokenHash && (type === "email" || type === "signup" || type === "recovery")) {
      result = await auth.verifyOtp({ token_hash: tokenHash, type });
    } else if (code) {
      result = await auth.exchangeCodeForSession(code);
    }
    if (result?.error) {
      const unavailable = result.error.status === 0 || (result.error.status ?? 0) >= 500 || /fetch|network/i.test(result.error.message);
      return { destination: unavailable ? `${failure}&reason=unavailable` : failure, success: false };
    }
    if (!result || !result.data.session) return { destination: failure, success: false };
    const { data: verified, error: claimsError } = await auth.getClaims(result.data.session.access_token);
    if (claimsError) return { destination: failure, success: false };
    const recovery = isRecentRecoveryClaims(verified?.claims, result.data.user?.id);
    if (requestsRecovery && !recovery) return { destination: failure, success: false };
    return { destination: recovery ? "/new-password" : safeAuthDestination(params.get("next"), "/email-confirmed"), success: true };
  } catch {
    return { destination: `${failure}&reason=unavailable`, success: false };
  }
}
