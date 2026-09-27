"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearLocalAuthCookies, createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { secureLogger } from "@/lib/security/logger";
import { getCurrentUserId } from "@/services/finance-data-service";

export async function deleteMyData(formData: FormData) {
  if (formData.get("confirmation") !== "APAGAR MEUS DADOS" || formData.get("acknowledged") !== "on") {
    return { error: "Confirme que leu o alcance da exclusão e digite APAGAR MEUS DADOS para continuar." };
  }
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para excluir seus dados." };

  try {
    await prisma.user.delete({
      where: { id: userId }
    });
  } catch (error) {
    secureLogger.error("User data deletion failed", { error });
    return { error: "Não foi possível excluir seus dados agora." };
  }
  try { const supabase = await createClient(); await supabase.auth.signOut({ scope: "local" }); } catch { /* Clear this browser session even when the provider is unavailable. */ }
  await clearLocalAuthCookies();
  revalidatePath("/", "layout");
  redirect("/login?data=deleted");
}
