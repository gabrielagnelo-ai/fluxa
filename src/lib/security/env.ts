import { z } from "zod";
import { secureLogger } from "@/lib/security/logger";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  BRAPI_TOKEN: z.string().min(1).optional(),
  BELVO_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
  BELVO_SECRET_ID: z.string().min(1).optional(),
  BELVO_SECRET_PASSWORD: z.string().min(1).optional(),
  BELVO_WEBHOOK_SECRET: z.string().min(1).optional(),
  DATA_ENCRYPTION_KEY: z.string().min(32).optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().min(1).optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  WHATSAPP_DEFAULT_USER_EMAIL: z.string().email().optional()
});

let cachedEnv: z.infer<typeof serverEnvSchema> | null = null;

export function getServerEnv() {
  if (cachedEnv) return cachedEnv;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    secureLogger.error("Invalid server environment", { issues: parsed.error.issues });
    throw new Error("Configuração de ambiente inválida.");
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}

export function requireServerEnv<K extends keyof z.infer<typeof serverEnvSchema>>(key: K) {
  const value = getServerEnv()[key];
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${String(key)}`);
  return value;
}
