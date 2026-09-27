"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions";
import { cn } from "@/lib/utils";

function Submit({ collapsed }: { collapsed: boolean }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} aria-label="Sair da conta" title={collapsed ? "Sair da conta" : undefined} className={cn("flex min-h-11 w-full items-center rounded-xl py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50", collapsed ? "justify-center px-0" : "gap-3 px-3")}><LogOut className="size-4 shrink-0" aria-hidden="true" />{!collapsed && <span>{pending ? "Saindo..." : "Sair da conta"}</span>}</button>;
}

export function SignOutButton({ collapsed = false }: { collapsed?: boolean }) {
  return <form action={signOut}><Submit collapsed={collapsed} /></form>;
}
