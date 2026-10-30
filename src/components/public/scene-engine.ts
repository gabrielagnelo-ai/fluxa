import * as THREE from "three";
import { exampleCategories, exampleSpent } from "./example-month";
import type { SceneMode } from "./scene-store";

// Each slab is one transaction. Scroll progress moves every slab between six arrangements:
// 0 loose transactions, 1 imported statement, 2 rows by category, 3 bars by spend,
// 4 bars against their limits, 5 the settled pose shared by the final call and the auth pages.
const LAYOUTS = 6;
const STEP = 0.075;
const BAR_GAP = 1.35;
const ROW_GAP = 0.34;

const CAMERA: Array<{ pos: [number, number, number]; look: [number, number, number] }> = [
  { pos: [0, 2.4, 9.5], look: [0, 2.2, -2.5] },
  { pos: [3.6, 4.6, 8.2], look: [0, 3.1, 0] },
  { pos: [5.2, 7.4, 6.4], look: [0, 0, -5.5] },
  { pos: [-5.4, 3.1, 8.2], look: [-1.4, 1.5, 0] },
  { pos: [4.6, 2.7, 6.6], look: [0.6, 2, 0] },
  { pos: [0.4, 1.3, 11.5], look: [0, 1.7, 0] }
];

// Narrow screens (phones): rows and limits re-framed so the object sits centred in the upper band.
const CAMERA_NARROW: Partial<Record<number, { pos: [number, number, number]; look: [number, number, number] }>> = {
  2: { pos: [1.2, 8.6, 5.2], look: [0, 0, -4.2] },
  4: { pos: [0.4, 3.4, 10.5], look: [0, 1.5, 0] }
};

const NEUTRAL = new THREE.Color("#12203d");
// Logo gradient, measured in public/branding/fluxa-logo.png.
const CATEGORY_COLORS = ["#38c0f8", "#1ea7fd", "#0080f8", "#024bcf", "#0033af"].map((hex) => new THREE.Color(hex));

type Options = { lite: boolean; reducedMotion: boolean; wide: () => boolean };

function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function createFluxaScene(canvas: HTMLCanvasElement, options: Options) {
  const { lite, reducedMotion } = options;
  const total = lite ? 36 : 90;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lite ? 1 : 1.75));
  renderer.setClearColor(0x000000, 0);
  // Tone mapping keeps highlights inside the logo blues instead of clipping to cyan (principle 16).
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05080f, 10, 30);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);

  // Light colours come from the logo too; white light would wash the blues out.
  scene.add(new THREE.HemisphereLight(0x80d8f8, 0x05080f, 0.8));
  const key = new THREE.DirectionalLight(0x90c8ff, 1.2);
  key.position.set(-4, 9, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0x0080f8, 6, 14, 1.6);
  rim.position.set(3, 4, -3);
  scene.add(rim);

  // Slabs per category follow the share of spending, so bar heights are honest.
  const counts = exampleCategories.map((item) => Math.max(2, Math.round((item.spent / exampleSpent) * total)));
  counts[0] += total - counts.reduce((sum, value) => sum + value, 0);
  const categoryOf: number[] = [];
  const indexInCategory: number[] = [];
  counts.forEach((count, category) => {
    for (let index = 0; index < count; index += 1) {
      categoryOf.push(category);
      indexInCategory.push(index);
    }
  });

  const random = seeded(7);
  const order = categoryOf.map((_, index) => index).sort(() => random() - 0.5);
  const statementSlot: number[] = [];
  order.forEach((slab, slot) => { statementSlot[slab] = slot; });
  const highlighted = categoryOf.map(() => random() < 0.12);

  // layouts[l][i] = [x, y, z, rotX, rotY, rotZ]
  const layouts: number[][][] = Array.from({ length: LAYOUTS }, () => []);
  for (let i = 0; i < total; i += 1) {
    const category = categoryOf[i];
    const index = indexInCategory[i];
    const barX = (category - 2) * BAR_GAP;
    layouts[0].push([(lite ? 0 : 3.4) + (random() - 0.5) * (lite ? 6.5 : 4.6), 0.4 + random() * 4.2, -1.5 - random() * 4, random() * 3, random() * 3, random() * 3]);
    layouts[1].push([(random() - 0.5) * 0.06, statementSlot[i] * STEP * (lite ? 2 : 1), 0, 0, (random() - 0.5) * 0.12, 0]);
    layouts[2].push([barX, 0.03, -index * ROW_GAP * (lite ? 2 : 1), 0, 0, 0]);
    layouts[3].push([barX, index * STEP * (lite ? 2.4 : 1), 0, 0, 0, 0]);
    layouts[4].push([barX, index * STEP * (lite ? 2.4 : 1), 0, 0, (index % 2) * 0.04, 0]);
    layouts[5].push([barX, index * STEP * (lite ? 2.4 : 1), 0, 0, 0, 0]);
  }

  const geometry = new THREE.BoxGeometry(1.05, 0.045, 0.66);
  const material = new THREE.MeshStandardMaterial({ roughness: 0.38, metalness: 0.25 });
  const slabs = new THREE.InstancedMesh(geometry, material, total);
  slabs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(slabs);

  // Limit markers above each bar (chapter 4) and the horizon line from the opening.
  const limitPoints: number[] = [];
  exampleCategories.forEach((item, category) => {
    const height = (item.planned / item.spent) * counts[category] * STEP * (lite ? 2.4 : 1);
    const x = (category - 2) * BAR_GAP;
    limitPoints.push(x - 0.68, height, 0, x + 0.68, height, 0);
  });
  const limitMaterial = new THREE.LineBasicMaterial({ color: 0x38c0f8, transparent: true, opacity: 0 });
  const limits = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(limitPoints, 3)), limitMaterial);
  scene.add(limits);

  const horizonMaterial = new THREE.LineBasicMaterial({ color: 0x0080f8, transparent: true, opacity: 0.4 });
  const horizon = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([-60, 0, -9, 60, 0, -9], 3)), horizonMaterial);
  scene.add(horizon);

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const from = new THREE.Color();
  const to = new THREE.Color();
  const cameraPos = new THREE.Vector3(...CAMERA[0].pos);
  const cameraLook = new THREE.Vector3(...CAMERA[0].look);
  const targetPos = new THREE.Vector3();
  const targetLook = new THREE.Vector3();
  const pointer = new THREE.Vector2();

  let progress = 0;
  let targetProgress = 0;
  let shift = 0;
  let targetShift = 0;
  let width = 1;
  let height = 1;
  let frame = 0;
  let last = 0;
  let dirty = true;
  let disposed = false;

  function colorFor(layout: number, i: number, out: THREE.Color) {
    if (layout <= 1) return out.copy(highlighted[i] ? CATEGORY_COLORS[0] : NEUTRAL);
    const base = CATEGORY_COLORS[categoryOf[i]];
    // Chapter 4: the category close to its limit stays bright, the others step back.
    if (layout === 4 && categoryOf[i] !== 0) return out.copy(base).lerp(NEUTRAL, 0.55);
    return out.copy(base);
  }

  function place(time: number) {
    const clamped = Math.min(LAYOUTS - 1, Math.max(0, progress));
    const a = Math.floor(clamped);
    const b = Math.min(LAYOUTS - 1, a + 1);
    const t = clamped - a;
    const looseWeight = Math.max(0, 1 - clamped);
    for (let i = 0; i < total; i += 1) {
      const delay = (statementSlot[i] / total) * 0.35;
      const local = ease(Math.min(1, Math.max(0, (t - delay) / 0.65)));
      const p = layouts[a][i];
      const q = layouts[b][i];
      const float = reducedMotion ? 0 : Math.sin(time * 0.0008 + i) * 0.06 * looseWeight;
      dummy.position.set(p[0] + (q[0] - p[0]) * local, p[1] + (q[1] - p[1]) * local + float, p[2] + (q[2] - p[2]) * local);
      dummy.rotation.set(p[3] + (q[3] - p[3]) * local, p[4] + (q[4] - p[4]) * local + (reducedMotion ? 0 : time * 0.00012 * looseWeight), p[5] + (q[5] - p[5]) * local);
      dummy.updateMatrix();
      slabs.setMatrixAt(i, dummy.matrix);
      colorFor(a, i, from);
      colorFor(b, i, to);
      slabs.setColorAt(i, color.copy(from).lerp(to, local));
    }
    slabs.instanceMatrix.needsUpdate = true;
    if (slabs.instanceColor) slabs.instanceColor.needsUpdate = true;
    limitMaterial.opacity = Math.max(0, 1 - Math.abs(clamped - 4)) * 0.9 + Math.max(0, clamped - 4) * 0.35;
  }

  function cameraTarget() {
    const clamped = Math.min(LAYOUTS - 1, Math.max(0, progress));
    const a = Math.floor(clamped);
    const b = Math.min(LAYOUTS - 1, a + 1);
    const t = ease(clamped - a);
    const narrow = width < height;
    const frameA = (narrow && CAMERA_NARROW[a]) || CAMERA[a];
    const frameB = (narrow && CAMERA_NARROW[b]) || CAMERA[b];
    targetPos.set(...frameA.pos).lerp(new THREE.Vector3(...frameB.pos), t);
    targetLook.set(...frameA.look).lerp(new THREE.Vector3(...frameB.look), t);
    // Narrow screens: pull the camera back so the five bars fit the width.
    const aspect = width / height;
    if (aspect < 1) targetPos.sub(targetLook).multiplyScalar(Math.min(2.3, Math.max(1, 0.95 / aspect))).add(targetLook);
    if (!lite && !reducedMotion) targetPos.add(new THREE.Vector3(pointer.x * 0.35, pointer.y * 0.2, 0));
  }

  function resize() {
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    dirty = true;
    start();
  }

  function tick(time: number) {
    frame = 0;
    if (disposed) return;
    if (lite && time - last < 30) { start(); return; }
    const delta = Math.min(64, time - last || 16);
    last = time;
    const k = reducedMotion ? 1 : 1 - Math.pow(0.0025, delta / 1000);
    const before = progress;
    progress += (targetProgress - progress) * k;
    shift += (targetShift - shift) * k;
    if (Math.abs(targetProgress - progress) < 0.0004) progress = targetProgress;
    if (Math.abs(targetShift - shift) < 0.0004) shift = targetShift;
    cameraTarget();
    const moving = before !== progress || cameraPos.distanceToSquared(targetPos) > 0.00001;
    cameraPos.lerp(targetPos, reducedMotion ? 1 : Math.min(1, k * 1.2));
    cameraLook.lerp(targetLook, reducedMotion ? 1 : Math.min(1, k * 1.2));
    const ambient = !reducedMotion && progress < 1;
    if (moving || ambient || dirty || shift !== targetShift) {
      place(time);
      camera.position.copy(cameraPos);
      camera.lookAt(cameraLook);
      // Phones: lift the scene into the upper part of the screen, above the copy.
      camera.setViewOffset(width, height, -shift * width, width < height ? height * 0.14 : 0, width, height);
      renderer.render(scene, camera);
      dirty = false;
      start();
    }
  }

  function start() {
    if (!frame && !disposed) frame = requestAnimationFrame(tick);
  }

  function onPointer(event: PointerEvent) {
    pointer.set(event.clientX / window.innerWidth - 0.5, 0.5 - event.clientY / window.innerHeight);
    start();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  if (!lite && !reducedMotion) window.addEventListener("pointermove", onPointer, { passive: true });
  resize();

  return {
    setTarget(mode: SceneMode, scroll: number) {
      const wide = options.wide();
      targetProgress = mode === "landing" ? scroll : mode === "auth" ? 5 : 0;
      // Frame shift keeps the scene clear of the copy column on wide screens.
      targetShift = !wide ? 0 : mode === "auth" ? -0.2 : targetProgress > 4.5 ? 0.27 : 0.2;
      dirty = true;
      start();
    },
    resize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointer);
      geometry.dispose();
      material.dispose();
      limits.geometry.dispose();
      limitMaterial.dispose();
      horizon.geometry.dispose();
      horizonMaterial.dispose();
      renderer.dispose();
    }
  };
}
