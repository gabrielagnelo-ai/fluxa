"use client";

import { useEffect } from "react";

/**
 * Living background (principle 25): three logo-colored lights drifting slowly behind everything,
 * so the glass has something to refract. Transform-only layers; paused when the tab is hidden,
 * still with reduced motion (CSS).
 */
export function Aurora() {
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => { if (document.hidden) root.dataset.auroraPaused = "true"; else delete root.dataset.auroraPaused; };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  return (
    <div className="aurora" aria-hidden="true">
      <span className="aurora-light aurora-a" />
      <span className="aurora-light aurora-b" />
      <span className="aurora-light aurora-c" />
    </div>
  );
}
