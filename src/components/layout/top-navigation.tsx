"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isNavigationActive, navigationItems } from "./navigation";

export function TopNavigation() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState({ x: 0, y: 0, width: 0, height: 0 });
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const active = nav.querySelector<HTMLAnchorElement>('[aria-current="page"]');
      if (!active) { setIndicator(current => ({ ...current, width: 0 })); return; }
      setIndicator({ x: active.offsetLeft, y: active.offsetTop, width: active.offsetWidth, height: active.offsetHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    document.fonts.ready.then(measure);
    return () => { alive = false; observer.disconnect(); };
  }, [pathname]);
  return <nav ref={navRef} className="top-navigation" aria-label="Navegação principal" data-tour="navigation">
    <span aria-hidden="true" className="top-navigation-indicator" style={{ transform: `translate(${indicator.x}px, ${indicator.y}px)`, width: indicator.width, height: indicator.height, opacity: indicator.width ? 1 : 0 }} />
    {navigationItems.map(item => <Link href={item.href} key={item.href} aria-current={isNavigationActive(pathname, item.href) ? "page" : undefined} className="top-navigation-link"><item.icon aria-hidden="true" /><span>{item.href === "/dashboard" ? "Visão geral" : item.href === "/privacy" ? "Privacidade" : item.label}</span></Link>)}
  </nav>;
}
