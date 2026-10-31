"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Adds .is-visible to every [data-reveal] element as it enters the viewport.
 * Hidden start only applies under html.js and without reduced motion (CSS), so content never depends on this.
 */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    // Hydrated late (slow network): the CSS safety net has already shown everything, keep it shown.
    if (!root.dataset.revealReady && performance.now() > 2400) document.querySelectorAll("[data-reveal], [data-reveal-group]").forEach(element => element.classList.add("is-visible"));
    root.dataset.revealReady = "true";
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    const track = () => document.querySelectorAll(":is([data-reveal], [data-reveal-group]):not(.is-visible)").forEach(element => {
      if (seen.has(element)) return;
      seen.add(element);
      io.observe(element);
    });
    track();
    const mutations = new MutationObserver(track);
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mutations.disconnect(); };
  }, [pathname]);
  return null;
}
