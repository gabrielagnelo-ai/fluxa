"use server";

import { GoalStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { defaultGoalMarker, rebuildGoalContributions, splitGoalMarkers } from "@/services/goal-marker-service";
import { getCurrentUserId } from "@/services/finance-data-service";

const goalSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Informe o nome da meta."),
  targetAmount: z.coerce.number().positive("Valor alvo precisa ser maior que zero."),
  dueDate: z.string().optional(),
  status: z.nativeEnum(GoalStatus).default(GoalStatus.ACTIVE),
  markers: z.string().optional()
});

export async function upsertGoal(formData: FormData) {
  const parsed = goalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para editar suas metas." };

  const data = {
    userId,
    name: parsed.data.name,
    targetAmount: parsed.data.targetAmount,
    currentAmount: 0,
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    status: parsed.data.status
  };

  const customMarkers = splitGoalMarkers(parsed.data.markers ?? "");
  const markerKeywords = customMarkers.length > 0 ? customMarkers : [defaultGoalMarker(parsed.data.name)];

  if (parsed.data.id) {
    await prisma.goal.updateMany({
      where: { id: parsed.data.id, userId },
      data
    });
    await prisma.goalMarker.deleteMany({ where: { goalId: parsed.data.id, userId } });
    await prisma.goalMarker.createMany({
      data: markerKeywords.map((keyword) => ({ userId, goalId: parsed.data.id!, keyword })),
      skipDuplicates: true
    });
    await rebuildGoalContributions(userId, parsed.data.id);
  } else {
    const goal = await prisma.goal.create({ data });
    await prisma.goalMarker.createMany({
      data: markerKeywords.map((keyword) => ({ userId, goalId: goal.id, keyword })),
      skipDuplicates: true
    });
    await rebuildGoalContributions(userId, goal.id);
  }

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: "Meta salva." };
}

export async function deleteGoal(formData: FormData) {
  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) return { error: "Meta inválida." };

  const userId = await getCurrentUserId();
  if (!userId) return { error: "Faça login para excluir metas." };

  await prisma.goal.deleteMany({ where: { id: id.data, userId } });
  revalidatePath("/goals");
  return { success: "Meta excluída." };
}
