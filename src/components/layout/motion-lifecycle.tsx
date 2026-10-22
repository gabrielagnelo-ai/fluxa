"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { navigationItems } from "./navigation";

/** Suspend decorative motion while hidden, offscreen, or reduced by preference. */
export function MotionLifecycle() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  useLayoutEffect(() => {
    const previous = navigationItems.findIndex(item => item.href === previousPath.current);
    const current = navigationItems.findIndex(item => item.href === pathname);
    document.documentElement.dataset.workspaceDirection = previous >= 0 && current >= 0 && previous !== current
      ? current > previous ? "forward" : "backward"
      : "stationary";
    previousPath.current = pathname;
  }, [pathname]);
  useEffect(() => {
    const root = document.documentElement;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      root.dataset.workspaceMotion = document.hidden || preference.matches ? "paused" : "running";
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    preference.addEventListener("change", sync);
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        (entry.target as HTMLElement).dataset.motionVisible = String(entry.isIntersecting);
      }
    });
    const tracked = new Set<HTMLElement>();
    const track = () => document.querySelectorAll<HTMLElement>(".overview-balance").forEach(element => {
      if (!tracked.has(element)) { tracked.add(element); observer.observe(element); }
    });
    track();
    const content = new MutationObserver(track);
    content.observe(document.body, { childList: true, subtree: true });
    return () => {
      document.removeEventListener("visibilitychange", sync);
      preference.removeEventListener("change", sync);
      observer.disconnect();
      content.disconnect();
      delete root.dataset.workspaceMotion;
    };
  }, [pathname]);
  return null;
}
