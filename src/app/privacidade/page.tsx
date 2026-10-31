import type { Metadata } from "next";
import { PlainPage } from "@/components/public/plain-page";

export const metadata: Metadata = { title: "Privacidade", description: "Como o Fluxa trata os seus dados, em versão resumida." };

export default function PrivacyPage() {
  return (
    <PlainPage label="Privacidade" title="Seus dados no Fluxa">
      <section>
        <h2>Acesso à conta</h2>
        <p>Você entra com e-mail e senha. A sessão é gerenciada pelo Supabase Auth.</p>
      </section>
      <section>
        <h2>Onde ficam os dados financeiros</h2>
        <p>Transações, categorias, orçamentos e metas ficam no banco de dados do Fluxa e são lidos pelo servidor do app, sempre conferindo o usuário. As tabelas sensíveis não aceitam acesso direto de fora do servidor.</p>
      </section>
      <section>
        <h2>Inteligência artificial</h2>
        <p>Na importação, antes de qualquer descrição ir para a inteligência artificial, números de conta, agência, CPF e CNPJ são trocados por marcadores. Os registros técnicos do sistema também mascaram CPF, e-mail e chaves de acesso.</p>
      </section>
      <section>
        <h2>Excluir seus dados</h2>
        <p>Na área logada, a página Privacidade e dados tem a opção de excluir seus dados financeiros do Fluxa. O cadastro de acesso continua disponível depois da exclusão.</p>
      </section>
      <section>
        <h2>Demonstração</h2>
        <p>A demonstração usa um mês de exemplo com dados fictícios e não lê nem altera nenhuma conta.</p>
      </section>
    </PlainPage>
  );
}
