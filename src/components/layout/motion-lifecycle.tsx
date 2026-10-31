"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { navigationItems } from "./navigation";

/** Records the navigation direction so route arrival can follow the menu order. */
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
  return null;
}
