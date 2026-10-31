"use client";

import { useEffect, useState, type RefObject } from "react";

/** True once the element has been on screen; charts mount then, so their draw-in is seen. */
export function useInView(ref: RefObject<Element | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || inView) return;
    // No draw-in to watch with reduced motion (or without IntersectionObserver): show the final chart at once.
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") { setInView(true); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) { setInView(true); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(element);
    return () => io.disconnect();
  }, [ref, inView]);
  return inView;
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
