import type { SupabaseClient } from "@supabase/supabase-js";

const recoveryWindowSeconds = 15 * 60;

/** Call only with claims verified by Supabase getClaims(), never decoded JSON. */
export function isRecentRecoveryClaims(claims: unknown, userId: string | undefined, now = Math.floor(Date.now() / 1000)) {
  if (!claims || typeof claims !== "object" || !userId) return false;
  const data = claims as Record<string, unknown>;
  if (data.sub !== userId || typeof data.session_id !== "string" || !data.session_id || typeof data.exp !== "number" || data.exp <= now) return false;
  if (!Array.isArray(data.amr)) return false;
  return data.amr.some((item: unknown) => {
    if (!item || typeof item !== "object") return false;
    const method = item as Record<string, unknown>;
    return method.method === "recovery" && typeof method.timestamp === "number" && method.timestamp >= now - recoveryWindowSeconds && method.timestamp <= now + 60;
  });
}

/** A regular signed-in session is not enough for this dedicated recovery flow. */
export async function hasVerifiedRecoverySession(auth: Pick<SupabaseClient["auth"], "getUser" | "getClaims">) {
  try {
    const { data: userData, error: userError } = await auth.getUser();
    if (userError || !userData.user) return false;
    const { data, error } = await auth.getClaims();
    return !error && isRecentRecoveryClaims(data?.claims, userData.user.id);
  } catch {
    return false;
  }
}
