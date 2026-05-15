"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, Calculator, Flag, Home, LogOut, Settings, Upload, WalletCards } from "lucide-react";
import { signOut } from "@/app/actions";
import { FluxaLogo } from "@/components/brand/fluxa-logo";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/import", label: "Importar", icon: Upload },
  { href: "/transactions", label: "Transações", icon: WalletCards },
  { href: "/goals", label: "Metas", icon: Flag },
  { href: "/planning", label: "Planejamento", icon: Calculator },
  { href: "/insights", label: "Inteligência", icon: Bot },
  { href: "/settings", label: "Ajustes", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-72 shrink-0 border-r border-border bg-card/80 px-4 py-5 backdrop-blur-xl lg:sticky lg:top-0 lg:block">
      <Link href="/dashboard" className="mb-8 block px-2">
        <FluxaLogo compact />
      </Link>
      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 rounded-xl border border-border bg-background/80 p-4">
        <BarChart3 className="mb-3 size-5 text-primary" />
        <p className="text-sm font-medium">Fluxa Intelligence</p>
        <p className="mt-1 text-xs text-muted-foreground">Importação, categorização, metas e projeções por período.</p>
      </div>
      <form action={signOut} className="absolute bottom-5 left-4 right-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground">
          <LogOut className="size-4" />
          Sair
        </button>
      </form>
    </aside>
  );
}
