import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";

export { isSupabaseConfigured };

/** End this browser session even if the provider cannot revoke it immediately. */
export async function clearLocalAuthCookies() {
  const { url } = getSupabaseConfig();
  if (!url) return;
  const cookieStore = await cookies();
  const prefix = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name === prefix || cookie.name.startsWith(`${prefix}.`) || cookie.name === `${prefix}-code-verifier`) {
      cookieStore.delete(cookie.name);
    }
  }
}

export async function createClient() {
  const { url, key } = getSupabaseConfig();

  if (!isSupabaseConfigured()) {
    throw new Error("O acesso está temporariamente indisponível.");
  }

  const cookieStore = await cookies();

  return createServerClient(
    url!,
    key!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components cannot set cookies; Server Actions and Route Handlers can.
          }
        }
      }
    }
  );
}
