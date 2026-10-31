"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Search } from "lucide-react";
import { Logo } from "@/components/branding/logo";
import { useTutorial } from "@/components/onboarding/guided-tutorial";
import { openSearch } from "./command-launcher";
import { isNavigationActive, primaryNavigationItems, secondaryNavigationItems } from "./navigation";
import { SignOutButton } from "./sign-out-button";

/** Desktop navigation: a floating Liquid Glass sidebar (navigation layer only). */
export function AppSidebar() {
  const pathname = usePathname();
  const { startTutorial } = useTutorial();
  return (
    <aside className="app-sidebar glass" aria-label="Menu do Fluxa">
      <Link href="/dashboard" aria-label="Fluxa, visão geral" className="sidebar-brand"><Logo size="sm" /></Link>
      <button type="button" className="sidebar-search" onClick={openSearch}><Search aria-hidden="true" /><span>Buscar</span><kbd aria-hidden="true">⌘K</kbd></button>
      <nav aria-label="Navegação principal" className="sidebar-nav">
        {primaryNavigationItems.map(item => <Link key={item.href} href={item.href} aria-current={isNavigationActive(pathname, item.href) ? "page" : undefined} className="sidebar-link"><item.icon aria-hidden="true" /><span>{item.label}</span></Link>)}
        <p className="sidebar-group-title">Conta</p>
        {secondaryNavigationItems.map(item => <Link key={item.href} href={item.href} aria-current={isNavigationActive(pathname, item.href) ? "page" : undefined} className="sidebar-link"><item.icon aria-hidden="true" /><span>{item.label}</span></Link>)}
      </nav>
      <div className="sidebar-footer">
        <button type="button" onClick={startTutorial} className="sidebar-link"><CircleHelp aria-hidden="true" /><span>Como usar</span></button>
        <SignOutButton />
      </div>
    </aside>
  );
}
