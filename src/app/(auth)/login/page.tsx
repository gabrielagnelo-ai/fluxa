import { AuthForm } from "@/components/auth/auth-form";
import { safeAuthDestination } from "@/lib/supabase/auth-flow";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const notice = params.password === "updated" ? "Senha atualizada. Entre com sua nova senha para continuar." : params.data === "deleted" ? "Seus dados financeiros no Fluxa foram excluídos e sua sessão foi encerrada. O cadastro de acesso continua disponível." : undefined;
  return <AuthForm mode="login" next={safeAuthDestination(params.next)} confirmation={params.confirmation === "needed"} notice={notice} />;
}
