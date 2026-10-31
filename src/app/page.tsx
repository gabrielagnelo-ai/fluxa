import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { FileSpreadsheet, MessageCircle, MonitorSmartphone } from "lucide-react";
import { RevealObserver } from "@/components/motion/reveal-observer";
import { PhonePreview } from "@/components/public/phone-preview";
import { PublicNav } from "@/components/public/public-nav";
import { exampleCategories, exampleStatement, formatAmount } from "@/components/public/example-month";

export const metadata: Metadata = {
  title: { absolute: "Fluxa | Seu dinheiro, explicado" },
  description: "Importe o extrato do seu banco ou mande o gasto por mensagem no WhatsApp. O Fluxa separa cada gasto por categoria e mostra para onde o mês foi."
};

const facts = [
  { icon: FileSpreadsheet, text: "Extrato em CSV, XLSX ou PDF" },
  { icon: MessageCircle, text: "Gasto por mensagem no WhatsApp" },
  { icon: MonitorSmartphone, text: "Demonstração sem criar conta" }
];

const step = (index: number) => ({ "--i": index }) as CSSProperties;

export default function Home() {
  return (
    <div className="landing">
      <RevealObserver />
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <PublicNav />

      <main id="conteudo">
        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow rise" style={step(0)}>Finanças pessoais</p>
            <h1 id="hero-title" className="landing-title rise" style={step(1)}>Seu dinheiro, <span>explicado.</span></h1>
            <p className="landing-lead rise" style={step(2)}>
              Importe o extrato do seu banco ou mande o gasto por mensagem no WhatsApp. O Fluxa separa cada gasto por categoria e mostra para onde o mês foi.
            </p>
            <div className="landing-ctas rise" style={step(3)}>
              <Link href="/signup" className="btn btn-filled btn-large">Começar com meus dados</Link>
              <Link href="/demo" className="btn btn-gray btn-large">Ver a demonstração</Link>
            </div>
            <p className="landing-cta-note rise" style={step(3)}>A demonstração usa dados fictícios e não pede cadastro.</p>
          </div>

          <div className="landing-stage">
            <LimitExample className="landing-float landing-float-left" style={step(6)} />
            <PhonePreview />
            <CategoryExample className="landing-float landing-float-right" style={step(8)} />
          </div>

          <ul className="landing-facts" aria-label="O que o Fluxa faz">
            {facts.map((fact, index) => <li key={fact.text} data-reveal style={step(index)}><span className="row-icon" aria-hidden="true"><fact.icon /></span>{fact.text}</li>)}
          </ul>
        </section>

        <section id="importar" className="landing-section" aria-labelledby="importar-title" data-reveal-group>
          <div className="landing-section-copy" data-stagger style={step(0)}>
            <p className="landing-eyebrow">Importar</p>
            <h2 id="importar-title" className="landing-h2">Você traz o extrato. <span>O Fluxa faz o resto.</span></h2>
            <p className="landing-body">
              Envie o arquivo do banco em CSV, XLSX ou PDF; linhas já importadas ficam de fora. No dia a dia, mande o gasto por mensagem no WhatsApp, com o número vinculado à sua conta.
            </p>
          </div>
          <div className="landing-section-media">
            <StatementExample />
            <WhatsAppExample style={step(2)} stagger />
          </div>
        </section>
      </main>
    </div>
  );
}

function ExampleHeader({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="example-header"><span>{title}</span>{children ?? <span className="example-tag">Dados fictícios</span>}</div>;
}

function StatementExample() {
  const duplicate = exampleStatement[2];
  return (
    <figure className="card example-card" data-stagger style={step(1)}>
      <ExampleHeader title="extrato-outubro.csv" />
      <ol className="list">
        {exampleStatement.slice(0, 4).map(row => (
          <li key={row.raw} className="list-row example-statement-row">
            <span className="example-day num">{row.day}</span>
            <span className="row-main row-title">{row.raw}</span>
            <span className="row-value">{row.amount > 0 ? "+" : "−"}{formatAmount(row.amount)}</span>
          </li>
        ))}
        <li className="list-row example-statement-row is-duplicate">
          <span className="example-day num">{duplicate.day}</span>
          <span className="row-main row-title"><s>{duplicate.raw}</s></span>
          <span className="tag">repetida, fica de fora</span>
        </li>
      </ol>
    </figure>
  );
}

// Mirrors src/lib/whatsapp/server.ts: text message in, transaction saved, confirmation reply.
function WhatsAppExample({ className = "", style, stagger = false }: { className?: string; style?: CSSProperties; stagger?: boolean }) {
  return (
    <figure className={`card example-card ${className}`} style={style} data-stagger={stagger || undefined} aria-label="Exemplo de registro de gasto pelo WhatsApp">
      <ExampleHeader title="WhatsApp" />
      <div className="chat">
        <p className="chat-out">gastei 32 no mercado</p>
        <p className="chat-in">Registrado no Fluxa: gasto de <span className="num">R$ 32,00</span> em Mercado (<span className="num">30/10</span>).</p>
      </div>
    </figure>
  );
}

function CategoryExample({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <figure className={`card example-card ${className}`} style={style} data-reveal aria-label="Exemplo de categoria aplicada por regra">
      <ExampleHeader title="Categoria" />
      <div className="example-category">
        <p className="row-sub num">07/10 · COMPRA DEB</p>
        <p className="example-category-name">Mercado do bairro</p>
        <p className="example-category-meta"><span className="num">−R$ 620,00</span><span className="tag">Mercado</span></p>
        <p className="row-sub">Regra: contém “mercado”</p>
      </div>
    </figure>
  );
}

function LimitExample({ className = "", style }: { className?: string; style?: CSSProperties }) {
  const market = exampleCategories.find(item => item.name === "Mercado") ?? exampleCategories[0];
  const usage = Math.round((market.spent / market.planned) * 100);
  return (
    <figure className={`card example-card ${className}`} style={style} data-reveal aria-label="Exemplo de limite por categoria">
      <ExampleHeader title="Limite do mês" />
      <div className="example-category">
        <p className="example-category-name">{market.name}</p>
        <p className="row-sub num">R$ {formatAmount(market.spent)} de R$ {formatAmount(market.planned)}</p>
        <div className="meter"><span style={{ width: `${usage}%` }} /></div>
        <p className="row-sub num" style={{ marginTop: "0.5rem" }}>{usage}% do combinado</p>
      </div>
    </figure>
  );
}
