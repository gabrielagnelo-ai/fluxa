# Fluxa: instruções para agentes

Finanças pessoais do Gabriel: extratos, transações, orçamento, metas e Open Finance (Belvo).
Produção: https://fluxa-pi.vercel.app. A Vercel publica o `main` sozinha: **`main` é produção**.

## Antes de mudar algo
Consulte a documentação no Fluxa Vault (no Mac do Gabriel: `~/Desktop/Fluxa Vault/`):

1. `05 Gestão/Decisões do projeto.md`: decisões e rejeições vigentes.
2. `03 Design/Identidade e movimento.md`: identidade visual e regras de interação.
3. A nota da tela afetada em `02 Telas/`.
4. `05 Gestão/Estado da entrega.md`: o que já foi verificado e o que aguarda revisão.

Registre feedback novo do Gabriel no Fluxa Vault com a fala dele como evidência, a decisão vigente, o estado da implementação e os arquivos envolvidos (modelo: `07 Modelos/Modelo de decisão.md`). Separe preferência do Gabriel de interpretação do agente. Testes aprovados não significam aprovação visual. A instrução mais recente do Gabriel vence o histórico.

## Stack
Next.js 15.5 (App Router), React 19, TypeScript, Tailwind 3, Prisma 6 com PostgreSQL no Supabase, Supabase Auth (`@supabase/ssr`), Recharts, Three.js e React Three Fiber. Gerenciador de pacotes: pnpm.

## Comandos
```sh
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build        # roda prisma generate antes do next build
```
Antes de dizer que terminou: `lint`, `typecheck`, `test` e `build` passando.

## Segurança (detalhe em `SECURITY.md`)
- Supabase Auth cuida da sessão; o Prisma referencia o usuário por `supabaseId`.
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no client. RLS nas tabelas espelhadas ou expostas.
- Logs pelo `secureLogger` (`src/lib/security`), nunca `console.error` com dado sensível.
- Transação só vai para IA depois de `sanitizeTransactionForAI`.
- Belvo só pela camada server-only (`src/lib/belvo/server.ts`).
- Nunca abrir, copiar ou citar `.env`.

## Banco
- O conector Supabase dos agentes é somente leitura, travado no projeto `eaeonhkohvizqpsfoflk`.
- `pnpm prisma:migrate` cria e aplica migração: só com o ok do Gabriel.

## Design
- Identidade: azul-marinho profundo, azul e ciano, textos claros. Marca sem moldura circular desnecessária.
- Sem barra de rolagem dentro de cartão; não repetir listas e totais sem função; detalhes de gráfico fora do círculo; tutorial guiado opcional, com pular; respeitar "reduzir movimento".
- Gosto geral do Gabriel e checklist de usabilidade: `~/Desktop/Vault Agnelo/design/` (só leitura).

## Git
Um branch por tarefa; nunca commit direto no `main`. Commits em inglês: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`.
