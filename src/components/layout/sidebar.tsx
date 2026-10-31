"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { Logo } from "@/components/branding/logo";
import { useTutorial } from "@/components/onboarding/guided-tutorial";
import { openSearch } from "./command-launcher";
import { isNavigationActive, primaryNavigationItems, secondaryNavigationItems } from "./navigation";
import { SignOutButton } from "./sign-out-button";

const STORAGE_KEY = "fluxa-sidebar";

/** Desktop navigation: a floating Liquid Glass sidebar that collapses to icons (state kept in localStorage). */
export function AppSidebar() {
  const pathname = usePathname();
  const { startTutorial } = useTutorial();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { setCollapsed(document.documentElement.dataset.sidebar === "collapsed"); }, []);

  const toggle = useCallback(() => {
    setCollapsed(current => {
      const next = !current;
      if (next) document.documentElement.dataset.sidebar = "collapsed"; else delete document.documentElement.dataset.sidebar;
      try { window.localStorage.setItem(STORAGE_KEY, next ? "collapsed" : "expanded"); } catch { /* The choice still holds for this visit. */ }
      return next;
    });
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === ".") { event.preventDefault(); toggle(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);

  const link = (item: (typeof primaryNavigationItems)[number]) => (
    <Link key={item.href} href={item.href} aria-current={isNavigationActive(pathname, item.href) ? "page" : undefined} className="sidebar-link" data-tip={item.label} aria-label={collapsed ? item.label : undefined}>
      <item.icon aria-hidden="true" /><span className="sidebar-label">{item.label}</span>
    </Link>
  );

  return (
    <aside className="app-sidebar glass" aria-label="Menu do Fluxa">
      <div className="sidebar-top">
        <Link href="/dashboard" aria-label="Fluxa, visão geral" className="sidebar-brand">
          <span className="sidebar-logo-full"><Logo size="sm" /></span>
          <Image src="/branding/fluxa-fx.png" alt="" width={32} height={32} className="sidebar-logo-mark" />
        </Link>
        <button type="button" className="icon-btn sidebar-toggle" onClick={toggle} aria-expanded={!collapsed} aria-label={collapsed ? "Expandir menu (⌘.)" : "Recolher menu (⌘.)"} data-tip={collapsed ? "Expandir menu" : "Recolher menu"}>
          {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
        </button>
      </div>
      <button type="button" className="sidebar-search" onClick={openSearch} data-tip="Buscar" aria-label={collapsed ? "Buscar" : undefined}><Search aria-hidden="true" /><span className="sidebar-label">Buscar</span><kbd aria-hidden="true">⌘K</kbd></button>
      <nav aria-label="Navegação principal" className="sidebar-nav">
        {primaryNavigationItems.map(link)}
        <p className="sidebar-group-title"><span className="sidebar-label">Conta</span></p>
        {secondaryNavigationItems.map(link)}
      </nav>
      <div className="sidebar-footer">
        <button type="button" onClick={startTutorial} className="sidebar-link" data-tip="Como usar" aria-label={collapsed ? "Como usar" : undefined}><CircleHelp aria-hidden="true" /><span className="sidebar-label">Como usar</span></button>
        <SignOutButton />
      </div>
    </aside>
  );
}
