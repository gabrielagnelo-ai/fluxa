"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions";
import { cn } from "@/lib/utils";

function Submit({ className }: { className?: string }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} aria-label="Sair da conta" data-tip="Sair da conta" className={cn("sidebar-link w-full disabled:opacity-50", className)}><LogOut aria-hidden="true" /><span className="sidebar-label">{pending ? "Saindo..." : "Sair da conta"}</span></button>;
}

export function SignOutButton({ className }: { className?: string }) {
  return <form action={signOut}><Submit className={className} /></form>;
}
