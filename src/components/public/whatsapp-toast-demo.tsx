"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "@/components/ui/toast";

/**
 * The landing's WhatsApp example raises the same notice the app shows when a real message
 * arrives (fictional data, nothing saved): once, shortly after the reply appears on screen.
 */
export function WhatsAppToastDemo() {
  const sentinel = useRef<HTMLSpanElement>(null);
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const element = sentinel.current;
    if (!element || done || typeof IntersectionObserver === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      io.disconnect();
      timer = setTimeout(() => { setShow(true); setDone(true); }, 1400);
    }, { threshold: 1 });
    io.observe(element);
    return () => { io.disconnect(); if (timer) clearTimeout(timer); };
  }, [done]);

  return <>
    <span ref={sentinel} className="toast-sentinel" aria-hidden="true" />
    {show && <Toast icon="whatsapp" title="Gasto registrado pelo WhatsApp" detail="R$ 32,00 em Mercado" onClose={() => setShow(false)} />}
  </>;
}
