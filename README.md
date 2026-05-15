# Fluxa

Sistema web de organização financeira pessoal. Entenda para onde seu dinheiro vai.

## Stack

- Next.js 15 com App Router
- React 19 e TypeScript
- TailwindCSS
- Supabase Auth
- Prisma ORM
- PostgreSQL
- Recharts
- Importação CSV/XLSX com arquitetura preparada para PDF por banco

## Como rodar

1. Instale as dependências:

```bash
pnpm install
```

2. Copie as variáveis de ambiente:

```bash
cp .env.example .env
```

3. Configure `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Para habilitar IA externa, crie uma chave no OpenRouter e preencha:

```bash
OPENROUTER_API_KEY="sua-chave"
OPENROUTER_MODEL="openrouter/free"
```

Sem essa chave, a aba Inteligência usa uma análise local baseada nos mesmos dados agregados.

4. Gere o Prisma Client e aplique as migrations:

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

5. Popule dados iniciais:

```bash
pnpm db:seed
```

6. Inicie o app:

```bash
pnpm dev
```

Abra `http://localhost:3000`.

## Estrutura

- `src/app`: rotas, layouts e Server Actions
- `src/components`: UI, layout, autenticação, dashboard e importação
- `src/services`: parsing de extratos, categorização e agregações financeiras
- `src/lib`: Supabase, Prisma e helpers
- `src/types`: tipos compartilhados
- `prisma`: schema PostgreSQL e seed

## Decisões técnicas

- Supabase Auth cuida de login, cadastro, recuperação de senha e sessão via middleware.
- Prisma modela dados próprios da aplicação, referenciando o usuário autenticado pelo `supabaseId`.
- Server Actions são usadas para autenticação e persistência de importações.
- A categorização automática fica isolada em `category-service.ts`, o que facilita trocar regras por IA no futuro.
- O importador faz preview editável antes de salvar, reduzindo risco de dados classificados de forma errada.
- PDF exige parser específico por banco; a arquitetura já separa a camada de importação para receber esses adaptadores.

## Segurança

- Não exponha `SUPABASE_SERVICE_ROLE_KEY` no client.
- Use RLS no Supabase para tabelas espelhadas ou APIs públicas.
- Valide payloads no servidor com Zod antes de persistir.
- Mantenha credenciais apenas em `.env`.
- A análise de IA envia apenas dados agregados do mês, sem descrições individuais de transações.

## Próximos passos previstos

- Adaptadores PDF por banco.
- Integração Open Finance.
- IA para análise de padrões e recomendações.
- Previsão de gastos recorrentes.
- Notificações por orçamento, meta e saldo.
- App mobile compartilhando regras de domínio.
