// Tiny external store shared by public routes and the persistent 3D scene.
// Pages declare a mode; the landing page also writes its scroll progress (0 to 5).
export type SceneMode = "landing" | "auth" | "lost";

type SceneState = { mode: SceneMode | null; progress: number };

let state: SceneState = { mode: null, progress: 0 };
let claim = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export const sceneStore = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  claim(mode: SceneMode) {
    claim += 1;
    const token = claim;
    if (state.mode !== mode) {
      state = { ...state, mode };
      emit();
    }
    return token;
  },
  // Released with a delay so client navigation between public routes keeps the canvas alive.
  release(token: number) {
    window.setTimeout(() => {
      if (token !== claim) return;
      state = { mode: null, progress: 0 };
      emit();
    }, 400);
  },
  setProgress(progress: number) {
    if (Math.abs(progress - state.progress) < 0.0005) return;
    state = { ...state, progress };
    emit();
  }
};
