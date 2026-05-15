import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";

export { isSupabaseConfigured };

export async function createClient() {
  const { url, key } = getSupabaseConfig();

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase não configurado. Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local.");
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
