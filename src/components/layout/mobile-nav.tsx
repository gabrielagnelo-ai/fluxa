"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isNavigationActive, mobilePrimaryItems, navigationItems } from "./navigation";
import { SignOutButton } from "./sign-out-button";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const moreActive = !mobilePrimaryItems.some((item) => isNavigationActive(pathname, item.href));

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!open) {
      if (dialog.open) { dialog.close(); triggerRef.current?.focus(); }
      return;
    }
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  return (
    <>
      <nav aria-label="Navegação principal" className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 grid grid-cols-5 rounded-2xl border border-white/10 bg-card/95 p-1.5 shadow-glow backdrop-blur-2xl lg:hidden">
        {mobilePrimaryItems.map((item) => {
          const active = isNavigationActive(pathname, item.href);
          return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2 text-[10px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary", active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><item.icon className="size-4" aria-hidden="true" /><span>{item.label}</span></Link>;
        })}
        <button ref={triggerRef} type="button" onClick={() => setOpen(true)} aria-label="Mais opções de navegação" aria-haspopup="dialog" aria-expanded={open} aria-controls="mobile-menu" className={cn("flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary", moreActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}><Menu className="size-4" aria-hidden="true" />Mais</button>
      </nav>
      <dialog id="mobile-menu" ref={dialogRef} aria-labelledby="mobile-menu-title" onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }} className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-3xl border border-border bg-card p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-foreground shadow-2xl backdrop:bg-black/65">
        <div className="mb-4 flex items-center justify-between gap-3"><h2 id="mobile-menu-title" className="text-xl font-semibold">Seu Fluxa</h2><button type="button" onClick={() => setOpen(false)} aria-label="Fechar menu" className="grid size-11 place-items-center rounded-xl hover:bg-muted focus-visible:outline focus-visible:outline-primary"><X className="size-5" aria-hidden="true" /></button></div>
        <nav aria-label="Todas as áreas" className="grid grid-cols-2 gap-2">
          {navigationItems.map((item) => {
            const active = isNavigationActive(pathname, item.href);
            return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={cn("flex min-h-14 items-center gap-2 rounded-xl border px-3 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary", active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}><item.icon className="size-4 shrink-0" aria-hidden="true" /><span>{item.label}</span></Link>;
          })}
        </nav>
        <div className="mt-4 border-t border-border pt-3"><SignOutButton /></div>
      </dialog>
    </>
  );
}
