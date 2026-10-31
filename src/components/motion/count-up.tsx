"use client";

import { useEffect, useRef } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { prefersReducedMotion } from "./use-in-view";

/**
 * Currency that counts up when it reaches the screen. The final value is in the HTML;
 * reduced motion, or a page that never hydrates, shows it as is.
 */
export function CountUp({ value, className, signed = false }: { value: number; className?: string; signed?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const format = (amount: number) => `${signed && value > 0 ? "+" : ""}${formatCurrency(amount)}`;
    const finish = () => { element.textContent = format(value); element.dataset.done = "true"; };
    if (prefersReducedMotion() || value === 0) { finish(); return; }
    element.dataset.armed = "true";
    let frame = 0;
    const run = () => {
      const duration = 750;
      const start = performance.now();
      element.textContent = format(0);
      element.dataset.done = "true";
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        element.textContent = format(progress < 1 ? value * (1 - Math.pow(1 - progress, 4)) : value);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      io.disconnect();
      run();
    }, { threshold: 0.6 });
    io.observe(element);
    return () => { io.disconnect(); cancelAnimationFrame(frame); };
  }, [value, signed]);
  return <span ref={ref} className={cn("countup num", className)}>{`${signed && value > 0 ? "+" : ""}${formatCurrency(value)}`}</span>;
}
