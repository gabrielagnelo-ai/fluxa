"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";

export function createClient() {
  const { url, key } = getSupabaseConfig();

  if (!isSupabaseConfigured()) throw new Error("O acesso está temporariamente indisponível.");
  return createBrowserClient(url!, key!);
}
