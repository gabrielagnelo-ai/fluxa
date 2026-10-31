"use client";

import { useEffect, useRef } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { prefersReducedMotion } from "./use-in-view";

/** Currency that counts up briefly on first render; the final value is in the HTML and shown as is with reduced motion. */
export function CountUp({ value, className, signed = false }: { value: number; className?: string; signed?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const format = (amount: number) => `${signed && value > 0 ? "+" : ""}${formatCurrency(amount)}`;
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (prefersReducedMotion() || value === 0) { element.textContent = format(value); element.dataset.done = "true"; return; }
    let frame = 0;
    const duration = 750;
    const start = performance.now();
    element.textContent = format(0);
    element.dataset.done = "true";
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      element.textContent = format(progress < 1 ? value * eased : value);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span ref={ref} className={cn("countup num", className)}>{format(value)}</span>;
}
