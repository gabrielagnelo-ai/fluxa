"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { FluxaLogo } from "@/components/brand/fluxa-logo";
import { cn } from "@/lib/utils";
import { isNavigationActive, navigationItems } from "./navigation";
import { SignOutButton } from "./sign-out-button";
import styles from "./sidebar.module.css";

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
    <aside className={cn(styles.sidebar, collapsed && styles.collapsed)}>
      <div className={styles.header}>
        <Link href="/dashboard" aria-label="Fluxa, início" className={styles.brand}><FluxaLogo compact={collapsed} /></Link>
        <button type="button" onClick={toggleSidebar} className={styles.toggle} title={collapsed ? "Expandir menu" : "Recolher menu"} aria-label={collapsed ? "Expandir menu" : "Recolher menu"} aria-expanded={!collapsed}>{collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}</button>
      </div>
      <nav aria-label="Navegação principal" className={styles.navigation}>
        {[navigationItems.slice(0, 7), navigationItems.slice(7)].map((items, groupIndex) => <div key={groupIndex} className={styles.group}>
        {items.map((item) => {
          const active = isNavigationActive(pathname, item.href);
          return <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} aria-label={item.label} aria-current={active ? "page" : undefined} className={styles.link}><item.icon aria-hidden="true" />{!collapsed && <span>{item.label}</span>}</Link>;
        })}
        </div>)}
      </nav>
      <div className={styles.footer}><SignOutButton collapsed={collapsed} /></div>
    </aside>
  );
}
