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
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    const track = () => document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach(element => {
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
