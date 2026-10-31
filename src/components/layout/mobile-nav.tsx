"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Ellipsis } from "lucide-react";
import { isNavigationActive, mobilePrimaryItems, navigationItems } from "./navigation";
import { SignOutButton } from "./sign-out-button";

/** Phone and tablet navigation: floating Liquid Glass tab bar; "Mais" opens a sheet with every area. */
export function TabBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const moreActive = !mobilePrimaryItems.some(item => isNavigationActive(pathname, item.href));
  const extraItems = navigationItems.filter(item => !mobilePrimaryItems.includes(item));

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) { dialog.close(); triggerRef.current?.focus(); }
  }, [open]);

  return (
    <>
      <div className="tabbar-edge" aria-hidden="true" />
      <nav aria-label="Navegação principal" className="tabbar glass">
        {mobilePrimaryItems.map(item => {
          const active = isNavigationActive(pathname, item.href);
          return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className="tabbar-item"><item.icon aria-hidden="true" /><span>{item.tabLabel}</span></Link>;
        })}
        <button ref={triggerRef} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-controls="mobile-menu" aria-current={moreActive ? "page" : undefined} className="tabbar-item"><Ellipsis aria-hidden="true" /><span>Mais</span></button>
      </nav>
      <dialog id="mobile-menu" ref={dialogRef} aria-labelledby="mobile-menu-title" className="sheet" onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
        <div className="sheet-grabber" aria-hidden="true" />
        <div className="sheet-bar"><span /><h2 id="mobile-menu-title" className="sheet-title">Mais</h2><button type="button" className="btn btn-plain" onClick={() => setOpen(false)}>OK</button></div>
        <div className="more-grid">
          <ul className="list card" aria-label="Outras áreas" style={{ background: "var(--surface-2)" }}>
            {extraItems.map(item => <li key={item.href}><Link href={item.href} onClick={() => setOpen(false)} aria-current={isNavigationActive(pathname, item.href) ? "page" : undefined} className="list-row has-icon"><span className="row-icon" aria-hidden="true"><item.icon /></span><span className="row-main row-title">{item.label}</span><ChevronRight className="row-chevron" aria-hidden="true" /></Link></li>)}
          </ul>
          <div className="card" style={{ background: "var(--surface-2)", padding: "0.25rem" }}><SignOutButton /></div>
        </div>
      </dialog>
    </>
  );
}
