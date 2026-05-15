"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const authSchema = z.object({
  email: z.string().email("Informe um email válido."),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres.")
});

export async function signIn(formData: FormData) {
  const parsed = authSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (!isSupabaseConfigured()) return { error: "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return { error: error.message };
  } catch {
    return { error: "Não foi possível conectar ao Supabase Auth agora. Verifique sua internet/VPN/firewall e tente novamente." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const parsed = authSchema
    .extend({ name: z.string().min(2, "Informe seu nome.") })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (!isSupabaseConfigured()) return { error: "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local." };

  let data;
  let error;

  try {
    const supabase = await createClient();
    const result = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { name: parsed.data.name } }
    });
    data = result.data;
    error = result.error;
  } catch {
    return { error: "Não foi possível conectar ao Supabase Auth agora. Verifique sua internet/VPN/firewall e tente novamente." };
  }

  if (error) return { error: error.message };

  if (data.user) {
    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { supabaseId: data.user.id },
            { email: parsed.data.email }
          ]
        }
      });

      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { supabaseId: data.user.id, name: parsed.data.name, email: parsed.data.email }
        });
      } else {
        await prisma.user.create({
          data: { supabaseId: data.user.id, name: parsed.data.name, email: parsed.data.email }
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function resetPassword(formData: FormData) {
  const email = z.string().email("Informe um email válido.").safeParse(formData.get("email"));
  if (!email.success) return { error: email.error.issues[0]?.message };
  if (!isSupabaseConfigured()) return { error: "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local." };

  let error;

  try {
    const supabase = await createClient();
    const result = await supabase.auth.resetPasswordForEmail(email.data, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/reset-password`
    });
    error = result.error;
  } catch {
    return { error: "Não foi possível conectar ao Supabase Auth agora. Verifique sua internet/VPN/firewall e tente novamente." };
  }

  return error ? { error: error.message } : { success: "Enviamos as instruções para seu email." };
}

export async function signOut() {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
