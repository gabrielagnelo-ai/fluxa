import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { secureLogger } from "@/lib/security/logger";

type AuthUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: {
    name?: string;
  } | null;
};

export function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || "sem-email@local";
}

export async function ensureUserFromAuthUser(authUser: AuthUserLike) {
  const email = normalizeEmail(authUser.email);
  const name = authUser.user_metadata?.name;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { supabaseId: authUser.id },
        {
          email: {
            equals: email,
            mode: "insensitive"
          }
        }
      ]
    }
  });

  if (existingUser) {
    if (existingUser.supabaseId === authUser.id && existingUser.email === email && existingUser.name === (name ?? existingUser.name)) {
      return existingUser;
    }

    try {
      return await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          supabaseId: authUser.id,
          email,
          name: name ?? existingUser.name
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        secureLogger.warn("User sync hit unique constraint; falling back to Supabase id lookup");
        const bySupabaseId = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
        if (bySupabaseId) return bySupabaseId;
      }

      throw error;
    }
  }

  return prisma.user.create({
    data: {
      supabaseId: authUser.id,
      email,
      name
    }
  });
}
