"use client";
/* Scene 02 - cinematic 3D reef (Three.js). Scroll progress (0..1) dives the camera forward and down through
   atmospheric reef layers, 3D coral, swaying kelp, translucent jellyfish, a swimming turtle and a cheerful octopus.
   Lighting: warm top light, caustics on the seabed, soft volumetric shafts; depth fog shifts from turquoise to deep blue. */
import { MutableRefObject, ReactNode, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { makeSafe, reportFail } from "@/lib/safeRender";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { causticCanvas } from "@/lib/caustics";

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const FLOOR_Y = -6;
const C = (h: string) => new THREE.Color(h);
export const mat = (color: string, o: THREE.MeshPhysicalMaterialParameters = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.4, sheen: 0.5, sheenColor: C("#ffffff"), ...o });

/* ---------- reef ridge silhouettes (atmospheric depth layers) ---------- */
export function ridge(seed: number, width: number, base: number, amp: number, top: string, bottom: string) {
  const r = rng(seed), p1 = r() * 6, p2 = r() * 6, p3 = r() * 6;
  const N = 140, pos: number[] = [], col: number[] = [], idx: number[] = [], ct = C(top), cb = C(bottom);
  for (let i = 0; i <= N; i++) {
    const x = (i / N - 0.5) * width, u = x * 0.05;
    const h = base + amp * (0.5 * Math.sin(u * 1.1 + p1) + 0.3 * Math.sin(u * 2.7 + p2) + 0.18 * Math.sin(u * 6.3 + p3) + 0.35);
    pos.push(x, h, 0, x, base - amp * 2.2, 0); col.push(ct.r, ct.g, ct.b, cb.r, cb.g, cb.b);
    if (i < N) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
  return g;
}

/* ---------- coral families ---------- */
export function branchCoral(seed: number, depth = 4) {
  const r = rng(seed), parts: THREE.BufferGeometry[] = [];
  const grow = (o: THREE.Vector3, d: THREE.Vector3, len: number, rad: number, lvl: number) => {
    const mid = o.clone().addScaledVector(d, len * 0.5).add(new THREE.Vector3((r() - 0.5) * len * 0.2, 0, (r() - 0.5) * len * 0.2));
    const end = o.clone().addScaledVector(d, len);
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([o, mid, end]), 8, rad, 7));
    parts.push(new THREE.SphereGeometry(rad * 1.12, 8, 6).translate(end.x, end.y, end.z));
    if (lvl >= depth) return;
    const kids = lvl === 0 ? 3 : 2;
    for (let k = 0; k < kids; k++) {
      const nd = d.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), (r() - 0.5) * 1.1).applyAxisAngle(new THREE.Vector3(0, 0, 1), (r() - 0.5) * 1.1 + (k - 0.5) * 0.35).normalize();
      nd.y = Math.max(nd.y, 0.35); nd.normalize();
      grow(end, nd, len * 0.72, rad * 0.72, lvl + 1);
    }
  };
  grow(new THREE.Vector3(0, -0.1, 0), new THREE.Vector3(0, 1, 0), 1.3, 0.17, 0);
  const g = mergeGeometries(parts.map((p) => { const q = p.index ? p : p; return q; }))!;
  return g;
}
export function tubeCoral(seed: number) {
  const r = rng(seed), parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const h = 1.2 + r() * 2.2, rad = 0.22 + r() * 0.16, a = r() * 6.28, d = r() * 0.55;
    const c = new THREE.CylinderGeometry(rad * 1.12, rad, h, 14, 1, true); c.translate(Math.cos(a) * d, h / 2 - 0.1, Math.sin(a) * d); parts.push(c);
    const lip = new THREE.TorusGeometry(rad * 1.12, rad * 0.16, 8, 16); lip.rotateX(Math.PI / 2); lip.translate(Math.cos(a) * d, h - 0.1, Math.sin(a) * d); parts.push(lip);
    const cap = new THREE.CircleGeometry(rad * 0.98, 14); cap.rotateX(-Math.PI / 2); cap.translate(Math.cos(a) * d, h - 0.35, Math.sin(a) * d); parts.push(cap);
  }
  return mergeGeometries(parts)!;
}
export function brainCoral(seed: number) {
  const r = rng(seed), g = new THREE.SphereGeometry(1, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.6), p = g.attributes.position, ph = r() * 6;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = Math.sin(v.x * 9 + ph) * Math.sin(v.z * 9 - ph) + Math.sin((v.x + v.z) * 6) * 0.5; v.multiplyScalar(1 + 0.05 * n); p.setXYZ(i, v.x * 1.3, v.y * 0.75, v.z * 1.3); }
  g.computeVertexNormals(); return g;
}

/* ---------- characters ---------- */
function eyes(parent: THREE.Object3D, x: number, y: number, z: number, s: number) {
  const white = new THREE.MeshPhysicalMaterial({ color: "#fff", roughness: 0.15, clearcoat: 1 }), black = new THREE.MeshStandardMaterial({ color: "#1d1540", roughness: 0.2 });
  for (const sd of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(s, 20, 16), white); e.position.set(sd * x, y, z);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(s * 0.62, 16, 12), black); pu.position.set(0, -s * 0.04, s * 0.5);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(s * 0.2, 8, 8), new THREE.MeshBasicMaterial({ color: "#fff" })); hl.position.set(s * 0.22, s * 0.28, s * 0.98);
    e.add(pu, hl); parent.add(e);
  }
}
export function hexTexture() {
  const c = document.createElement("canvas"); c.width = 512; c.height = 512; const g = c.getContext("2d")!;
  g.fillStyle = "#f5c9a0"; g.fillRect(0, 0, 512, 512);
  const R = 46, h = R * Math.sqrt(3);
  for (let row = -1; row < 7; row++) for (let col = -1; col < 8; col++) {
    const x = col * R * 1.5, y = row * h + (col % 2 ? h / 2 : 0);
    g.beginPath(); for (let k = 0; k < 6; k++) { const a = (Math.PI / 3) * k; g.lineTo(x + (R - 4) * Math.cos(a), y + (R - 4) * Math.sin(a)); } g.closePath();
    const gr = g.createRadialGradient(x - 8, y - 8, 4, x, y, R); gr.addColorStop(0, "#ffe1c4"); gr.addColorStop(1, "#e9a577"); g.fillStyle = gr; g.fill(); g.lineWidth = 5; g.strokeStyle = "#b86f4c"; g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1.4); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
export function makeTurtle(tex: THREE.Texture) {
  const g = new THREE.Group();
  const shellM = mat("#ffffff", { map: tex, bumpMap: tex, bumpScale: 1.5, roughness: 0.35, clearcoat: 0.8 });
  const skin = mat("#a6e3c4", { roughness: 0.55 }), belly = mat("#fff0d8");
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.55), shellM); shell.scale.set(1.0, 0.7, 1.3); shell.position.y = 0.05; g.add(shell);
  const rimM = new THREE.Mesh(new THREE.TorusGeometry(1, 0.07, 10, 40), mat("#fff1dc")); rimM.rotation.x = Math.PI / 2; rimM.scale.set(1.0, 1.3, 1); rimM.position.y = 0.05; g.add(rimM);
  const bel = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 16), belly); bel.scale.set(0.92, 0.3, 1.2); bel.position.y = -0.02; g.add(bel);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 26, 20), skin); head.position.set(0, 0.12, 1.5); head.scale.set(1, 0.95, 1.1); g.add(head);
  const neck = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 14), skin); neck.position.set(0, 0.06, 1.2); g.add(neck);
  eyes(head, 0.22, 0.1, 0.3, 0.12);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.014, 6, 14, Math.PI), new THREE.MeshBasicMaterial({ color: "#5a3a6a" })); smile.position.set(0, -0.1, 0.4); smile.rotation.z = Math.PI; head.add(smile);
  const blush = new THREE.MeshBasicMaterial({ color: "#ffb4cf", transparent: true, opacity: 0.6 });
  for (const sd of [-1, 1]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), blush); b.scale.z = 0.4; b.position.set(sd * 0.3, -0.04, 0.32); head.add(b); }
  const fl: THREE.Group[] = [];
  const mk = (x: number, z: number, big: boolean, side: number) => {
    const p = new THREE.Group(); p.position.set(x * side, -0.02, z);
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), skin); const L = big ? 1.15 : 0.6; m.scale.set(L, 0.1, big ? 0.42 : 0.3); m.position.x = side * L * 0.8; p.add(m); g.add(p); fl.push(p); (p as unknown as { side: number }).side = side;
  };
  mk(0.7, 0.7, true, 1); mk(0.7, 0.7, true, -1); mk(0.55, -0.95, false, 1); mk(0.55, -0.95, false, -1);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 10), skin); tail.rotation.x = -Math.PI / 2; tail.position.set(0, 0, -1.55); g.add(tail);
  return { g, fl, head };
}
export function makeOctopus() {
  const g = new THREE.Group(), body = mat("#cdaef5", { roughness: 0.38, clearcoat: 0.9, sheen: 0.8, sheenColor: C("#ffd9f1") });
  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 30), body); head.scale.set(1, 1.15, 0.98); head.position.y = 1.5; g.add(head);
  // spots
  const spot = mat("#e9d2ff", { roughness: 0.5 }), r = rng(8);
  for (let i = 0; i < 9; i++) { const a = r() * 6.28, b = 0.15 + r() * 0.6; const s = new THREE.Mesh(new THREE.SphereGeometry(0.1 + r() * 0.07, 10, 8), spot); const v = new THREE.Vector3(Math.cos(a) * Math.cos(b), Math.sin(b) + 0.1, -Math.abs(Math.sin(a) * Math.cos(b)) - 0.1).normalize(); s.position.copy(v).multiply(new THREE.Vector3(1, 1.15, 0.98)).add(new THREE.Vector3(0, 1.5, 0)); s.scale.setScalar(0.9); g.add(s); }
  eyes(head, 0.36, -0.02, 0.86, 0.26);
  const blush = new THREE.MeshBasicMaterial({ color: "#ff9fc8", transparent: true, opacity: 0.55 });
  for (const sd of [-1, 1]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), blush); b.scale.z = 0.35; b.position.set(sd * 0.62, -0.28, 0.76); head.add(b); }
  const sm = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.022, 8, 16, Math.PI), new THREE.MeshBasicMaterial({ color: "#6a3d85" })); sm.position.set(0, -0.3, 0.93); sm.rotation.z = Math.PI; head.add(sm);
  const tents: THREE.Group[][] = [];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2, root = new THREE.Group(); root.position.set(Math.cos(a) * 0.55, 0.7, Math.sin(a) * 0.5); root.rotation.y = -a + Math.PI / 2; root.rotation.x = 0.0; g.add(root);
    const chain: THREE.Group[] = []; let parent: THREE.Object3D = root;
    for (let i = 0; i < 9; i++) {
      const rad = 0.3 * (1 - i / 11) + 0.04, seg = new THREE.Group(); parent.add(seg);
      const m = new THREE.Mesh(new THREE.SphereGeometry(rad, 14, 10), body); m.position.y = -rad * 0.55; seg.add(m);
      if (i % 2 === 0 && i > 1) { const sc = new THREE.Mesh(new THREE.SphereGeometry(rad * 0.38, 8, 6), mat("#ffd6ea")); sc.position.set(0, -rad * 0.55, rad * 0.8); seg.add(sc); }
      const next = new THREE.Group(); next.position.y = -rad * 1.05; seg.add(next); parent = next; chain.push(seg);
    }
    root.rotation.z = 0; chain[0].rotation.x = 0.9; tents.push(chain);
  }
  return { g, head, tents };
}
export function makeJelly(r: () => number, tint: string) {
  const g = new THREE.Group();
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.58), new THREE.MeshPhysicalMaterial({ color: tint, transparent: true, opacity: 0.55, roughness: 0.1, clearcoat: 1, iridescence: 1, emissive: C(tint), emissiveIntensity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  bell.scale.y = 0.85; g.add(bell);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); core.position.y = 0.1; g.add(core);
  const tm = new THREE.MeshPhysicalMaterial({ color: tint, transparent: true, opacity: 0.5, roughness: 0.2, emissive: C(tint), emissiveIntensity: 0.25, depthWrite: false });
  const tents: THREE.Mesh[] = [];
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * 6.28, rr = 0.4 * (0.6 + r() * 0.4), len = 1.4 + r() * 1.5;
    const pts = [0, 1, 2, 3, 4].map((j) => new THREE.Vector3(Math.cos(a) * rr + Math.sin(j * 1.3 + k) * 0.08, -0.02 - (len * j) / 4, Math.sin(a) * rr + Math.cos(j * 1.1 + k) * 0.08));
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 18, 0.022, 5), tm); g.add(m); tents.push(m);
  }
  const face = new THREE.MeshBasicMaterial({ color: "#6a4a94" });
  for (const sd of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), face); e.position.set(sd * 0.17, 0.1, 0.5); g.add(e); }
  return { g, bell, core, tents };
}

function seaweedBlade(h: number) { const g = new THREE.PlaneGeometry(0.5, h, 1, 14); g.translate(0, h / 2, 0); return g; }

export default function Dive3D({ progress, fallback }: { progress: MutableRefObject<number>; fallback?: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current; if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: (window.devicePixelRatio || 1) < 1.5, powerPreference: "high-performance" }); } catch (e) { reportFail("Dive3D WebGL context: " + String(e)); setFailed(true); return; }
    const small = window.innerWidth < 760, reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block" });
    el.appendChild(renderer.domElement);
    let raf = 0, cleanup = () => {};
    try {
      const disposables: { dispose(): void }[] = [renderer];
      const scene = new THREE.Scene();
      const pm = new THREE.PMREMGenerator(renderer); try { scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; } catch (e) { console.warn("3D: environment map unavailable", e); } scene.environmentIntensity = 0.55; disposables.push(pm);
      scene.fog = new THREE.FogExp2(C("#4fbbe6"), 0.022);
      scene.add(new THREE.HemisphereLight("#bdf1ff", "#f4c9e0", 0.8));
      const sun = new THREE.DirectionalLight("#fff4de", 2.0); sun.position.set(-4, 14, 8); scene.add(sun);
      const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 160); scene.add(camera);

      /* gradient water backdrop that rides with the camera and darkens with depth */
      const bgGeo = new THREE.PlaneGeometry(1, 1), bgCol = new Float32Array(4 * 3); bgGeo.setAttribute("color", new THREE.BufferAttribute(bgCol, 3));
      const bg = new THREE.Mesh(bgGeo, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, depthWrite: false, toneMapped: false }));
      bg.position.z = -120; bg.renderOrder = -10; camera.add(bg);
      const sunGlow = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshBasicMaterial({ map: (() => { const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!; const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, "rgba(255,255,255,.95)"); gr.addColorStop(0.2, "rgba(255,248,230,.5)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); disposables.push(t); return t; })(), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      sunGlow.position.set(0, 38, -112); sunGlow.renderOrder = -9; camera.add(sunGlow);
      const topA = C("#a9ecf8"), midA = C("#4fbbe6"), botA = C("#2b87cf"), topB = C("#4fa0dc"), midB = C("#2b6fc0"), botB = C("#26459a");

      /* reef ridges: five fogged layers give distance */
      const ridgeDefs: [number, number, number, number, string, string, number][] = [[-95, 220, -9, 7, "#a7d9ef", "#7fc4e6", 3], [-70, 200, -8, 6, "#8fcbec", "#68b4e2", 7], [-48, 160, -7.2, 5, "#80bff0", "#5ba4de", 11], [-30, 120, -6.6, 3.6, "#8bb8ee", "#6c9fe0", 19]];
      for (const [z, w, b, a, t, bt, seed] of ridgeDefs) { const g = ridge(seed, w, b, a, t, bt); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: true, side: THREE.DoubleSide })); m.position.z = z; scene.add(m); disposables.push(g, m.material as THREE.Material); }

      /* seabed with caustics */
      const floorGeo = new THREE.PlaneGeometry(180, 150, 90, 75), fp = floorGeo.attributes.position, fr = rng(4);
      const ph = [fr() * 6, fr() * 6];
      for (let i = 0; i < fp.count; i++) { const x = fp.getX(i), y = fp.getY(i); fp.setZ(i, 0.5 * Math.sin(x * 0.18 + ph[0]) * Math.cos(y * 0.15 + ph[1]) + 0.25 * Math.sin(x * 0.5 + y * 0.4)); }
      floorGeo.computeVertexNormals();
      const floor = new THREE.Mesh(floorGeo, mat("#f6dfc0", { roughness: 0.9, clearcoat: 0, sheen: 0.2 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, FLOOR_Y, -45); scene.add(floor);
      const cTex = new THREE.CanvasTexture(causticCanvas(256)); cTex.wrapS = cTex.wrapT = THREE.RepeatWrapping; cTex.repeat.set(14, 11); cTex.colorSpace = THREE.SRGBColorSpace;
      const cMesh = new THREE.Mesh(floorGeo, new THREE.MeshBasicMaterial({ map: cTex, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, fog: true })); cMesh.rotation.copy(floor.rotation); cMesh.position.copy(floor.position); cMesh.position.y += 0.03; scene.add(cMesh);
      disposables.push(floorGeo, floor.material as THREE.Material, cTex, cMesh.material as THREE.Material);

      /* corals */
      const pal = [["#f7b6d3", "#f08fbb"], ["#cdb6f3", "#b093e6"], ["#bfe3f7", "#8cc6ee"], ["#ffd2b6", "#f2a98a"], ["#c8f0de", "#8dd8bd"]];
      const coralGeos = [0, 1, 2].map((i) => branchCoral(30 + i)), tubeGeos = [0, 1].map((i) => tubeCoral(60 + i)), brain = [brainCoral(5), brainCoral(9)];
      disposables.push(...coralGeos, ...tubeGeos, ...brain);
      const mats: THREE.Material[] = pal.map(([a, b]) => mat(b, { emissive: C(a), emissiveIntensity: 0.12, roughness: 0.5 })); disposables.push(...mats);
      const cr = rng(77), nCoral = small ? 26 : 44, corals = new THREE.Group(); scene.add(corals);
      for (let i = 0; i < nCoral; i++) {
        const side = cr() < 0.5 ? -1 : 1, z = 10 - cr() * 52, x = side * (3.6 + cr() * 26 * (z < -20 ? 1.4 : 1)), kind = cr();
        const m = mats[Math.floor(cr() * mats.length)];
        const geo = kind < 0.45 ? coralGeos[Math.floor(cr() * 3)] : kind < 0.75 ? tubeGeos[Math.floor(cr() * 2)] : brain[Math.floor(cr() * 2)];
        const mesh = new THREE.Mesh(geo, m); const s = (0.9 + cr() * 1.6) * (z < -20 ? 1.4 : 1);
        mesh.scale.set(s, s * (0.9 + cr() * 0.4), s); mesh.rotation.y = cr() * 6.28; mesh.position.set(x, FLOOR_Y + 0.15 + (kind > 0.75 ? 0.2 : 0), z); corals.add(mesh);
      }
      /* big hero coral framing the scene */
      for (const [x, z, gi, mi, s] of [[-7, -5, 0, 0, 2.6], [8, -9, 1, 1, 3], [-11, -16, 2, 2, 3.2], [12, -22, 0, 3, 3.6]] as [number, number, number, number, number][]) {
        const m = new THREE.Mesh(coralGeos[gi], mats[mi]); m.scale.setScalar(s); m.position.set(x, FLOOR_Y + 0.1, z); corals.add(m);
      }

      /* kelp */
      const kelpM = new THREE.MeshPhysicalMaterial({ color: "#a8e5c8", roughness: 0.5, side: THREE.DoubleSide, emissive: C("#8fd9c0"), emissiveIntensity: 0.12 });
      const kelp: { m: THREE.Mesh; base: Float32Array; ph: number; amp: number }[] = [];
      const kr = rng(12), nKelp = small ? 14 : 26;
      for (let i = 0; i < nKelp; i++) {
        const h = 3 + kr() * 4, g = seaweedBlade(h), m = new THREE.Mesh(g, kelpM); m.position.set((kr() < 0.5 ? -1 : 1) * (3 + kr() * 20), FLOOR_Y, 6 - kr() * 46); m.rotation.y = kr() * 3; m.scale.x = 0.6 + kr() * 0.7;
        scene.add(m); kelp.push({ m, base: Float32Array.from(g.attributes.position.array as Float32Array), ph: kr() * 6, amp: 0.25 + kr() * 0.3 }); disposables.push(g);
      }
      disposables.push(kelpM);

      /* characters */
      const turtleTex = hexTexture(); disposables.push(turtleTex);
      const turtle = makeTurtle(turtleTex); turtle.g.scale.setScalar(1.35); scene.add(turtle.g);
      const octo = makeOctopus(); octo.g.scale.setScalar(1.35); octo.g.position.set(small ? -3.6 : -6.2, FLOOR_Y + 0.4, -9.5); octo.g.rotation.y = 0.55; scene.add(octo.g);
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 1), mat("#d4c2ec", { roughness: 0.7 })); rock.scale.set(1.4, 0.7, 1); rock.position.set(small ? -4 : -6.6, FLOOR_Y + 0.3, -9.2); scene.add(rock); disposables.push(rock.geometry, rock.material as THREE.Material);
      const jr = rng(91), jellies = [[-9, 2, -8, "#ffc6e4", 1.5], [10, 3.2, -14, "#d9c8ff", 2], [4, -1, -5, "#bfe6ff", 1.1], [-3.5, 4.5, -20, "#ffd2ea", 2.2], [-13, 0, -26, "#c9f1e3", 2.4], [14, -1, -4, "#ffd7ee", 1.3]]
        .slice(0, small ? 4 : 6).map(([x, y, z, tint, s]) => { const j = makeJelly(jr, tint as string); j.g.scale.setScalar(s as number); j.g.position.set(x as number, y as number, z as number); scene.add(j.g); return { ...j, ph: jr() * 6, x: x as number, y: y as number }; });

      /* fish school */
      const fb = new THREE.SphereGeometry(0.2, 12, 10); fb.scale(1.7, 0.95, 0.55); const ft2 = new THREE.ConeGeometry(0.17, 0.3, 8); ft2.scale(1, 1, 0.3); ft2.rotateZ(Math.PI / 2); ft2.translate(-0.42, 0, 0); const fishGeo = mergeGeometries([fb, ft2])!;
      const nFish = small ? 14 : 28, fish = new THREE.InstancedMesh(fishGeo, mat("#ffffff", { roughness: 0.4 }), nFish), fd = new THREE.Object3D(), fc = ["#ffb48f", "#ffd29a", "#a9d6f7"], fRng = rng(3);
      const fishData = Array.from({ length: nFish }, (_, i) => { fish.setColorAt(i, C(fc[i % 3])); return { a: fRng() * 6.28, r: 1 + fRng() * 2.2, y: fRng() * 2.2, s: 0.6 + fRng() * 0.6, o: fRng() * 6 }; });
      scene.add(fish); disposables.push(fishGeo);

      /* soft volumetric shafts: wide additive fans, varied width/angle, fade out with depth */
      const shaftTex = (() => { const c = document.createElement("canvas"); c.width = 64; c.height = 256; const g = c.getContext("2d")!; const gh = g.createLinearGradient(0, 0, 64, 0); gh.addColorStop(0, "rgba(255,255,255,0)"); gh.addColorStop(0.5, "rgba(255,255,255,1)"); gh.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gh; g.fillRect(0, 0, 64, 256); g.globalCompositeOperation = "destination-in"; const gv = g.createLinearGradient(0, 0, 0, 256); gv.addColorStop(0, "rgba(0,0,0,1)"); gv.addColorStop(0.6, "rgba(0,0,0,.35)"); gv.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gv; g.fillRect(0, 0, 64, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })(); disposables.push(shaftTex);
      const shafts: { m: THREE.Mesh; base: number; ph: number }[] = [], sr = rng(55);
      for (let i = 0; i < 7; i++) {
        const w = 3 + sr() * 7, m = new THREE.Mesh(new THREE.PlaneGeometry(w, 44), new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false, color: i % 3 === 0 ? "#fff0f6" : "#e6fbff" }));
        const z = -6 - sr() * 40; m.position.set((sr() - 0.5) * 50, 12, z); m.rotation.z = 0.3 + (sr() - 0.5) * 0.25; scene.add(m); shafts.push({ m, base: 0.1 + sr() * 0.09, ph: sr() * 6 }); disposables.push(m.geometry, m.material as THREE.Material);
      }

      /* motes + bubbles */
      const mn = small ? 160 : 320, mp = new Float32Array(mn * 3), mr = rng(2);
      for (let i = 0; i < mn; i++) { mp[i * 3] = (mr() - 0.5) * 50; mp[i * 3 + 1] = FLOOR_Y + mr() * 18; mp[i * 3 + 2] = 12 - mr() * 50; }
      const mg = new THREE.BufferGeometry(); mg.setAttribute("position", new THREE.BufferAttribute(mp, 3));
      const dot = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d")!; const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t; })();
      const motes = new THREE.Points(mg, new THREE.PointsMaterial({ map: dot, size: 0.22, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true })); scene.add(motes); disposables.push(mg, dot);

      /* sizing */
      const resize = () => {
        const w = el.clientWidth || 1, h = el.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = camera.aspect < 0.8 ? 66 : 52; camera.updateProjectionMatrix();
        const vh = 2 * Math.tan((camera.fov * Math.PI) / 360) * 120; bg.scale.set(vh * camera.aspect * 1.3, vh * 1.3, 1);
      };
      resize(); const ro = new ResizeObserver(resize); ro.observe(el);
      let visible = true; const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "80px" }); io.observe(el);
      let px = 0, py = 0; const onMove = (e: PointerEvent) => { px = (e.clientX / window.innerWidth - 0.5) * 2; py = (e.clientY / window.innerHeight - 0.5) * 2; };
      if (!small) window.addEventListener("pointermove", onMove, { passive: true });

      const tmpC = new THREE.Color(), ease = (x: number) => x * x * (3 - 2 * x); let cur = progress.current || 0;
      const setBg = (p: number) => {
        const a = (arr: THREE.Color[]) => tmpC.copy(arr[0]).lerp(arr[1], p);
        const set = (i: number, c: THREE.Color) => { bgCol[i * 3] = c.r; bgCol[i * 3 + 1] = c.g; bgCol[i * 3 + 2] = c.b; };
        const t = a([topA, topB]).clone(), m = a([midA, midB]).clone(), b = a([botA, botB]).clone();
        set(0, t); set(1, t); set(2, b); set(3, b); bgGeo.attributes.color.needsUpdate = true; (scene.fog as THREE.FogExp2).color.copy(m);
        sunGlow.material.opacity = 1 - p * 0.9;
      };
      const safe = makeSafe(renderer, scene, () => { cancelAnimationFrame(raf); setFailed(true); });
    const loop = (ms: number) => {
        raf = requestAnimationFrame(loop); if (!visible || document.hidden) return;
        const t = reduce ? 0 : ms / 1000; cur += (progress.current - cur) * (reduce ? 1 : 0.09); const p = cur;
        setBg(p);
        /* camera: forward and down through the reef */
        const z = 9 - 17 * p, y = 3.1 - 5.3 * ease(p) , sway = reduce ? 0 : Math.sin(t * 0.3) * 0.12;
        camera.position.set(sway + px * 0.5, y - py * 0.25, z); camera.lookAt(sway * 2, y - 1.0 - 0.3 * p, z - 18);
        /* turtle crosses the frame */
        const tz = z - 12, tx = -16 + 34 * p + Math.sin(t * 0.5) * 0.4, ty = y - 2.3 + Math.sin(t * 0.8) * 0.35 + 0.6 * Math.sin(p * 3);
        turtle.g.position.set(tx, ty, tz + Math.sin(p * 4) * 1.5); turtle.g.rotation.set(Math.sin(t * 0.8) * 0.05, Math.PI / 2 - 0.25, Math.cos(t * 0.8) * 0.05 - 0.05);
        turtle.fl.forEach((f, i) => { const sd = (f as unknown as { side: number }).side, ph = i < 2 ? 0 : 1.2; f.rotation.z = sd * Math.sin(t * 2.2 + ph) * 0.55; f.rotation.y = sd * Math.cos(t * 2.2 + ph) * 0.18; });
        turtle.head.rotation.y = Math.sin(t * 0.7) * 0.15;
        /* octopus idle: gentle breathing, curling arms, lazy wave */
        octo.head.scale.y = 1.15 + Math.sin(t * 1.4) * 0.03; octo.g.position.y = FLOOR_Y + 0.4 + Math.sin(t * 0.9) * 0.08;
        octo.tents.forEach((ch, k) => ch.forEach((s, i) => { const w = Math.sin(t * 1.3 - i * 0.55 + k) * 0.16; if (i > 0) { s.rotation.x = 0.28 + w * 0.6; s.rotation.z = Math.cos(t * 1.1 - i * 0.5 + k * 1.7) * 0.14; } else s.rotation.x = 0.9 + w * 0.3; }));
        /* jellyfish */
        for (const j of jellies) {
          const s = 1 + Math.sin(t * 1.5 + j.ph) * 0.07; j.bell.scale.set(1 + (1 - s) * 0.5, 0.85 * s, 1 + (1 - s) * 0.5); j.core.scale.setScalar(s);
          j.g.position.y = j.y + Math.sin(t * 0.45 + j.ph) * 0.9 + p * 2.4; j.g.position.x = j.x + Math.sin(t * 0.25 + j.ph) * 0.8; j.g.rotation.z = Math.sin(t * 0.6 + j.ph) * 0.08;
          j.tents.forEach((m, i) => { m.rotation.z = Math.sin(t * 1.1 + i + j.ph) * 0.05; m.rotation.x = Math.cos(t * 0.9 + i * 0.7 + j.ph) * 0.04; });
        }
        /* kelp ribbons */
        for (const k of kelp) { const pa = k.m.geometry.attributes.position as THREE.BufferAttribute, B = k.base; for (let i = 0; i < pa.count; i++) { const y0 = B[i * 3 + 1], f = (y0 / 6) * (y0 / 6); pa.setX(i, B[i * 3] + Math.sin(t * 1.1 + y0 * 0.5 + k.ph) * k.amp * f * 2); pa.setZ(i, Math.cos(t * 0.8 + y0 * 0.4 + k.ph) * k.amp * f); } pa.needsUpdate = true; }
        /* fish orbit */
        const fx = tx * 0.2 - 3, fz = z - 9; fishData.forEach((f, i) => { const a = f.a + t * 0.5 * f.s; fd.position.set(fx + Math.cos(a) * f.r * 2.2, y - 3.4 + f.y * 0.6 + Math.sin(t + f.o) * 0.2, fz + Math.sin(a) * f.r); fd.rotation.set(0, -a, 0); fd.scale.setScalar(0.7); fd.updateMatrix(); fish.setMatrixAt(i, fd.matrix); }); fish.instanceMatrix.needsUpdate = true;
        /* light */
        for (const s of shafts) { (s.m.material as THREE.MeshBasicMaterial).opacity = s.base * (1 - p * 0.85) * (0.75 + 0.25 * Math.sin(t * 0.5 + s.ph)); s.m.position.y = 12 + camera.position.y * 0.5; }
        cTex.offset.set(t * 0.012, t * 0.018); cMesh.material.opacity = 0.28 * (1 - p * 0.5);
        motes.position.y = reduce ? 0 : (t * 0.2) % 2;
        safe(camera);
      };
      raf = requestAnimationFrame(loop);
      cleanup = () => {
        cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener("pointermove", onMove);
        scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose?.(); const mm = m.material as THREE.Material | THREE.Material[] | undefined; if (mm) (Array.isArray(mm) ? mm : [mm]).forEach((x) => x.dispose()); });
        disposables.forEach((d) => d.dispose()); renderer.domElement.remove();
      };
    } catch (e) { console.error("Dive3D failed", e); reportFail("Dive3D: " + String(e)); try { renderer.dispose(); renderer.domElement.remove(); } catch {} setFailed(true); }
    return () => cleanup();
  }, [progress]);

  return <div ref={host} style={{ position: "absolute", inset: 0 }} aria-hidden>{failed && fallback}</div>;
}
