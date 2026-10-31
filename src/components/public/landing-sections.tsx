import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, EyeOff, FileLock2, ShieldCheck, Trash2, Unplug } from "lucide-react";
import { exampleBalance, exampleCategories, exampleGoal, exampleIncome, examplePlanned, exampleSpent, formatAmount } from "./example-month";

const brl = (value: number) => `R$\u00a0${formatAmount(value)}`;
const step = (index: number) => ({ "--i": index }) as CSSProperties;
const ringColors = ["#0080F8", "#B5FFFF", "#1EA7FD", "#80D8F8", "#33BCFD"];

function Section({ id, eyebrow, title, accent, body, children, flip = false }: { id: string; eyebrow: string; title: string; accent: string; body: string; children: ReactNode; flip?: boolean }) {
  return (
    <section id={id} className={flip ? "landing-section is-flipped" : "landing-section"} aria-labelledby={`${id}-title`} data-reveal-group>
      <div className="landing-section-copy" data-stagger style={step(0)}>
        <p className="landing-eyebrow">{eyebrow}</p>
        <h2 id={`${id}-title`} className="landing-h2">{title} <span>{accent}</span></h2>
        <p className="landing-body">{body}</p>
      </div>
      <div className="landing-section-media">{children}</div>
    </section>
  );
}

function ExampleHeader({ title }: { title: string }) {
  return <div className="example-header"><span>{title}</span><span className="example-tag">Dados fictícios</span></div>;
}

export function CategorizeSection() {
  const rows = [
    { raw: "BOLETO · ALUGUEL E CONDOMINIO", category: "Moradia", how: "regra: contém “aluguel”" },
    { raw: "RECARGA · CARTAO TRANSPORTE", category: "Transporte", how: "regra: contém “transporte”" },
    { raw: "COMPRA CRED · CINEMA CENTRO", category: "Lazer", how: "sugestão da IA, para você conferir" }
  ];
  return (
    <Section id="categorizar" eyebrow="Categorizar" title="Cada gasto" accent="no seu lugar." flip
      body="Regras com palavras-chave e sugestões da inteligência artificial separam moradia, mercado e transporte. Você confere e corrige só o que precisar.">
      <figure className="card example-card" data-stagger style={step(1)}>
        <ExampleHeader title="Categorias" />
        <ul className="list">
          {rows.map(row => (
            <li key={row.raw} className="list-row category-example-row">
              <span className="row-main"><span className="row-title">{row.raw}</span><span className="row-sub">{row.how}</span></span>
              <span className="tag">{row.category}</span>
            </li>
          ))}
        </ul>
      </figure>
    </Section>
  );
}

export function SpendingSection() {
  const total = exampleCategories.reduce((sum, item) => sum + item.spent, 0);
  const circumference = 2 * Math.PI * 42;
  let offset = 0;
  return (
    <Section id="para-onde-vai" eyebrow="Para onde vai" title="Para onde" accent="o mês foi."
      body="Saldo, entradas, saídas e o peso de cada categoria, com o valor ao lado, mais uma análise do período feita pela inteligência artificial com dados agregados do mês.">
      <figure className="card example-card" data-stagger style={step(1)}>
        <ExampleHeader title="Outubro" />
        <div className="spending-example">
          <svg viewBox="0 0 100 100" className="spending-ring" aria-hidden="true">
            {exampleCategories.map((item, index) => {
              const length = (item.spent / total) * circumference;
              const gap = 2.2;
              const circle = <circle key={item.name} cx="50" cy="50" r="42" fill="none" stroke={ringColors[index]} strokeWidth="11" strokeLinecap="round"
                strokeDasharray={`${Math.max(0, length - gap)} ${circumference}`} strokeDashoffset={-offset} style={{ "--len": length, "--i": index } as CSSProperties} className="spending-arc" />;
              offset += length;
              return circle;
            })}
          </svg>
          <ul className="list spending-list">
            {exampleCategories.map((item, index) => (
              <li key={item.name} className="list-row">
                <i className="category-dot" style={{ background: ringColors[index], marginTop: 0 }} aria-hidden="true" />
                <span className="row-main row-title">{item.name}</span>
                <span className="row-value">{brl(item.spent)}</span>
              </li>
            ))}
          </ul>
        </div>
        <dl className="spending-totals">
          <div><dt>Saldo</dt><dd className="num">{brl(exampleBalance)}</dd></div>
          <div><dt>Entradas</dt><dd className="num">{brl(exampleIncome)}</dd></div>
          <div><dt>Saídas</dt><dd className="num">{brl(exampleSpent)}</dd></div>
        </dl>
      </figure>
    </Section>
  );
}

export function LimitsSection() {
  const goalSaved = exampleGoal.contributions.reduce((sum, item) => sum + item.amount, 0);
  const goalProgress = Math.round((goalSaved / exampleGoal.targetAmount) * 100);
  return (
    <Section id="metas" eyebrow="Limites e metas" title="Um limite para" accent="cada categoria." flip
      body="Informe sua renda e defina quanto quer gastar em cada categoria. O Fluxa mostra como o mês deve terminar e avisa quais categorias podem passar do combinado. Dinheiro guardado entra na meta, até por mensagem.">
      <figure className="card example-card" data-stagger style={step(1)}>
        <ExampleHeader title="Como o mês deve terminar" />
        <div className="example-category">
          <p className="row-sub">Sobra provável</p>
          <p className="limits-value num">{brl(exampleIncome - exampleSpent)}</p>
          <p className="row-sub num">Renda de {brl(exampleIncome)} e limites de {brl(examplePlanned)}</p>
        </div>
        <ul className="list">
          {exampleCategories.slice(0, 3).map(item => {
            const usage = Math.round((item.spent / item.planned) * 100);
            return (
              <li key={item.name} className="list-row credit-row">
                <span className="row-main"><span className="row-title">{item.name}</span><span className="row-sub num">{brl(item.spent)} de {brl(item.planned)}</span></span>
                {usage >= 90 ? <span className="tag is-warning">perto do limite</span> : <span className="row-value">{usage}%</span>}
                <span className="meter" aria-hidden="true"><span className={usage >= 90 ? "is-warning" : undefined} style={{ width: `${usage}%` }} /></span>
              </li>
            );
          })}
        </ul>
      </figure>
      <figure className="card example-card" data-stagger style={step(2)}>
        <ExampleHeader title="Meta" />
        <div className="list-row credit-row">
          <span className="row-main"><span className="row-title">{exampleGoal.name}</span><span className="row-sub num">{brl(goalSaved)} de {brl(exampleGoal.targetAmount)}</span></span>
          <span className="row-value">{goalProgress}%</span>
          <span className="meter" aria-hidden="true"><span style={{ width: `${goalProgress}%` }} /></span>
        </div>
      </figure>
    </Section>
  );
}

const safety = [
  { icon: EyeOff, title: "A IA não vê seus documentos", text: "Antes de qualquer descrição ir para a inteligência artificial, números de conta, agência, CPF e CNPJ são trocados por marcadores. A análise do período usa dados agregados do mês." },
  { icon: FileLock2, title: "Registros sem dado pessoal", text: "Os registros internos do sistema escondem CPF, e-mail e chaves de acesso." },
  { icon: Unplug, title: "Conexão bancária desligável", text: "Se você conectar um banco, a conexão pode ser desligada a qualquer momento na própria conta." },
  { icon: Trash2, title: "Seus dados, sua decisão", text: "Em Privacidade e dados você vê o que o Fluxa guarda e pode excluir tudo." }
];

export function SafetySection() {
  return (
    <section id="seguranca" className="landing-section landing-section-stack" aria-labelledby="seguranca-title" data-reveal-group>
      <div className="landing-section-copy" data-stagger style={step(0)}>
        <p className="landing-eyebrow"><ShieldCheck className="inline size-4 align-[-2px]" aria-hidden="true" /> Segurança</p>
        <h2 id="seguranca-title" className="landing-h2">Organizar o dinheiro <span>sem expor você.</span></h2>
      </div>
      <ul className="safety-grid">
        {safety.map((item, index) => (
          <li key={item.title} className="card safety-card" data-stagger style={step(index + 1)}>
            <span className="row-icon is-accent" aria-hidden="true"><item.icon /></span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const questions = [
  { q: "Preciso conectar minha conta do banco?", a: "Não. Você importa o arquivo do extrato (CSV, XLSX ou PDF) ou registra o gasto por mensagem no WhatsApp." },
  { q: "O Fluxa movimenta meu dinheiro?", a: "Não. O Fluxa organiza os registros que você traz. Ele não faz pagamentos nem transferências." },
  { q: "E se eu importar o mesmo extrato duas vezes?", a: "As linhas que já estão no Fluxa ficam de fora, então nada é contado em dobro." },
  { q: "Como funciona pelo WhatsApp?", a: "Você manda o gasto numa mensagem, como “gastei 32 no mercado”, do número vinculado à sua conta, e recebe a confirmação do registro." },
  { q: "A inteligência artificial pode errar?", a: "Pode. Por isso, ao importar, você revisa os valores e as categorias antes de salvar, e corrige o que precisar." },
  { q: "Consigo apagar meus dados?", a: "Sim. Em Privacidade e dados você exclui seus dados da conta." }
];

export function FaqSection() {
  return (
    <section id="perguntas" className="landing-section landing-section-stack" aria-labelledby="perguntas-title" data-reveal-group>
      <div className="landing-section-copy" data-stagger style={step(0)}>
        <p className="landing-eyebrow">Perguntas frequentes</p>
        <h2 id="perguntas-title" className="landing-h2">O que costumam <span>perguntar.</span></h2>
      </div>
      <div className="card faq" data-stagger style={step(1)}>
        {questions.map(item => (
          <details key={item.q} className="faq-item">
            <summary><span>{item.q}</span><ChevronDown aria-hidden="true" /></summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="landing-final" aria-labelledby="final-title" data-reveal-group>
      <h2 id="final-title" className="landing-h2" data-stagger style={step(0)}>Comece pelo extrato <span>deste mês.</span></h2>
      <div className="landing-ctas" data-stagger style={step(1)}>
        <Link href="/signup" className="btn btn-filled btn-large">Criar minha conta</Link>
        <Link href="/demo" className="btn btn-gray btn-large">Ver a demonstração</Link>
      </div>
      <p className="landing-cta-note" data-stagger style={step(2)}>Já tem conta? <Link href="/login" className="landing-inline-link">Entrar</Link></p>
    </section>
  );
}
