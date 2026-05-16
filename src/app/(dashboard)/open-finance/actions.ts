"use server";

import { z } from "zod";
import { createBelvoWidgetUrl } from "@/services/belvo-service";

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
    const widgetUrl = await createBelvoWidgetUrl(parsed.data);
    return { success: "Token criado. Abra o widget para testar a conexão.", widgetUrl };
  } catch (error) {
    console.error(error);
    return {
      error: error instanceof Error ? error.message : "Não foi possível iniciar a conexão com a Belvo."
    };
  }
}
