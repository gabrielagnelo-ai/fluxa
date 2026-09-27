import { AuthNotice } from "@/components/auth/auth-notice";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EmailConfirmedPage() {
  let signedIn = false;
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      signedIn = Boolean(data.user);
    } catch { /* Offer login when the session cannot be verified. */ }
  }
  return <AuthNotice title={signedIn ? "E-mail confirmado" : "Continue na sua conta"} description={signedIn ? "Sua conta está pronta. Comece pelo planejamento ou importe seu primeiro extrato." : "Entre para continuar. Se ainda não confirmou seu e-mail, abra o link recebido ou peça outro na tela de acesso."} href={signedIn ? "/dashboard" : "/login"} action={signedIn ? "Abrir meu Fluxa" : "Entrar na conta"} />;
}
