"use client";
/* Real lit 3D balloon installations (Three.js).
   - mode "tunnel": camera flies through ~16 non-identical balloon arches over a receding ocean-scale floor, driven by `progress` (0..1).
   - mode "stage":  a large organic balloon arch that inflates in sequence as `progress` (0..1) rises.  */
import { MutableRefObject, ReactNode, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { makeSafe, reportFail } from "@/lib/safeRender";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { causticCanvas } from "@/lib/caustics";

export type BalloonsProps = { mode: "tunnel" | "stage"; progress: MutableRefObject<number>; fallback?: ReactNode; className?: string; style?: React.CSSProperties };

function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const TONES: Record<string, string[]> = {
  blue: ["#8cc9f0", "#a9d8f4", "#78b8ea", "#bfe3f7"],
  pink: ["#f6b0cf", "#f09bbf", "#ffcfe3", "#f4a6c9"],
  lav: ["#bfa6ee", "#a98ee4", "#d5c3f6", "#b49cea"],
  mint: ["#a2e6cf", "#86d9c3", "#c9f3e3", "#95e0c9"],
  cream: ["#fff3de", "#fff9ef", "#f6e3c4", "#ffeccf"],
  white: ["#ffffff", "#f8f4ff", "#fffaf5"],
};
const ORDER = ["blue", "pink", "lav", "mint", "cream", "white"];
function pick(r: () => number, dominant: string, mix = 0.55) {
  const key = r() < mix ? dominant : ORDER[Math.floor(r() * ORDER.length)];
  const arr = TONES[key];
  return new THREE.Color(arr[Math.floor(r() * arr.length)]);
}

type Bal = { x: number; y: number; z: number; s: number; col: THREE.Color; pearl: boolean; d: number; ph: number; rx: number; rz: number };

function balloonGeo(detail: number) {
  const g = new THREE.SphereGeometry(1, detail, Math.round(detail * 0.72));
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    // slight teardrop: narrower bottom, tiny pinch where the knot would be
    const k = y < 0 ? 1 - 0.1 * Math.abs(y) : 1;
    p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k);
    p.setY(i, y * (y > 0 ? 1.06 : 1.12));
  }
  g.computeVertexNormals();
  return g;
}

function makeMats() {
  // soft latex: clearcoat gives the wet specular window highlight, sheen the velvety rim
  const latex = new THREE.MeshPhysicalMaterial({ roughness: 0.38, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.28, sheen: 0.6, sheenRoughness: 0.5, sheenColor: new THREE.Color("#ffffff"), envMapIntensity: 1.05 });
  // chrome-pearl balloons
  const pearl = new THREE.MeshPhysicalMaterial({ roughness: 0.16, metalness: 0.9, clearcoat: 1, clearcoatRoughness: 0.1, iridescence: 0.7, iridescenceIOR: 1.4, envMapIntensity: 1.35 });
  const glass = new THREE.MeshPhysicalMaterial({ color: "#e8f6ff", roughness: 0.04, metalness: 0, transparent: true, opacity: 0.28, clearcoat: 1, envMapIntensity: 1.6, depthWrite: false });
  const knot = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0, envMapIntensity: 0.6 });
  return { latex, pearl, glass, knot };
}

/** little tied-off nozzle at the base of each latex balloon */
function knotGeo() {
  const g = new THREE.ConeGeometry(0.17, 0.3, 10, 1, false); g.translate(0, -0.15, 0); g.rotateX(Math.PI); g.translate(0, -0.02, 0); return g;
}

/** Real 3D scallop shell: domed fan with radial ribs and a scalloped rim. */
export function shellGeo(ribs = 13) {
  const g = new THREE.SphereGeometry(1, 56, 22, 0, Math.PI, 0, Math.PI * 0.5);
  g.rotateX(-Math.PI / 2); g.rotateY(Math.PI / 2); // dome faces +Z, hinge at -Y
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const ang = Math.atan2(v.x, v.y + 0.0001); // fan angle around the hinge
    const rib = 1 + 0.06 * Math.cos(ang * ribs * 0.5 * 2) * Math.min(1, Math.hypot(v.x, v.y) * 1.4);
    v.x *= rib; v.y = (v.y + 0.5) * rib * 1.0 - 0.5; v.z *= 0.42 * rib;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function bakeInstances(items: Bal[], geo: THREE.BufferGeometry, mats: ReturnType<typeof makeMats>, host: THREE.Object3D, kg?: THREE.BufferGeometry) {
  const meshes: THREE.InstancedMesh[] = [];
  const d = new THREE.Object3D(), kd = new THREE.Object3D(), off = new THREE.Vector3();
  for (const pearl of [false, true]) {
    const list = items.filter((b) => b.pearl === pearl);
    if (!list.length) continue;
    const m = new THREE.InstancedMesh(geo, pearl ? mats.pearl : mats.latex, list.length);
    const k = kg ? new THREE.InstancedMesh(kg, mats.knot, list.length) : null;
    list.forEach((b, i) => {
      d.position.set(b.x, b.y, b.z); d.rotation.set(b.rx, 0, b.rz); d.scale.setScalar(b.s); d.updateMatrix();
      m.setMatrixAt(i, d.matrix); m.setColorAt(i, b.col);
      if (k) {
        off.set(0, -1.1 * b.s, 0).applyEuler(d.rotation);
        kd.position.set(b.x + off.x, b.y + off.y, b.z + off.z); kd.rotation.copy(d.rotation); kd.scale.setScalar(b.s); kd.updateMatrix();
        k.setMatrixAt(i, kd.matrix); k.setColorAt(i, b.col.clone().multiplyScalar(0.88));
      }
    });
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
    host.add(m); meshes.push(m);
    if (k) { k.instanceMatrix.needsUpdate = true; if (k.instanceColor) k.instanceColor.needsUpdate = true; k.computeBoundingSphere(); host.add(k); meshes.push(k); }
  }
  return meshes;
}

/* ---------- decorative 3D jellyfish (hangs from arch apex) ---------- */
function makeJelly(r: () => number) {
  const g = new THREE.Group();
  const bellMat = new THREE.MeshPhysicalMaterial({ color: "#ffd2ea", transparent: true, opacity: 0.62, roughness: 0.12, metalness: 0, clearcoat: 1, emissive: new THREE.Color("#ff9cd0"), emissiveIntensity: 0.28, side: THREE.DoubleSide, depthWrite: false });
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.62, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.56), bellMat);
  bell.scale.y = 0.82; g.add(bell);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), new THREE.MeshBasicMaterial({ color: "#ffb6de", transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  core.position.y = 0.12; g.add(core);
  const tm = new THREE.MeshPhysicalMaterial({ color: "#ffd9f1", transparent: true, opacity: 0.55, roughness: 0.2, emissive: new THREE.Color("#ff9cd0"), emissiveIntensity: 0.18, depthWrite: false });
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2, rr = 0.42 * (0.6 + r() * 0.5), len = 1.2 + r() * 1.3;
    const pts = [0, 1, 2, 3, 4].map((j) => new THREE.Vector3(Math.cos(a) * rr + Math.sin(j * 1.3 + k) * 0.08, -0.02 - (len * j) / 4, Math.sin(a) * rr + Math.cos(j * 1.1 + k) * 0.08));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.022 * (1 - 0.02), 5), tm));
  }
  return { group: g, bell, core };
}

/* ---------- ocean-scale floor texture ---------- */
function floorTexture(renderer: THREE.WebGLRenderer) {
  const S = 512, c = document.createElement("canvas"); c.width = c.height = S;
  const g = c.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, 0, S); bg.addColorStop(0, "#cfeaf8"); bg.addColorStop(1, "#c4dcf6");
  g.fillStyle = bg; g.fillRect(0, 0, S, S);
  const R = 32, rowH = 16, hues = ["#bfe3f6", "#e1d3f6", "#f8d4e6", "#cfeee4"];
  for (let j = -1; j < S / rowH + 2; j++) {
    for (let i = -1; i < S / (R * 2) + 1; i++) {
      const x = i * R * 2 + (j % 2 ? R : 0), y = j * rowH + R;
      const gr = g.createRadialGradient(x - 6, y - 14, 2, x, y, R);
      gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.5, hues[(i + j * 3 + 400) % 4]); gr.addColorStop(1, hues[(i + j + 401) % 4]);
      g.beginPath(); g.arc(x, y, R - 1, 0, Math.PI * 2); g.fillStyle = gr; g.fill();
      g.lineWidth = 2.4; g.strokeStyle = "rgba(255,255,255,.85)"; g.stroke();
      g.beginPath(); g.arc(x, y, R * 0.62, Math.PI * 1.05, Math.PI * 1.95); g.lineWidth = 1.6; g.strokeStyle = "rgba(150,170,220,.28)"; g.stroke();
    }
  }
  for (let j = 0; j < S / rowH; j += 2) for (let i = 0; i < S / (R * 2); i++) {
    const x = i * R * 2 + (j % 2 ? R : 0), y = j * rowH + R - R + 2;
    const pg = g.createRadialGradient(x - 1.5, y - 1.5, 0.5, x, y, 5); pg.addColorStop(0, "#fff"); pg.addColorStop(1, "#e5d6f3");
    g.beginPath(); g.arc(x, y, 4.4, 0, Math.PI * 2); g.fillStyle = pg; g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}
function glowSprite(inner = "rgba(255,255,255,1)", outer = "rgba(255,255,255,0)") {
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(0.35, "rgba(255,255,255,.5)"); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function bubbleSprite() {
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(46, 42, 4, 64, 64, 60);
  gr.addColorStop(0, "rgba(255,255,255,.95)"); gr.addColorStop(0.25, "rgba(255,255,255,.1)"); gr.addColorStop(0.8, "rgba(190,230,245,.18)"); gr.addColorStop(1, "rgba(246,197,219,.6)");
  g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.lineWidth = 2; g.strokeStyle = "rgba(255,255,255,.7)"; g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export default function Balloons3D({ mode, progress, fallback, className, style }: BalloonsProps) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [bucket, setBucket] = useState(-1);
  const bucketRef = useRef(-1);

  useEffect(() => {
    const el = host.current; if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: (window.devicePixelRatio || 1) < 1.5, alpha: true, powerPreference: "high-performance" });
    } catch (e) { reportFail("Balloons3D WebGL context: " + String(e)); setFailed(true); return; }
    const small = window.innerWidth < 760;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1 : 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = mode === "stage" ? 1.0 : 0.95;
    renderer.setClearColor(0x000000, 0);
    let raf = 0; let cleanup = () => {};
    try {
    el.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block" });

    const scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(renderer);
    try { scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; } catch (e) { console.warn("3D: environment map unavailable", e); }
    scene.add(new THREE.HemisphereLight("#eaf6ff", "#f7c4dc", 0.55));
    const key = new THREE.DirectionalLight("#fff4e6", 1.5); key.position.set(-4, 9, 6); scene.add(key);
    const rim = new THREE.DirectionalLight("#bcd8ff", 0.7); rim.position.set(6, 3, -8); scene.add(rim);

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 140);
    const mats = makeMats();
    const geo = balloonGeo(small ? 14 : 18);
    const disposables: { dispose(): void }[] = [geo, mats.latex, mats.pearl, mats.glass, mats.knot, pm];
    const tick: ((t: number, dt: number) => void)[] = [];

    /* ======================= TUNNEL ======================= */
    if (mode === "tunnel") {
      const N = small ? 9 : 12, SP = 5.6, START = 7;
      const fogCol = new THREE.Color("#c4ebf0");
      scene.fog = new THREE.FogExp2(fogCol, 0.045);
      const arches: { grp: THREE.Group; z: number }[] = [];
      const kg = knotGeo(), sGeo = shellGeo(), sphereG = new THREE.SphereGeometry(1, 20, 14);
      const shellMat = new THREE.MeshPhysicalMaterial({ color: "#ffe3ef", roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.12, iridescence: 1, iridescenceIOR: 1.5, sheen: 0.8, sheenColor: new THREE.Color("#cfe6ff"), side: THREE.DoubleSide, envMapIntensity: 1.2 });
      const pearlWhite = new THREE.MeshPhysicalMaterial({ color: "#fff8ee", roughness: 0.12, metalness: 0.5, clearcoat: 1, iridescence: 1, envMapIntensity: 1.5 });
      disposables.push(kg, sGeo, sphereG, shellMat, pearlWhite);
      const jellies: { g: THREE.Group; bell: THREE.Mesh; core: THREE.Mesh; ph: number }[] = [];
      const dominants = ["blue", "pink", "lav", "mint", "white", "pink", "blue", "lav"];
      for (let a = 0; a < N; a++) {
        const r = rng(a * 977 + 31), items: Bal[] = [], glassItems: Bal[] = [];
        const R = 5.6 - a * 0.05 + (r() - 0.5) * 0.4, wScale = 1 + (r() - 0.5) * 0.12, hScale = 0.92 + r() * 0.2;
        const dom = dominants[a % dominants.length], z = -START - a * SP + (r() - 0.5) * 0.5;
        // 4 interleaved layers of mixed-size balloons => a thick, organic garland (not a row of beads)
        const layers = 4;
        for (let l = 0; l < layers; l++) {
          const rad = R + l * 0.5 - 0.1, size = (0.9 - l * 0.07) * (a % 3 === 0 ? 1.12 : 1);
          const n = Math.floor((Math.PI * rad) / (size * 0.95));
          for (let k = 0; k <= n; k++) {
            const th = (k + (r() - 0.5) * 0.8) / n * Math.PI;
            const jr = (r() - 0.5) * 0.6, big = r() < 0.16 ? 1.35 : 1, s = size * (0.6 + r() * 0.7) * big;
            const x = Math.cos(th) * (rad + jr) * wScale, y = Math.max(s * 0.9, Math.sin(th) * (rad + jr) * hScale);
            items.push({ x, y, z: (r() - 0.5) * 1.3 + (l - 1.5) * 0.3, s, col: pick(r, dom, 0.5 + 0.08 * l), pearl: r() < 0.22, d: 0, ph: 0, rx: (r() - 0.5) * 0.6, rz: (r() - 0.5) * 0.7 });
          }
        }
        // glass bubbles woven through the garland
        for (let k = 0; k < 9; k++) {
          const th = r() * Math.PI, rad = R + (r() - 0.3) * 1.1, s = 0.3 + r() * 0.45;
          glassItems.push({ x: Math.cos(th) * rad * wScale, y: Math.max(s, Math.sin(th) * rad * hScale), z: 0.7 + r() * 0.5, s, col: new THREE.Color("#fff"), pearl: false, d: 0, ph: 0, rx: 0, rz: 0 });
        }
        // organic oversized clusters with satellites, uneven per arch
        const cl = 3 + Math.floor(r() * 3);
        for (let c = 0; c < cl; c++) {
          const th = (0.12 + r() * 0.76) * Math.PI, rad = R + 0.9 + r() * 0.6, bs = 0.9 + r() * 0.45;
          const cx = Math.cos(th) * rad * wScale, cy = Math.sin(th) * rad * hScale;
          items.push({ x: cx, y: cy, z: 0.5, s: bs, col: pick(r, dom, 0.45), pearl: r() < 0.3, d: 0, ph: 0, rx: 0, rz: (r() - 0.5) * 0.4 });
          for (let sat = 0; sat < 4; sat++) {
            const ang = r() * Math.PI * 2, dist = bs * (0.9 + r() * 0.6), ss = bs * (0.38 + r() * 0.3);
            items.push({ x: cx + Math.cos(ang) * dist, y: Math.max(ss, cy + Math.sin(ang) * dist), z: 0.5 + (r() - 0.5) * 0.7, s: ss, col: pick(r, dom, 0.4), pearl: r() < 0.35, d: 0, ph: 0, rx: 0, rz: 0 });
          }
        }
        // small pearl garland along the inner edge
        const gp = Math.floor(R * 7);
        for (let k = 0; k < gp; k++) {
          const th = (k / (gp - 1)) * Math.PI, rad = R - 0.5;
          items.push({ x: Math.cos(th) * rad * wScale, y: Math.max(0.15, Math.sin(th) * rad * hScale), z: -0.55, s: 0.13 + r() * 0.05, col: new THREE.Color("#ffffff"), pearl: true, d: 0, ph: 0, rx: 0, rz: 0 });
        }
        const grp = new THREE.Group(); grp.position.z = z; grp.rotation.z = (r() - 0.5) * 0.05;
        bakeInstances(items, geo, mats, grp, kg);
        if (glassItems.length) { const gm = new THREE.InstancedMesh(sphereG, mats.glass, glassItems.length); const dd = new THREE.Object3D(); glassItems.forEach((b, i) => { dd.position.set(b.x, b.y, b.z); dd.scale.setScalar(b.s); dd.updateMatrix(); gm.setMatrixAt(i, dd.matrix); }); gm.computeBoundingSphere(); grp.add(gm); }
        // 3D scallop shells + pearls sitting at both feet of the arch
        for (const side of [-1, 1]) {
          const sh = new THREE.Mesh(sGeo, shellMat); const ss = 0.9 + r() * 0.7;
          sh.scale.setScalar(ss); sh.position.set(side * (R * wScale + 0.2 + r() * 0.7), ss * 0.45, 0.9 + r()); sh.rotation.set(-0.35, side * (0.5 + r() * 0.4), side * 0.1);
          grp.add(sh);
          const pr = new THREE.Mesh(sphereG, mats.pearl); pr.scale.setScalar(0.24); pr.material = pearlWhite; pr.position.copy(sh.position).add(new THREE.Vector3(side * 0.4, -0.1, 0.9)); pr.position.y = 0.24; grp.add(pr);
        }
        scene.add(grp); arches.push({ grp, z });
        if (a % 4 === 2) {
          const j = makeJelly(r); j.group.position.set((r() - 0.5) * 1.2, R * hScale - 1.2, z + 0.2); j.group.scale.setScalar(1.15 + r() * 0.5);
          scene.add(j.group); jellies.push({ ...j, g: j.group, ph: r() * 6 });
        }
      }
      // floor
      const L = N * SP + START + 40, fw = 16;
      const ft = floorTexture(renderer); ft.repeat.set(fw / 6, L / 4);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(fw, L), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.55, metalness: 0.05, envMapIntensity: 0.2, emissive: new THREE.Color("#cfe4ff"), emissiveMap: ft, emissiveIntensity: 0.06, color: "#b9c9e6" }));
      floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -L / 2 + 10); scene.add(floor);
      // moving caustics projected on the floor
      const cc = new THREE.CanvasTexture(causticCanvas(256)); cc.wrapS = cc.wrapT = THREE.RepeatWrapping; cc.repeat.set(fw / 5, L / 5); cc.colorSpace = THREE.SRGBColorSpace;
      const cplane = new THREE.Mesh(new THREE.PlaneGeometry(fw, L), new THREE.MeshBasicMaterial({ map: cc, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, fog: true }));
      cplane.rotation.x = -Math.PI / 2; cplane.position.set(0, 0.02, -L / 2 + 10); scene.add(cplane);
      disposables.push(ft, cc);
      // bright gate far ahead
      const gateTex = glowSprite("rgba(255,255,255,1)", "rgba(255,240,250,0)");
      const gate = new THREE.Sprite(new THREE.SpriteMaterial({ map: gateTex, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, opacity: 0.0 }));
      gate.scale.set(30, 30, 1); gate.position.set(0, 2.2, -START - N * SP - 6); scene.add(gate);
      // floating bubbles
      const bt = bubbleSprite(); disposables.push(bt, gateTex);
      const bn = small ? 70 : 130, bp = new Float32Array(bn * 3), br = rng(5);
      for (let i = 0; i < bn; i++) { bp[i * 3] = (br() - 0.5) * 14; bp[i * 3 + 1] = 0.3 + br() * 6; bp[i * 3 + 2] = -br() * (N * SP + START); }
      const bgeo = new THREE.BufferGeometry(); bgeo.setAttribute("position", new THREE.BufferAttribute(bp, 3));
      const bubbles = new THREE.Points(bgeo, new THREE.PointsMaterial({ map: bt, size: 0.42, transparent: true, depthWrite: false, opacity: 0.85, sizeAttenuation: true }));
      scene.add(bubbles); disposables.push(bgeo);

      const total = (N - 1) * SP + START - 1.5; let cur = progress.current || 0;
      tick.push((t) => {
        const target = progress.current; cur += (target - cur) * (reduce ? 1 : 0.1);
        const z = -cur * total, sway = reduce ? 0 : Math.sin(cur * 9) * 0.22;
        camera.position.set(sway, 1.75 + (reduce ? 0 : Math.sin(cur * 13) * 0.05), z + 2);
        camera.lookAt(sway * 0.4, 1.9, z - 8);
        for (const a of arches) a.grp.visible = a.z < camera.position.z + 1.5 && a.z > camera.position.z - 46;
        cc.offset.set(t * 0.012, -t * 0.02);
        (gate.material as THREE.SpriteMaterial).opacity = Math.max(0, (cur - 0.62) / 0.38) * 0.95;
        for (const j of jellies) { const s = 1 + Math.sin(t * 1.6 + j.ph) * 0.06; j.bell.scale.set(1 + (1 - s) * 0.4, 0.82 * s, 1 + (1 - s) * 0.4); j.g.rotation.z = Math.sin(t * 0.7 + j.ph) * 0.05; j.g.position.y += Math.sin(t * 0.9 + j.ph) * 0.0015; }
        bubbles.position.y = reduce ? 0 : (t * 0.25) % 3;
      });
    }

    /* ======================= STAGE ======================= */
    let stageUpdate: ((t: number) => void) | null = null;
    if (mode === "stage") {
      const r = rng(2024); const items: Bal[] = [];
      const aspect0 = (el.clientWidth || 1) / (el.clientHeight || 1);
      const fov0 = aspect0 < 0.8 ? 52 : 42, dist = 18;
      const H = Math.tan((fov0 * Math.PI) / 360) * dist, W = H * aspect0;
      const rx = aspect0 > 1 ? Math.min(W * 0.8, H * 1.95) : W * 0.9, ry = H * 1.78, baseY = -H * 0.95, u = H * (aspect0 < 0.8 ? 0.07 : 0.105);
      camera.fov = fov0; camera.position.set(0, 0, dist); camera.lookAt(0, 0, 0);
      const dom = ["pink", "lav", "blue", "white", "mint"];
      const place = (th: number, layer: number, big: number) => {
        const off = layer * u * 0.95 - u * 0.6 + (r() - 0.5) * u * 0.6;
        const s = u * (0.62 + r() * 0.55) * big;
        items.push({ x: Math.cos(th) * (rx + off), y: Math.sin(th) * (ry + off) + baseY, z: (r() - 0.5) * u - layer * 0.12, s, col: pick(r, dom[Math.floor(th * 1.7) % dom.length], 0.45), pearl: r() < 0.22, d: 0, ph: r() * 6, rx: (r() - 0.5) * 0.5, rz: (r() - 0.5) * 0.7 });
      };
      for (let l = 0; l < 4; l++) {
        const n = Math.round((52 - l * 5) * (aspect0 < 0.8 ? 0.8 : 1));
        for (let k = 0; k <= n; k++) {
          const th = (k / n) * Math.PI;
          const thick = 0.65 + 0.5 * Math.sin(th * 2 + 1.1);
          if (l > 1 && r() > thick + 0.25) continue;
          place(th, l, th > 1.2 && th < 2.0 ? 1.25 : 1);
        }
      }
      // large feature clusters
      [[0.35, 1], [0.95, 1.1], [1.72, 1.3], [2.5, 1.1], [2.95, 1.0]].forEach(([th, sc]) => {
        const cx = Math.cos(th) * (rx + u * 0.5), cy = Math.sin(th) * (ry + u * 0.5) + baseY, bs = u * 1.5 * sc;
        items.push({ x: cx, y: cy, z: 0.9, s: bs, col: pick(r, "pink", 0.5), pearl: true, d: 0, ph: r() * 6, rx: 0, rz: 0.2 });
        for (let k = 0; k < 6; k++) { const ang = r() * 6.28, dist = bs * (1 + r() * 0.7), ss = bs * (0.35 + r() * 0.3); items.push({ x: cx + Math.cos(ang) * dist, y: cy + Math.sin(ang) * dist, z: 0.9 + (r() - 0.5), s: ss, col: pick(r, dom[k % 5], 0.3), pearl: r() < 0.35, d: 0, ph: r() * 6, rx: 0, rz: 0 }); }
      });
      // reveal ordering: inflate from the left foot, over the crown, to the right foot
      for (const b of items) b.d = (Math.atan2(b.y - baseY, b.x) > 0 ? (Math.PI - Math.atan2(b.y - baseY, b.x)) / Math.PI : 0.5) * 0.7 + r() * 0.12;
      // build one InstancedMesh pair, update every frame
      const lat = new THREE.InstancedMesh(geo, mats.latex, items.length), prl = new THREE.InstancedMesh(geo, mats.pearl, items.length);
      const li: number[] = [], pi: number[] = [];
      items.forEach((b, i) => (b.pearl ? pi : li).push(i));
      lat.count = li.length; prl.count = pi.length;
      li.forEach((idx, n) => lat.setColorAt(n, items[idx].col)); pi.forEach((idx, n) => prl.setColorAt(n, items[idx].col));
      lat.frustumCulled = prl.frustumCulled = false;
      scene.add(lat, prl);
      // floating bubbles
      const bt = bubbleSprite(); disposables.push(bt);
      const bn = small ? 40 : 80, bp = new Float32Array(bn * 3);
      for (let i = 0; i < bn; i++) { bp[i * 3] = (r() - 0.5) * 2 * rx * 0.9; bp[i * 3 + 1] = (r() - 0.5) * 2 * H; bp[i * 3 + 2] = r() * 4; }
      const bgeo = new THREE.BufferGeometry(); bgeo.setAttribute("position", new THREE.BufferAttribute(bp, 3));
      const bubbles = new THREE.Points(bgeo, new THREE.PointsMaterial({ map: bt, size: 0.6, transparent: true, depthWrite: false, opacity: 0.8 })); scene.add(bubbles); disposables.push(bgeo);
      const d = new THREE.Object3D(); const ease = (x: number) => { const c = Math.min(1, Math.max(0, x)); const k = 1.5; return 1 + (k + 1) * Math.pow(c - 1, 3) + k * Math.pow(c - 1, 2); };
      stageUpdate = (t) => {
        const p = progress.current * 1.45;
        const f = (list: number[], mesh: THREE.InstancedMesh) => list.forEach((idx, n) => {
          const b = items[idx]; const g = ease((p - b.d) / 0.42);
          const sway = reduce ? 0 : Math.sin(t * 0.8 + b.ph) * 0.05;
          d.position.set(b.x, b.y + sway + (1 - g) * -1.2, b.z); d.rotation.set(b.rx, 0, b.rz + sway); d.scale.setScalar(Math.max(0.0001, b.s * g)); d.updateMatrix(); mesh.setMatrixAt(n, d.matrix);
        });
        f(li, lat); f(pi, prl); lat.instanceMatrix.needsUpdate = prl.instanceMatrix.needsUpdate = true;
        if (lat.instanceColor) lat.instanceColor.needsUpdate = true; if (prl.instanceColor) prl.instanceColor.needsUpdate = true;
        bubbles.position.y = reduce ? 0 : (t * 0.35) % 3;
        bubbles.material.opacity = Math.min(0.8, progress.current * 1.4);
        if (!reduce) { camera.position.x += (px * 0.7 - camera.position.x) * 0.04; camera.position.y += (-py * 0.4 - camera.position.y) * 0.04; camera.lookAt(0, 0, 0); }
      };
    }

    /* pointer parallax (desktop) */
    let px = 0, py = 0;
    const onMove = (e: PointerEvent) => { px = (e.clientX / window.innerWidth - 0.5) * 2; py = (e.clientY / window.innerHeight - 0.5) * 2; };
    if (mode === "stage" && !small) window.addEventListener("pointermove", onMove, { passive: true });

    /* sizing */
    const resize = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      if (mode === "tunnel") camera.fov = camera.aspect < 0.8 ? 78 : camera.aspect < 1.3 ? 66 : 56;
      else camera.fov = camera.aspect < 0.8 ? 52 : 42;
      if (mode === "stage") { const b = camera.aspect < 0.9 ? 1 : 0; if (b !== bucketRef.current) { bucketRef.current = b; setBucket(b); } }
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(el);

    /* render only when on screen */
    let visible = true, last = 0;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "100px" }); io.observe(el);
    const safe = makeSafe(renderer, scene, () => { cancelAnimationFrame(raf); setFailed(true); });
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      const t = ms / 1000, dt = t - last; last = t;
      tick.forEach((f) => f(t, dt)); stageUpdate?.(t);
      safe(camera);
    };
    raf = requestAnimationFrame(loop);

    cleanup = () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener("pointermove", onMove);
      scene.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry && m.geometry !== geo) m.geometry.dispose(); });
      disposables.forEach((d) => d.dispose());
      renderer.dispose(); renderer.domElement.remove();
    };
    } catch (e) { console.error("Balloons3D failed", e); reportFail("Balloons3D: " + String(e)); try { renderer.dispose(); renderer.domElement.remove(); } catch {} setFailed(true); }
    return () => cleanup();
  }, [mode, progress, bucket]);

  return (
    <div ref={host} className={className} style={{ position: "absolute", inset: 0, ...style }} aria-hidden>
      {failed && fallback}
    </div>
  );
}
