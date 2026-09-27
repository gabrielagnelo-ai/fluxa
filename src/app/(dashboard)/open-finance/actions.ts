"use server";

import { z } from "zod";
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
    return { success: "Continue no provedor para revisar o consentimento.", widgetUrl };
  } catch (error) {
    secureLogger.error("Belvo widget action failed", { error });
    return {
      error: "Não foi possível abrir o provedor agora. Confira os dados informados e tente novamente em instantes."
    };
  }
}

export async function disconnectBelvoBank() {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para desconectar banco." };

  try {
    await revokeBelvoConnections(userId);
    return { success: "Os registros de conexão no Fluxa foram desativados. Revogue também o consentimento no banco ou no provedor." };
  } catch (error) {
    secureLogger.error("Belvo disconnect failed", { error });
    return { error: "Não foi possível desativar a conexão no Fluxa. Tente novamente em instantes." };
  }
}
