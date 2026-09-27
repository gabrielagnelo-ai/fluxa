import { AuthForm } from "@/components/auth/auth-form";
import { AuthNotice } from "@/components/auth/auth-notice";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { hasVerifiedRecoverySession } from "@/lib/supabase/recovery";

export const dynamic = "force-dynamic";

export default async function NewPasswordPage() {
  let validSession = false;
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      validSession = await hasVerifiedRecoverySession(supabase.auth);
    } catch { /* The recovery request remains available after a service outage. */ }
  }
  if (!validSession) return <AuthNotice title="Abra seu link de recuperação" description="Para definir uma nova senha, abra o link que enviamos ao seu e-mail. Se ele expirou ou já foi usado, solicite outro." href="/reset-password" action="Solicitar novo link" />;
  return <AuthForm mode="new-password" />;
}
