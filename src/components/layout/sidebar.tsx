"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, BriefcaseBusiness, Calculator, Flag, Home, LogOut, PanelLeftClose, PanelLeftOpen, Settings, Upload, WalletCards } from "lucide-react";
import { signOut } from "@/app/actions";
import { FluxaLogo } from "@/components/brand/fluxa-logo";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/import", label: "Importar", icon: Upload },
  { href: "/transactions", label: "Transacoes", icon: WalletCards },
  { href: "/goals", label: "Metas", icon: Flag },
  { href: "/investments", label: "Investimentos", icon: BriefcaseBusiness },
  { href: "/planning", label: "Planejamento", icon: Calculator },
  { href: "/insights", label: "Inteligencia", icon: Bot },
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
        "hidden h-screen shrink-0 border-r border-white/10 bg-card/55 px-4 py-5 shadow-[18px_0_60px_rgba(2,6,23,0.28)] backdrop-blur-2xl transition-[width] duration-300 lg:sticky lg:top-0 lg:block",
        collapsed ? "w-[5.75rem]" : "w-72"
      )}
    >
      <div className={cn("mb-8 flex min-h-12 items-center", collapsed ? "justify-center" : "justify-between")}>
        <Link
          href="/dashboard"
          title={collapsed ? "Fluxa" : undefined}
          className={cn("flex min-w-0 items-center rounded-2xl transition duration-200 hover:scale-[1.02] hover:opacity-95", collapsed ? "justify-center" : "max-w-[11rem]")}
        >
          <FluxaLogo compact={collapsed} />
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="grid size-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-white/[0.08] hover:text-foreground"
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
          className="mb-4 grid size-11 w-full place-items-center rounded-xl text-muted-foreground transition hover:bg-white/[0.08] hover:text-foreground"
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
                "group relative flex items-center overflow-hidden rounded-xl py-2.5 text-sm transition duration-200",
                collapsed ? "justify-center px-0" : "gap-3 px-3",
                active ? "bg-primary/95 text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
              )}
            >
              {active && <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-white/80" />}
              <item.icon className="size-4" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-background/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl">
          <BarChart3 className="mb-3 size-5 text-primary" />
          <p className="text-sm font-medium">Fluxa Intelligence</p>
          <p className="mt-1 text-xs text-muted-foreground">Importacao, categorizacao, metas e projecoes por periodo.</p>
        </div>
      )}

      <form action={signOut} className="absolute bottom-5 left-4 right-4">
        <button
          title={collapsed ? "Sair" : undefined}
          className={cn(
            "flex w-full items-center rounded-xl py-2.5 text-sm text-muted-foreground transition hover:bg-white/[0.08] hover:text-foreground",
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
