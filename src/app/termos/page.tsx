import type { Metadata } from "next";
import { PlainPage } from "@/components/public/plain-page";

export const metadata: Metadata = { title: "Termos", description: "Termos de uso do Fluxa, em versão resumida." };

export default function TermsPage() {
  return (
    <PlainPage label="Termos de uso" title="O que o Fluxa faz">
      <section>
        <h2>O serviço</h2>
        <p>O Fluxa organiza finanças pessoais: importa extratos em CSV, XLSX ou PDF, separa os gastos por categoria e ajuda a planejar limites e metas.</p>
      </section>
      <section>
        <h2>Previsões e valores realizados</h2>
        <p>Limites e previsões são estimativas. Somente transações registradas ou importadas entram no gasto realizado.</p>
      </section>
      <section>
        <h2>Seus dados</h2>
        <p>O tratamento dos seus dados está descrito na página de privacidade.</p>
      </section>
    </PlainPage>
  );
}
