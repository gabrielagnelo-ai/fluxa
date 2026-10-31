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
- Não segura a página: ela carrega por trás e aparece quando a camada some.
- Um toque ou tecla pula (a camada some em 180 ms).
- `prefers-reduced-motion`: só um fade curto (0,55 s), sem movimento.
- Alvo do encolher: o primeiro elemento visível entre `[data-abertura-alvo]`, a imagem `fluxa-logo` do cabeçalho e a `fluxa-fx` da barra lateral (aí só o símbolo pousa e a palavra apaga). Sem nenhum, vai para o canto superior esquerdo. Para fixar o alvo, ponha `data-abertura-alvo` no logo do cabeçalho.

## Arquivos
- `abertura-logo.tsx`: componente; renderiza o script inline.
- `abertura-logo-motor.ts`: **gerado**, não editar à mão. Fonte e ferramentas no projeto de motion `~/Documents/Projetos/fluxa-abertura-logo` (`node tools/integracao.mjs <pasta do app>`).
- `abertura-logo.css`: estilo crítico (`html.abertura-pendente`, `html.abertura-ativa`).
- `public/branding/fluxa-logo.svg`: logo vetorial, fiel ao PNG (sobreposição no projeto de motion).
