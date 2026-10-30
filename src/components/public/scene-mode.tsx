"use client";

import { useEffect } from "react";
import { sceneStore, type SceneMode as Mode } from "./scene-store";

export function SceneMode({ mode }: { mode: Mode }) {
  useEffect(() => {
    const token = sceneStore.claim(mode);
    return () => sceneStore.release(token);
  }, [mode]);
  return null;
}
