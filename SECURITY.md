# Segurança do Fluxa

## Riscos Encontrados

- Credenciais externas podiam ser consumidas sem uma camada central de validação e redaction.
- A integração Belvo inicial gerava widget sem registrar consentimento local.
- Não havia tabelas próprias para consentimentos, conexões bancárias e eventos de webhook.
- Logs diretos com `console.error` poderiam vazar contexto sensível em produção.
- Payloads de IA podiam carregar descrições completas de transações, incluindo possíveis documentos ou identificadores.
- Não havia página clara de privacidade, revogação local e exclusão de dados.

## Correções Aplicadas

- Criada camada de segurança em `src/lib/security`:
  - `env.ts`: validação de variáveis de ambiente server-side.
  - `logger.ts`: logger com redaction.
  - `redaction.ts`: masking/redaction de CPF, CNPJ, e-mail, tokens, secrets e ids sensíveis.
  - `rate-limit.ts`: rate limit em memória para ações sensíveis.
  - `crypto.ts`: hash SHA-256 e criptografia opcional com `DATA_ENCRYPTION_KEY`.
- Criada camada server-only da Belvo em `src/lib/belvo/server.ts`.
- Criadas tabelas:
  - `bank_connections`
  - `open_finance_consents`
  - `webhook_events`
- Criado webhook seguro em `/api/webhooks/belvo` com:
  - autorização via `BELVO_WEBHOOK_SECRET`
  - idempotência por `provider + eventId`
  - payload redigido
  - status de processamento
- Criada página `/privacy` com explicação de dados, finalidade, revogação e exclusão.
- Criado botão “Desconectar banco” na aba Open Finance.
- Criado botão “Excluir meus dados” na página de privacidade.
- Adicionado `sanitizeTransactionForAI` antes de enviar transações para IA.
- Adicionado rate limit em:
  - geração de widget Belvo
  - classificação por IA
  - análise financeira por IA
- Substituídos logs diretos críticos por `secureLogger`.

## Arquivos Alterados

- `prisma/schema.prisma`
- `src/lib/security/*`
- `src/lib/belvo/server.ts`
- `src/services/belvo-service.ts`
- `src/app/(dashboard)/open-finance/*`
- `src/app/api/webhooks/belvo/route.ts`
- `src/app/(dashboard)/privacy/*`
- `src/components/privacy/delete-data-button.tsx`
- `src/components/open-finance/belvo-connect-form.tsx`
- `src/app/(dashboard)/import/actions.ts`
- `src/app/(dashboard)/insights/actions.ts`
- `src/services/insights-service.ts`
- `src/services/finance-data-service.ts`
- `src/services/investment-service.ts`
- `.env.example`
- `README.md`

## Variáveis de Ambiente Necessárias

Obrigatórias para produção:

```env
DATABASE_URL=""
DIRECT_URL=""
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=""
NEXT_PUBLIC_SITE_URL=""
```

Belvo/Open Finance:

```env
BELVO_ENVIRONMENT="sandbox"
BELVO_SECRET_ID=""
BELVO_SECRET_PASSWORD=""
BELVO_WEBHOOK_SECRET=""
```

IA e mercado:

```env
GEMINI_API_KEY=""
OPENROUTER_API_KEY=""
BRAPI_TOKEN=""
```

Criptografia opcional:

```env
DATA_ENCRYPTION_KEY="minimo-32-caracteres"
```

## Políticas do Supabase

O projeto usa Prisma no backend com validação por `userId`, e as tabelas sensíveis tiveram RLS habilitado e acesso direto por `anon`/`authenticated` revogado:

- `bank_connections`
- `open_finance_consents`
- `webhook_events`
- `investment_assets`
- `category_limits`

Tabelas sensíveis existentes que devem permanecer com acesso apenas via backend:

- `transactions`
- `categories`
- `budgets`
- `goals`
- `goal_markers`
- `goal_contributions`
- `spending_plans`
- `users`

## Recomendações Futuras

- Implementar policies Supabase granulares se o client passar a ler tabelas diretamente.
- Confirmar com a Belvo o mecanismo oficial de assinatura de webhook para a conta/produto contratado e substituir o header `BELVO_WEBHOOK_SECRET` se houver assinatura HMAC oficial.
- Persistir jobs de sincronização em fila com retries e dead-letter.
- Implementar revogação remota do consentimento na Belvo quando o endpoint/escopo estiver liberado.
- Adicionar auditoria de acesso por usuário e trilha de eventos administrativos.
- Trocar rate limit em memória por Redis/KV em produção multi-instância.
- Adicionar CSP, HSTS e headers de segurança no `next.config.ts`.
- Criar testes automatizados para redaction, webhook idempotente e exclusão de dados.

## Revisão Manual Necessária

- Configurar `BELVO_WEBHOOK_SECRET` na Belvo e no Vercel.
- Conferir no painel da Belvo quais campos reais são enviados no callback/webhook para mapear `link_id` de forma definitiva.
- Validar se o ambiente Belvo deve ser `sandbox` ou `production`.
- Revisar no Supabase Security Advisor se todas as tabelas continuam sem exposição direta ao PostgREST.
- Confirmar textos jurídicos finais de LGPD/termos antes de uso público.
