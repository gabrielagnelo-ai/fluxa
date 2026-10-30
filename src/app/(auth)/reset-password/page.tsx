import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Recuperar senha", description: "Receba um link para criar uma nova senha no Fluxa." };

export default function ResetPasswordPage() {
  return <AuthForm mode="reset" />;
}
