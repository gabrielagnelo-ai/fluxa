import { normalizeText } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

const goalExclusionKeywords = ["APLICACAO RDB", "APLICAÇÃO RDB", "LIMITE GARANTIDO"];

export function isGoalContributionExcluded(description: string) {
  const normalizedDescription = normalizeText(description);
  return goalExclusionKeywords.some((keyword) => normalizedDescription.includes(normalizeText(keyword)));
}

export function defaultGoalMarker(name: string) {
  return `META ${normalizeText(name)}`.trim();
}

export function splitGoalMarkers(value: string) {
  return value
    .split(/[,\n;]/)
    .map((marker) => normalizeText(marker))
    .filter(Boolean);
}

export function matchGoalMarker(description: string, markers: { goalId: string; keyword: string }[]) {
  if (isGoalContributionExcluded(description)) return undefined;
  const normalizedDescription = normalizeText(description);
  return markers.find((marker) => normalizedDescription.includes(normalizeText(marker.keyword)));
}

export async function rebuildGoalContributions(userId: string, goalId?: string) {
  const markers = await prisma.goalMarker.findMany({
    where: {
      userId,
      ...(goalId ? { goalId } : {})
    }
  });

  await prisma.goalContribution.deleteMany({
    where: {
      userId,
      ...(goalId ? { goalId } : {})
    }
  });

  if (markers.length === 0) return 0;

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      NOT: [
        { description: { contains: "Aplicação RDB", mode: "insensitive" } },
        { description: { contains: "Aplicacao RDB", mode: "insensitive" } },
        { description: { contains: "Limite Garantido", mode: "insensitive" } }
      ]
    }
  });

  const contributions = transactions.flatMap((transaction) => {
    const marker = matchGoalMarker(transaction.description, markers);
    if (!marker) return [];

    return {
      userId,
      goalId: marker.goalId,
      transactionId: transaction.id,
      amount: transaction.amount,
      date: transaction.date
    };
  });

  if (contributions.length === 0) return 0;

  await prisma.goalContribution.createMany({
    data: contributions,
    skipDuplicates: true
  });

  return contributions.length;
}
