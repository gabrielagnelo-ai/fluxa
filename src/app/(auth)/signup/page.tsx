import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Criar conta", description: "Crie sua conta no Fluxa e importe seu primeiro extrato." };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
