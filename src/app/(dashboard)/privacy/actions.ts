"use server";

import { signOut } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { secureLogger } from "@/lib/security/logger";
import { getCurrentUserId } from "@/services/finance-data-service";

export async function deleteMyData() {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para excluir seus dados." };

  try {
    await prisma.user.delete({
      where: { id: userId }
    });
    await signOut();
    return { success: "Dados excluídos." };
  } catch (error) {
    secureLogger.error("User data deletion failed", { error });
    return { error: "Não foi possível excluir seus dados agora." };
  }
}
