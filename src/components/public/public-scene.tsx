"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { sceneStore, type SceneMode } from "./scene-store";

type Engine = { setTarget: (mode: SceneMode, scroll: number) => void; dispose: () => void };

const serverState = { mode: null, progress: 0 } as const;

// Mounted once in the root layout so the same canvas survives navigation between
// public routes (landing to login is a camera move, not a cut). Three.js loads only here.
export function PublicScene() {
  const state = useSyncExternalStore(sceneStore.subscribe, sceneStore.get, () => serverState);
  const active = state.mode !== null;
  return active ? <SceneCanvas mode={state.mode as SceneMode} /> : null;
}

function SceneCanvas({ mode }: { mode: SceneMode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lite = window.matchMedia("(max-width: 767px)").matches || (navigator.hardwareConcurrency ?? 8) <= 4;
    const wide = () => window.matchMedia("(min-width: 1024px)").matches;
    let unsubscribe = () => {};

    import("./scene-engine")
      .then(({ createFluxaScene }) => {
        if (cancelled) return;
        const engine = createFluxaScene(canvas, { lite, reducedMotion, wide });
        engineRef.current = engine;
        const sync = () => {
          const { mode, progress } = sceneStore.get();
          if (mode) engine.setTarget(mode, progress);
        };
        sync();
        unsubscribe = sceneStore.subscribe(sync);
        window.addEventListener("resize", sync);
        const previous = unsubscribe;
        unsubscribe = () => { previous(); window.removeEventListener("resize", sync); };
        requestAnimationFrame(() => setReady(true));
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      unsubscribe();
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <div aria-hidden="true" className="public-scene" data-mode={mode}>
      {!failed && <canvas ref={canvasRef} data-ready={ready} />}
    </div>
  );
}
