"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, BriefcaseBusiness, Calculator, Flag, Home, Landmark, LogOut, PanelLeftClose, PanelLeftOpen, Settings, ShieldCheck, Upload, WalletCards } from "lucide-react";
import { signOut } from "@/app/actions";
import { FluxaLogo } from "@/components/brand/fluxa-logo";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/import", label: "Importar", icon: Upload },
  { href: "/transactions", label: "Transacoes", icon: WalletCards },
  { href: "/goals", label: "Metas", icon: Flag },
  { href: "/investments", label: "Investimentos", icon: BriefcaseBusiness },
  { href: "/open-finance", label: "Open Finance", icon: Landmark },
  { href: "/planning", label: "Planejamento", icon: Calculator },
  { href: "/insights", label: "Inteligencia", icon: Bot },
  { href: "/privacy", label: "Privacidade", icon: ShieldCheck },
  { href: "/settings", label: "Ajustes", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem("fluxa-sidebar-collapsed");
    if (saved) setCollapsed(saved === "true");
  }, []);

  function toggleSidebar() {
    setCollapsed((current) => {
      window.localStorage.setItem("fluxa-sidebar-collapsed", String(!current));
      return !current;
    });
  }

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 border-r border-border bg-card/80 px-4 py-5 backdrop-blur-xl transition-[width] duration-300 lg:sticky lg:top-0 lg:block",
        collapsed ? "w-[5.75rem]" : "w-72"
      )}
    >
      <div className={cn("mb-8 flex items-center", collapsed ? "justify-center" : "justify-between")}>
        <Link href="/dashboard" className={cn("block min-w-0", collapsed && "scale-90")}>
          <FluxaLogo compact />
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="grid size-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Recolher menu"
          >
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={toggleSidebar}
          className="mb-4 grid size-11 w-full place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Expandir menu"
        >
          <PanelLeftOpen className="size-4" />
        </button>
      )}

      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg py-2.5 text-sm transition",
                collapsed ? "justify-center px-0" : "gap-3 px-3",
                active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="size-4" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mt-8 rounded-xl border border-border bg-background/80 p-4">
          <BarChart3 className="mb-3 size-5 text-primary" />
          <p className="text-sm font-medium">Fluxa Intelligence</p>
          <p className="mt-1 text-xs text-muted-foreground">Importacao, categorizacao, metas e projecoes por periodo.</p>
        </div>
      )}

      <form action={signOut} className="absolute bottom-5 left-4 right-4">
        <button
          title={collapsed ? "Sair" : undefined}
          className={cn(
            "flex w-full items-center rounded-lg py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
            collapsed ? "justify-center px-0" : "gap-3 px-3"
          )}
        >
          <LogOut className="size-4" />
          {!collapsed && <span>Sair</span>}
        </button>
      </form>
    </aside>
  );
}
