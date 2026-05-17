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

Para habilitar cotações de mercado na aba Investimentos, crie uma chave em `brapi.dev` e preencha:

```bash
BRAPI_TOKEN="sua-chave"
```

Sem essa chave, o Fluxa tenta consultar as cotações públicas e mostra uma mensagem caso o limite da API seja atingido.

Para testar Open Finance com Belvo Hosted Widget, configure:

```bash
ENABLE_BELVO="true"
BELVO_ENVIRONMENT="sandbox"
BELVO_SECRET_ID="seu-secret-id"
BELVO_SECRET_PASSWORD="seu-secret-password"
BELVO_WEBHOOK_SECRET="um-segredo-para-validar-webhook"
```

Use `BELVO_ENVIRONMENT="production"` apenas quando a conta Belvo estiver certificada/liberada para produção.

Para testar registro de gastos por WhatsApp com Twilio Sandbox:

```bash
WHATSAPP_PROVIDER="twilio"
WHATSAPP_DEFAULT_USER_EMAIL="email-do-usuario-no-fluxa"
TWILIO_ACCOUNT_SID="seu-account-sid"
TWILIO_AUTH_TOKEN="seu-auth-token"
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
```

Webhook da Twilio:

```text
https://seu-dominio/api/whatsapp/webhook
```

Configure como `POST` em "When a message comes in". O Twilio envia `application/x-www-form-urlencoded` e o Fluxa responde com TwiML.
Em produção, `TWILIO_AUTH_TOKEN` é obrigatório para validar a assinatura `X-Twilio-Signature`.

Para testar registro de gastos por WhatsApp Cloud API da Meta:

```bash
WHATSAPP_VERIFY_TOKEN="um-token-que-voce-cria"
WHATSAPP_ACCESS_TOKEN="token-temporario-ou-permanente-da-meta"
WHATSAPP_PHONE_NUMBER_ID="id-do-numero-de-teste"
WHATSAPP_DEFAULT_USER_EMAIL="email-do-usuario-no-fluxa"
```

Webhook da Meta:

```text
https://seu-dominio/api/whatsapp/webhook
```

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
