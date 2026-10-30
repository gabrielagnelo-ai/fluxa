import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { LandingChrome } from "@/components/public/landing-chrome";
import { PublicFooter } from "@/components/public/public-footer";
import { SceneMode } from "@/components/public/scene-mode";
import { exampleCategories, exampleIncome, examplePlanned, exampleSpent, exampleStatement, formatAmount } from "@/components/public/example-month";

export const metadata: Metadata = {
  title: { absolute: "Fluxa | Seu dinheiro, explicado" },
  description: "Importe o extrato do seu banco. O Fluxa separa cada gasto por categoria e mostra para onde o mês foi."
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
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--cyan)] focus:px-4 focus:py-3 focus:text-[var(--cyan-ink)]">Pular para o conteúdo</a>
      <LandingChrome />

      <main id="conteudo">
        <section data-chapter="0" aria-labelledby="hero-title" className="relative flex min-h-[100svh] flex-col justify-end pb-12 pt-28 lg:justify-center lg:pb-16">
          <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
            <svg viewBox="30 34 70 62" className="intro-mark mb-6 h-12 w-14 md:h-14 md:w-16" aria-hidden="true">
              <path d="M34 88C44 61 65 43 98 34C76 49 58 65 45 96C40 96 36 93 34 88Z" />
              <path d="M42 75C58 64 75 55 99 52L79 67L44 80L42 75Z" />
            </svg>
            <p className="mono-label intro-fade" style={vars({ "--i": 0 })}>Finanças pessoais · Fluxa</p>
            <h1 id="hero-title" className="display mt-4 text-[clamp(60px,13vw,210px)]">
              <span className="intro-word" style={vars({ "--i": 0 })}>Seu</span>{" "}
              <span className="intro-word" style={vars({ "--i": 1 })}>dinheiro,</span>
              <br />
              <span className="intro-word text-cyan" style={vars({ "--i": 2 })}>explicado.</span>
            </h1>
            <div className="copy-plate mt-8 max-w-[44ch] lg:mt-10">
              <p className="intro-fade text-[17px] leading-relaxed text-2 md:text-lg" style={vars({ "--i": 1 })}>
                Importe o extrato do seu banco. O Fluxa separa cada gasto por categoria e mostra para onde o mês foi.
              </p>
              <div className="intro-fade mt-7 flex flex-wrap items-center gap-x-6 gap-y-3" style={vars({ "--i": 2 })}>
                <Link href="/signup" className="btn-cyan">
                  Começar com meus dados
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link href="/demo" className="link-quiet">Ver a demonstração</Link>
              </div>
            </div>
          </div>
          <div className="mx-auto mt-12 hidden w-full max-w-[1400px] px-5 md:block md:px-10 lg:mt-20">
            <div className="intro-horizon h-px w-full bg-[var(--cyan)] opacity-60" />
            <nav aria-label="Capítulos" className="intro-fade mt-4 flex gap-8" style={vars({ "--i": 3 })}>
              {chapters.map((chapter, index) => (
                <a key={chapter.id} href={`#${chapter.id}`} className="mono-label inline-flex min-h-11 items-center gap-2 transition-colors hover:text-[var(--text)]">
                  <span className="text-cyan">{String(index + 1).padStart(2, "0")}</span>
                  {chapter.label}
                </a>
              ))}
            </nav>
          </div>
        </section>

        <Chapter index={1} id="importar" title={<>Você traz <span className="text-cyan">o extrato.</span></>}
          body="Envie o arquivo do banco em CSV, XLSX ou PDF. O Fluxa lê cada lançamento e deixa de fora as linhas que já foram importadas.">
          <StatementCloseUp />
        </Chapter>

        <Chapter index={2} id="categorizar" title={<>Cada gasto no <span className="text-cyan">seu lugar.</span></>}
          body="Regras com palavras-chave e sugestões automáticas separam moradia, mercado e transporte. Você confere e corrige só o que precisar.">
          <CategoryCloseUp />
        </Chapter>

        <Chapter index={3} id="para-onde-vai" title={<>Para onde <span className="text-cyan">o mês foi.</span></>}
          body="Entradas, saídas e o peso de cada categoria, com o valor ao lado de cada uma. Dá para ler sem adivinhar.">
          <SpendingCloseUp />
        </Chapter>

        <Chapter index={4} id="metas" title={<>Um limite para <span className="text-cyan">cada categoria.</span></>}
          body="Informe sua renda, defina quanto quer gastar em cada categoria e veja o que sobra para as suas metas antes de o mês acabar.">
          <LimitsCloseUp />
        </Chapter>

        <section data-chapter="5" aria-labelledby="final-title" className="relative flex min-h-[100svh] flex-col justify-center py-28">
          <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
            <div data-reveal className="copy-plate max-w-[640px]">
              <p className="mono-label">Seu mês, com dados seus</p>
              <h2 id="final-title" className="display mt-4 text-[clamp(52px,8vw,128px)]">
                Comece pelo extrato <span className="text-cyan">deste mês.</span>
              </h2>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link href="/signup" className="btn-cyan">
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
              <p className="mono-label"><span className="text-cyan">{String(index).padStart(2, "0")}</span> / 04 · {chapters[index - 1].label}</p>
              <h2 id={`${id}-title`} className="display mt-4 text-[clamp(46px,6.4vw,104px)]">{title}</h2>
              <p className="mt-5 max-w-[42ch] text-[17px] leading-relaxed text-2">{body}</p>
            </div>
            <div data-reveal className="mt-8 md:mt-10" style={vars({ "--i": 1 })}>{children}</div>
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
        {exampleStatement.map((row) => (
          <li key={row.raw} className="grid grid-cols-[38px_1fr_auto] items-baseline gap-x-3 px-4 py-2.5 sm:grid-cols-[44px_1fr_auto] sm:px-5">
            <span className="text-2">{row.day}</span>
            <span className="min-w-0 break-words">{row.raw}</span>
            <span className={row.amount > 0 ? "text-[var(--gain)]" : "text-[var(--text)]"}>{row.amount > 0 ? "+" : "−"}{formatAmount(row.amount)}</span>
          </li>
        ))}
        <li className="grid grid-cols-[38px_1fr_auto] items-baseline gap-x-3 bg-[var(--cyan-soft)] px-4 py-2.5 sm:grid-cols-[44px_1fr_auto] sm:px-5">
          <span className="text-2">{duplicate.day}</span>
          <span className="min-w-0 break-words text-2 line-through">{duplicate.raw}</span>
          <span className="text-cyan">repetida</span>
        </li>
      </ol>
      <figcaption className="border-t border-[var(--line)] px-5 py-3 text-sm text-2">6 lançamentos lidos, 1 linha repetida fica de fora.</figcaption>
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
          <span data-chip className="num inline-flex min-h-8 items-center gap-2 rounded-full bg-[var(--cyan)] px-3 text-sm font-medium text-[var(--cyan-ink)]">Mercado</span>
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
      <ExampleTag>Saídas de outubro</ExampleTag>
      <div className="flex items-baseline justify-between gap-4 px-5 pt-5">
        <p className="text-sm text-2">Total do mês</p>
        <p className="num text-2xl font-medium">R$ {formatAmount(exampleSpent)}</p>
      </div>
      <ul className="space-y-4 px-5 pb-6 pt-5">
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
              <div data-bar className="h-full rounded-full" style={vars({ "--w": item.spent / largest, "--i": index, background: index === 0 ? "var(--cyan)" : "rgb(92 225 255 / .55)" })} />
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
                <span>{item.name}{near && <span className="mono-label ml-3 !text-[11px] text-cyan">perto do limite</span>}</span>
                <span className="num">R$ {formatAmount(item.spent)} <span className="text-2">de {formatAmount(item.planned)}</span></span>
              </div>
              <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-[var(--line)]" role="progressbar" aria-label={`Limite de ${item.name} usado`} aria-valuemin={0} aria-valuemax={item.planned} aria-valuenow={item.spent}>
                <div data-bar className="h-full rounded-full" style={vars({ "--w": used, "--i": index, background: near ? "var(--cyan)" : "rgb(92 225 255 / .5)" })} />
              </div>
            </li>
          );
        })}
      </ul>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-[var(--line)] px-5 py-4 text-sm">
        <span className="text-2">Renda de R$ {formatAmount(exampleIncome)} menos os limites</span>
        <span className="num text-cyan">sobram R$ {formatAmount(exampleIncome - examplePlanned)}</span>
      </figcaption>
    </figure>
  );
}
