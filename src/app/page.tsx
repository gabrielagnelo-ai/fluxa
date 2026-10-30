import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { LandingChrome } from "@/components/public/landing-chrome";
import { PublicFooter } from "@/components/public/public-footer";
import { SceneMode } from "@/components/public/scene-mode";
import { exampleBalance, exampleCategories, exampleOpening, exampleIncome, examplePlanned, exampleSpent, exampleStatement, formatAmount } from "@/components/public/example-month";

export const metadata: Metadata = {
  title: { absolute: "Fluxa | Seu dinheiro, explicado" },
  description: "Importe o extrato do seu banco ou mande o gasto por mensagem no WhatsApp. O Fluxa separa cada gasto por categoria e mostra para onde o mês foi."
};

const chapters = [
  { id: "importar", label: "Importar" },
  { id: "categorizar", label: "Categorizar" },
  { id: "para-onde-vai", label: "Para onde vai" },
  { id: "metas", label: "Metas" }
];

const vars = (values: Record<string, string | number>) => values as CSSProperties;

export default function Home() {
  return (
    <div className="public-site">
      <SceneMode mode="landing" />
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--brand)] focus:px-4 focus:py-3 focus:text-[var(--brand-ink)]">Pular para o conteúdo</a>
      <LandingChrome />

      <main id="conteudo">
        <section data-chapter="0" aria-labelledby="hero-title" className="relative flex min-h-[100svh] flex-col justify-end pb-12 pt-28 lg:justify-center lg:pb-16">
          <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
            {/* Brand opening: the real logo, whole, revealed in under 1 s (principle 17). */}
            <Image src="/branding/fluxa-logo.png" alt="Fluxa" width={420} height={160} priority className="intro-logo mb-6 h-auto w-[168px] md:w-[240px]" />
            <p className="mono-label intro-fade" style={vars({ "--i": 0 })}>Finanças pessoais</p>
            <h1 id="hero-title" className="display mt-4 text-[clamp(60px,13vw,210px)]">
              <span className="intro-word" style={vars({ "--i": 0 })}>Seu</span>{" "}
              <span className="intro-word" style={vars({ "--i": 1 })}>dinheiro,</span>
              <br />
              <span className="intro-word text-brand" style={vars({ "--i": 2 })}>explicado.</span>
            </h1>
            <div className="copy-plate -mt-6 max-w-[44ch] md:mt-8 lg:mt-10">
              <p className="intro-fade text-[17px] leading-relaxed text-2 md:text-lg" style={vars({ "--i": 1 })}>
                Importe o extrato do seu banco ou mande o gasto por mensagem no WhatsApp. O Fluxa separa cada gasto por categoria e mostra para onde o mês foi.
              </p>
              <div className="intro-fade mt-7 flex flex-wrap items-center gap-x-6 gap-y-3" style={vars({ "--i": 2 })}>
                <Link href="/signup" className="btn-brand">
                  Começar com meus dados
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link href="/demo" className="link-quiet">Ver a demonstração, sem criar conta</Link>
              </div>
            </div>
          </div>
          <div className="mx-auto mt-12 hidden w-full max-w-[1400px] px-5 md:block md:px-10 lg:mt-20">
            <div className="intro-horizon h-px w-full bg-[var(--brand)] opacity-60" />
            <nav aria-label="Capítulos" className="intro-fade mt-4 flex gap-8" style={vars({ "--i": 3 })}>
              {chapters.map((chapter, index) => (
                <a key={chapter.id} href={`#${chapter.id}`} className="mono-label inline-flex min-h-11 items-center gap-2 transition-colors hover:text-[var(--text)]">
                  <span className="text-brand">{String(index + 1).padStart(2, "0")}</span>
                  {chapter.label}
                </a>
              ))}
            </nav>
          </div>
        </section>

        <Chapter index={1} id="importar" title={<>Você traz <span className="text-brand">o extrato.</span></>}
          body="Envie o arquivo do banco em CSV, XLSX ou PDF; linhas já importadas ficam de fora. No dia a dia, mande o gasto por mensagem no WhatsApp, com o número vinculado à sua conta.">
          <StatementCloseUp />
          <WhatsAppCloseUp />
        </Chapter>

        <Chapter index={2} id="categorizar" title={<>Cada gasto no <span className="text-brand">seu lugar.</span></>}
          body="Regras com palavras-chave e sugestões da inteligência artificial separam moradia, mercado e transporte. Você confere e corrige só o que precisar.">
          <CategoryCloseUp />
        </Chapter>

        <Chapter index={3} id="para-onde-vai" title={<>Para onde <span className="text-brand">o mês foi.</span></>}
          body="Saldo, entradas, saídas e o peso de cada categoria, com o valor ao lado, mais uma análise do período feita pela inteligência artificial.">
          <SpendingCloseUp />
        </Chapter>

        <Chapter index={4} id="metas" title={<>Um limite para <span className="text-brand">cada categoria.</span></>}
          body="Informe sua renda e defina quanto quer gastar em cada categoria. O Fluxa mostra como o mês deve terminar e avisa quais categorias podem passar do combinado. Dinheiro guardado entra na meta, até por mensagem.">
          <LimitsCloseUp />
        </Chapter>

        <section data-chapter="5" aria-labelledby="final-title" className="relative flex min-h-[100svh] flex-col justify-center py-28">
          <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
            <div data-reveal className="copy-plate max-w-[640px]">
              <p className="mono-label">Seu mês, com dados seus</p>
              <h2 id="final-title" className="display mt-4 text-[clamp(52px,8vw,128px)]">
                Comece pelo extrato <span className="text-brand">deste mês.</span>
              </h2>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link href="/signup" className="btn-brand">
                  Criar minha conta
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link href="/login" className="link-quiet">Já tenho conta</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

function Chapter({ index, id, title, body, children }: { index: number; id: string; title: ReactNode; body: string; children: ReactNode }) {
  return (
    <section id={id} data-chapter={index} aria-labelledby={`${id}-title`} className="relative pb-20 pt-[44svh] md:min-h-[150vh] md:py-0">
      <div className="md:sticky md:top-0 md:flex md:h-[100svh] md:items-center">
        <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
          <div className="max-w-[580px]">
            <div data-reveal className="copy-plate">
              <p className="mono-label"><span className="text-brand">{String(index).padStart(2, "0")}</span> / 04 · {chapters[index - 1].label}</p>
              <h2 id={`${id}-title`} className="display mt-3 text-[clamp(46px,6vw,96px)]">{title}</h2>
              <p className="mt-4 max-w-[44ch] text-[17px] leading-relaxed text-2">{body}</p>
            </div>
            <div data-reveal className="mt-6 md:mt-7" style={vars({ "--i": 1 })}>{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExampleTag({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 sm:px-5">
      <p className="mono-label whitespace-nowrap !text-[11px] !tracking-[0.08em] text-[var(--text)] sm:!tracking-[0.14em]">{children}</p>
      <p className="mono-label whitespace-nowrap !text-[11px] !tracking-[0.08em] sm:!tracking-[0.14em]"><span className="sm:hidden">Fictício</span><span className="hidden sm:inline">Dados fictícios</span></p>
    </div>
  );
}

function StatementCloseUp() {
  const duplicate = exampleStatement[2];
  return (
    <figure className="detail overflow-hidden">
      <ExampleTag>extrato-outubro.csv</ExampleTag>
      <ol className="num divide-y divide-[var(--line)] text-[12px] sm:text-sm">
        {exampleStatement.slice(0, 4).map((row) => (
          <li key={row.raw} className="grid grid-cols-[38px_1fr_auto] items-baseline gap-x-3 px-4 py-2.5 sm:grid-cols-[44px_1fr_auto] sm:px-5">
            <span className="text-2">{row.day}</span>
            <span className="min-w-0 break-words">{row.raw}</span>
            <span className={row.amount > 0 ? "text-[var(--gain)]" : "text-[var(--text)]"}>{row.amount > 0 ? "+" : "−"}{formatAmount(row.amount)}</span>
          </li>
        ))}
        <li className="grid grid-cols-[38px_1fr_auto] items-baseline gap-x-3 bg-[var(--brand-soft)] px-4 py-2.5 sm:grid-cols-[44px_1fr_auto] sm:px-5">
          <span className="text-2">{duplicate.day}</span>
          <span className="min-w-0 break-words text-2 line-through">{duplicate.raw}</span>
          <span className="text-brand">repetida</span>
        </li>
      </ol>
      <figcaption className="border-t border-[var(--line)] px-5 py-3 text-sm text-2">Lançamentos lidos; a linha repetida fica de fora.</figcaption>
    </figure>
  );
}

// Mirrors what src/lib/whatsapp does: text message in, transaction saved, confirmation reply.
function WhatsAppCloseUp() {
  return (
    <figure className="detail mt-3 overflow-hidden" aria-label="Exemplo de registro por WhatsApp">
      <div className="space-y-2 px-4 py-3 text-[14px] leading-snug sm:px-5">
        <p className="mono-label !text-[11px]">WhatsApp · exemplo</p>
        <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-[var(--brand)] px-3.5 py-2 text-[var(--brand-ink)]">gastei 32 no mercado</p>
        <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-md border border-[var(--line)] bg-[var(--ink-2)] px-3.5 py-2">Registrado no Fluxa: gasto de <span className="num">R$ 32,00</span> em Mercado (<span className="num">30/10</span>).</p>
      </div>
    </figure>
  );
}

function CategoryCloseUp() {
  const rows = exampleStatement.slice(1, 4);
  return (
    <figure className="detail overflow-hidden">
      <ExampleTag>Categorias</ExampleTag>
      <div className="px-5 py-6">
        <p className="num text-[13px] text-2">07/10 · COMPRA DEB</p>
        <p className="mt-1 text-[clamp(22px,2.4vw,30px)] font-semibold leading-tight">Mercado do bairro</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="num text-xl">−R$ 620,00</span>
          <span data-chip className="num inline-flex min-h-8 items-center gap-2 rounded-full bg-[var(--brand)] px-3 text-sm font-medium text-[var(--brand-ink)]">Mercado</span>
          <span data-chip className="mono-label !text-[11px]">regra: contém “mercado”</span>
        </div>
      </div>
      <ul className="divide-y divide-[var(--line)] border-t border-[var(--line)] text-sm">
        {rows.filter((row) => row.category !== "Mercado").map((row) => (
          <li key={row.raw} className="flex items-center justify-between gap-3 px-5 py-3">
            <span className="num min-w-0 break-words text-[12px] text-2 sm:text-[13px]">{row.raw}</span>
            <span className="shrink-0 rounded-full border border-[var(--line-strong)] px-3 py-1 text-[13px]">{row.category}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

function SpendingCloseUp() {
  const largest = Math.max(...exampleCategories.map((item) => item.spent));
  return (
    <figure className="detail overflow-hidden">
      <ExampleTag>Outubro</ExampleTag>
      <dl className="grid grid-cols-3 border-b border-[var(--line)] text-sm">
        <div className="border-r border-[var(--line)] px-4 py-3 sm:px-5"><dt className="text-2">Entradas</dt><dd className="num mt-1 text-[var(--gain)]">{formatAmount(exampleIncome)}</dd></div>
        <div className="border-r border-[var(--line)] px-4 py-3 sm:px-5"><dt className="text-2">Saídas</dt><dd className="num mt-1">{formatAmount(exampleSpent)}</dd></div>
        <div className="px-4 py-3 sm:px-5"><dt className="text-2">Saldo no fim do mês</dt><dd className="num mt-1">{formatAmount(exampleBalance)}</dd></div>
      </dl>
      <p className="border-b border-[var(--line)] px-4 py-2.5 text-sm text-2 sm:px-5">O mês começou com <span className="num text-[var(--text)]">R$ {formatAmount(exampleOpening)}</span>.</p>
      <p className="px-5 pt-4 text-sm text-2">Saídas por categoria, em R$</p>
      <ul className="space-y-3.5 px-5 pb-5 pt-3">
        {exampleCategories.map((item, index) => (
          <li key={item.name}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span>{item.name}</span>
              <span className="num">
                R$ {formatAmount(item.spent)}
                <span className="ml-2 text-2">{Math.round((item.spent / exampleSpent) * 100)}%</span>
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
              <div data-bar className="h-full rounded-full" style={vars({ "--w": item.spent / largest, "--i": index, background: index === 0 ? "var(--brand)" : "rgb(16 131 243 / .6)" })} />
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}

function LimitsCloseUp() {
  const shown = exampleCategories.filter((item) => ["Moradia", "Mercado", "Lazer"].includes(item.name));
  return (
    <figure className="detail overflow-hidden">
      <ExampleTag>Limites de outubro</ExampleTag>
      <ul className="space-y-5 px-5 py-6">
        {shown.map((item, index) => {
          const used = item.spent / item.planned;
          const near = used >= 0.9;
          return (
            <li key={item.name}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
                <span>{item.name}{near && <span className="mono-label ml-3 !text-[11px] text-brand">perto do limite</span>}</span>
                <span className="num">R$ {formatAmount(item.spent)} <span className="text-2">de {formatAmount(item.planned)}</span></span>
              </div>
              <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-[var(--line)]" role="progressbar" aria-label={`Limite de ${item.name} usado`} aria-valuemin={0} aria-valuemax={item.planned} aria-valuenow={item.spent}>
                <div data-bar className="h-full rounded-full" style={vars({ "--w": used, "--i": index, background: near ? "var(--brand)" : "rgb(16 131 243 / .6)" })} />
              </div>
            </li>
          );
        })}
      </ul>
      <figcaption className="border-t border-[var(--line)] px-5 py-4 text-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span>Como o mês deve terminar</span>
          <span className="num text-brand">sobra provável R$ {formatAmount(exampleIncome - examplePlanned)}</span>
        </div>
        <p className="mt-1 text-2">Previsão: renda de R$ {formatAmount(exampleIncome)} menos R$ {formatAmount(examplePlanned)} de gastos previstos.</p>
      </figcaption>
    </figure>
  );
}
