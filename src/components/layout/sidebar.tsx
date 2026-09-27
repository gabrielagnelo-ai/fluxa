"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { FluxaLogo } from "@/components/brand/fluxa-logo";
import { cn } from "@/lib/utils";
import { isNavigationActive, navigationItems } from "./navigation";
import { SignOutButton } from "./sign-out-button";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("fluxa-sidebar-collapsed");
      if (saved !== null) setCollapsed(saved === "true");
    } catch { /* Navigation remains available when storage is disabled. */ }
  }, []);

  function toggleSidebar() {
    setCollapsed((current) => {
      try { window.localStorage.setItem("fluxa-sidebar-collapsed", String(!current)); } catch { /* Keep this session's choice. */ }
      return !current;
    });
  }

  return (
    <aside className={cn("hidden h-dvh shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-card/55 px-3 py-5 shadow-[18px_0_60px_rgba(2,6,23,0.28)] backdrop-blur-2xl transition-[width] duration-200 motion-reduce:transition-none lg:sticky lg:top-0 lg:flex", collapsed ? "w-[5.75rem]" : "w-64")}>
      <div className={cn("mb-5 flex min-h-12 shrink-0 items-center", collapsed ? "flex-col gap-3" : "justify-between gap-2")}>
        <Link href="/dashboard" aria-label="Fluxa, início" className={cn("flex min-w-0 items-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary", collapsed ? "justify-center" : "max-w-[10rem]")}><FluxaLogo compact={collapsed} /></Link>
        <button type="button" onClick={toggleSidebar} className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" aria-label={collapsed ? "Expandir menu" : "Recolher menu"} aria-expanded={!collapsed}>{collapsed ? <PanelLeftOpen className="size-4" aria-hidden="true" /> : <PanelLeftClose className="size-4" aria-hidden="true" />}</button>
      </div>
      <nav aria-label="Navegação principal" className="space-y-1">
        {navigationItems.map((item) => {
          const active = isNavigationActive(pathname, item.href);
          return <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} aria-label={item.label} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center rounded-xl py-2.5 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary", collapsed ? "justify-center px-0" : "gap-3 px-3", active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><item.icon className="size-4 shrink-0" aria-hidden="true" />{!collapsed && <span>{item.label}</span>}</Link>;
        })}
      </nav>
      <div className="mt-auto pt-5"><SignOutButton collapsed={collapsed} /></div>
    </aside>
  );
}
