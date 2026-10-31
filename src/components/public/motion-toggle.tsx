"use client";

import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";

const KEY = "fluxa-landing-motion";
export const MOTION_EVENT = "fluxa:motion";

export function landingMotionPaused() {
  return typeof document !== "undefined" && document.documentElement.dataset.motion === "paused";
}

/** WCAG 2.2.2: the looping phone and cards can be paused; the choice is remembered. Motion stays on by default. */
export function MotionToggle() {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    let saved = false;
    try { saved = window.localStorage.getItem(KEY) === "paused"; } catch { /* Default on. */ }
    if (saved) document.documentElement.dataset.motion = "paused";
    setPaused(saved);
  }, []);
  const toggle = () => {
    const next = !paused;
    if (next) document.documentElement.dataset.motion = "paused"; else delete document.documentElement.dataset.motion;
    try { window.localStorage.setItem(KEY, next ? "paused" : "playing"); } catch { /* The choice holds for this visit. */ }
    setPaused(next);
    window.dispatchEvent(new Event(MOTION_EVENT));
  };
  return (
    <button type="button" className="btn btn-gray motion-toggle" aria-pressed={paused} onClick={toggle}>
      {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}{paused ? "Retomar animação" : "Pausar animação"}
    </button>
  );
}
