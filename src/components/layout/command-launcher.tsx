"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { navigationItems } from "./navigation";

const OPEN_EVENT = "fluxa:open-search";

/** Opens the single search dialog from any trigger (sidebar, top bar). */
export function openSearch() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function CommandLauncher() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const items = navigationItems.filter(item => normalize(item.label).includes(normalize(query)));
  const open = useCallback(() => { setQuery(""); setActive(0); if (!dialog.current?.open) dialog.current?.showModal(); }, []);
  const go = (href: string) => { dialog.current?.close(); router.push(href); };
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialog.current?.open) dialog.current.close(); else open();
      }
    };
    window.addEventListener("keydown", handler);
    window.addEventListener(OPEN_EVENT, open);
    return () => { window.removeEventListener("keydown", handler); window.removeEventListener(OPEN_EVENT, open); };
  }, [open]);
  return <dialog ref={dialog} className="command-launcher" aria-label="Buscar áreas do Fluxa" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="command-input"><Search size={20} aria-hidden="true" /><input autoFocus aria-label="Buscar área" placeholder="Para onde vamos?" value={query} onChange={event => { setQuery(event.target.value); setActive(0); }} onKeyDown={event => {
      if (event.key === "ArrowDown") { event.preventDefault(); setActive(value => Math.min(items.length - 1, value + 1)); }
      if (event.key === "ArrowUp") { event.preventDefault(); setActive(value => Math.max(0, value - 1)); }
      if (event.key === "Enter" && items[active]) { event.preventDefault(); go(items[active].href); }
    }} /><button type="button" className="icon-btn" aria-label="Fechar busca" onClick={() => dialog.current?.close()}><X aria-hidden="true" /></button></div>
    <p className="command-caption">Áreas do seu Fluxa</p>
    <div className="command-results">{items.map((item, index) => <button key={item.href} type="button" className={index === active ? "is-active" : ""} onMouseEnter={() => setActive(index)} onClick={() => go(item.href)}><item.icon size={19} aria-hidden="true" /><span>{item.label}</span><span aria-hidden="true">↵</span></button>)}{!items.length && <p>Nenhuma área encontrada.</p>}</div>
    <footer><span>↑ ↓ para navegar</span><span>Enter abre, Esc fecha</span></footer>
  </dialog>;
}
