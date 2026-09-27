import { AuthNotice } from "@/components/auth/auth-notice";

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const recovery = params.flow === "recovery";
  const unavailable = params.reason === "unavailable";
  return <AuthNotice title={unavailable ? "Não foi possível validar seu link" : "Este link não está mais disponível"} description={unavailable ? "O serviço de acesso está indisponível no momento. Tente abrir o link novamente em instantes. Se continuar sem acesso, solicite um novo link." : "O link pode ter expirado ou já ter sido utilizado. Solicite outro e abra a mensagem mais recente."} href={recovery ? "/reset-password" : "/login?confirmation=needed"} action={recovery ? "Solicitar novo link" : "Voltar ao acesso"} />;
}
