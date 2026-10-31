# Abertura do logo (Correnteza)

Escolhida pelo Gabriel em 2026-10-30. Três correntes de água correm pelas faixas do "F" e enchem o logo; a palavra entra no sentido do fluxo; o logo encolhe até o cabeçalho. Até 1 s.

## Onde montar
Uma linha no layout raiz (`src/app/layout.tsx`), como **primeiro filho do `<body>`**:

```tsx
import { AberturaLogo } from "@/components/brand/abertura-logo";

<body>
  <AberturaLogo />
  <ThemeProvider>{children}</ThemeProvider>
</body>
```

## Como se comporta
- Toca uma vez por sessão (`sessionStorage`, chave `fluxa:abertura-vista`). Para ver de novo: `?replay` na URL.
- Não segura a página: ela carrega por trás e aparece quando a camada some. Se a abertura não puder entrar em 820 ms (motor e PNG; primeira visita em rede lenta), ela desiste e a página aparece. Se entrar tarde, pula a água e começa no logo inteiro, para fechar em até cerca de 1,1 s desde a primeira pintura.
- Um toque ou tecla pula (a camada some em 180 ms).
- `prefers-reduced-motion`: só um fade curto (0,55 s), sem movimento.
- Alvo do encolher: o primeiro elemento visível entre `[data-abertura-alvo]`, a imagem `fluxa-logo` do cabeçalho e a `fluxa-fx` da barra lateral (aí só o símbolo pousa e a palavra apaga). Sem nenhum, vai para o canto superior esquerdo. Para fixar o alvo, ponha `data-abertura-alvo` no logo do cabeçalho.

## Arquivos
- `abertura-logo.tsx`: componente; põe inline só o porteiro (< 1 KB) e aponta para o motor.
- `abertura-logo-versao.ts` e `public/abertura/motor.<hash>.js`: **gerados**, não editar à mão. O hash no nome muda quando o conteúdo muda. O motor leva o PNG original embutido (base64), por isso tem cerca de 54 KB comprimido; o componente declara o preload dele no HTML, para baixar junto com o JS da página. Fonte e ferramentas no projeto de motion `~/Documents/Projetos/fluxa-abertura-logo` (`node tools/integracao.mjs <pasta do app>`).
- `public/branding/fluxa-logo.svg`: logo vetorial, fiel ao PNG (sobreposição no projeto de motion). As camadas da abertura saem dele.

## Desempenho
Depois de começar, tudo anda no compositor (transform e opacity por Web Animations): as tarefas longas da própria página durante o carregamento não travam a animação.

## Cache (pendente de decisão)
O motor só é baixado quando a abertura vai tocar (uma vez por sessão). Para cache longo, falta uma regra de header (configuração de produção, precisa do ok do Gabriel), por exemplo em `next.config.ts`:

```ts
async headers() {
  return [{ source: "/abertura/:arquivo*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }];
}
```
Sem ela, o navegador revalida o arquivo (resposta 304, sem baixar de novo).
