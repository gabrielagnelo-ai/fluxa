"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, MessageCircle, X } from "lucide-react";

export type ToastIcon = "check" | "whatsapp";

/**
 * The app's one notice: glass like the cards, the icon carries the color (never the whole
 * card), a plain title and one detail line. Top right on desktop, under the bar on phones.
 * Springs in, fades out; with reduced motion only fades. The timer pauses while hovered or focused.
 */
export function Toast({ title, detail, icon = "check", duration = 5500, onClose }: {
  title: string;
  detail?: string;
  icon?: ToastIcon;
  /** Milliseconds before it leaves on its own; null keeps it until closed. */
  duration?: number | null;
  onClose: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (duration == null || paused || leaving) return;
    const id = setTimeout(() => setLeaving(true), duration);
    return () => clearTimeout(id);
  }, [duration, paused, leaving]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // Portaled to <body>: a glass card (backdrop-filter) would otherwise trap position: fixed.
  return createPortal(
    <div className="toast-region" role="status" aria-live="polite">
      <div
        className="toast"
        data-leaving={leaving || undefined}
        onAnimationEnd={(event) => { if (leaving && event.animationName.startsWith("toast-out")) closeRef.current(); }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <span className={`toast-icon is-${icon}`} aria-hidden="true">{icon === "whatsapp" ? <MessageCircle /> : <Check />}</span>
        <div className="toast-text">
          <p className="toast-title">{title}</p>
          {detail && <p className="toast-detail">{detail}</p>}
        </div>
        <button type="button" className="toast-close" onClick={() => setLeaving(true)} aria-label="Fechar aviso"><X aria-hidden="true" /></button>
      </div>
    </div>,
    document.body
  );
}
