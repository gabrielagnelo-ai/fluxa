"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createBelvoWidgetUrl, revokeBelvoConnections } from "@/services/belvo-service";
import { getCurrentUserId } from "@/services/finance-data-service";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { secureLogger } from "@/lib/security/logger";

const connectSchema = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo."),
  cpf: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 11, "Informe um CPF com 11 dígitos."),
  consentDays: z.coerce.number().pipe(z.union([z.literal(92), z.literal(183), z.literal(275), z.literal(366)]))
});

export async function generateBelvoWidget(formData: FormData) {
  const parsed = connectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  try {
    const userId = await getCurrentUserId();
    if (!userId) return { error: "Faça login para conectar banco." };
    const rateLimit = checkRateLimit(`belvo-widget:${userId}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!rateLimit.allowed) return { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };

    const widgetUrl = await createBelvoWidgetUrl({ ...parsed.data, userId });
    return { success: "Token criado. Abra o widget para testar a conexão.", widgetUrl };
  } catch (error) {
    secureLogger.error("Belvo widget action failed", { error });
    return {
      error: error instanceof Error ? error.message : "Não foi possível iniciar a conexão com a Belvo."
    };
  }
}

export async function connectBelvoAndRedirect(formData: FormData) {
  const parsed = connectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  let widgetUrl: string | null = null;
  try {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const rateLimit = checkRateLimit(`belvo-widget:${userId}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!rateLimit.allowed) return;

    widgetUrl = await createBelvoWidgetUrl({ ...parsed.data, userId });
  } catch (error) {
    secureLogger.error("Belvo direct redirect failed", { error });
  }

  if (widgetUrl) redirect(widgetUrl);
}

export async function disconnectBelvoBank() {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para desconectar banco." };

  await revokeBelvoConnections(userId);
  return { success: "Banco desconectado localmente. Novas sincronizações foram bloqueadas." };
}
