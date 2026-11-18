"use client";
/* Scene 01 - a physically lit 3D invitation envelope (Three.js).
   Parts: embossed-paper pocket, liner, perspective flap, shell seal, rising card, pearl trim.
   Driven by a plain state object tweened by GSAP in Envelope.tsx. */
import { MutableRefObject, ReactNode, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { makeSafe, reportFail } from "@/lib/safeRender";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry.js";
import { invitation } from "@/config/invitation";

export type EnvState = { seal: number; flap: number; card: number; zoom: number; glow: number };
export const newEnvState = (): EnvState => ({ seal: 0, flap: 0, card: 0, zoom: 0, glow: 0 });

const W = 6, H = 4;

function canvas(w: number, h: number) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }

/** Draw embossed ocean paper: scale pattern + coral sprigs. mode "color" or "bump". */
function paper(mode: "color" | "bump", tint: [string, string]) {
  const w = 1200, h = 800, c = canvas(w, h), g = c.getContext("2d")!, bump = mode === "bump";
  if (bump) { g.fillStyle = "#000"; g.fillRect(0, 0, w, h); }
  else { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, tint[0]); gr.addColorStop(1, tint[1]); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  // scales
  const R = 34;
  for (let j = 0; j < h / (R * 0.55) + 2; j++) for (let i = -1; i < w / (R * 2) + 2; i++) {
    const x = i * R * 2 + (j % 2 ? R : 0), y = j * R * 0.55;
    g.beginPath(); g.arc(x, y, R - 2, 0, Math.PI); g.lineWidth = bump ? 5 : 2.4;
    g.strokeStyle = bump ? "#fff" : "rgba(255,255,255,.5)"; g.stroke();
    if (!bump) { g.beginPath(); g.arc(x, y + 1, R - 7, 0.2, Math.PI - 0.2); g.lineWidth = 1.5; g.strokeStyle = "rgba(90,130,200,.16)"; g.stroke(); }
  }
  // coral sprigs bottom corners
  const sprig = (x: number, y: number, s: number) => {
    g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = "round"; g.strokeStyle = bump ? "#fff" : "rgba(255,255,255,.9)"; g.lineWidth = bump ? 14 : 9;
    const br = (len: number, a: number, d: number) => { if (d === 0) return; g.save(); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -len); g.stroke(); g.translate(0, -len); br(len * 0.68, -0.55, d - 1); br(len * 0.68, 0.55, d - 1); g.restore(); };
    br(90, 0, 4); g.restore();
  };
  sprig(150, 740, 1); sprig(w - 150, 740, 1); sprig(60, 560, 0.55); sprig(w - 60, 560, 0.55);
  if (bump) g.filter = "blur(1px)";
  return c;
}

function cardTexture(fontFamily: string) {
  const w = 1100, h = 740, c = canvas(w, h), g = c.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, "#fffdf8"); bg.addColorStop(1, "#f3eaff"); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#d8bff0"; g.lineWidth = 3; g.strokeRect(34, 34, w - 68, h - 68);
  g.strokeStyle = "#e9c98f"; g.lineWidth = 1.5; g.strokeRect(48, 48, w - 96, h - 96);
  for (let i = 0; i < 46; i++) { const t = i / 45, x = 34 + t * (w - 68); for (const y of [34, h - 34]) { const pg = g.createRadialGradient(x - 2, y - 2, 1, x, y, 7); pg.addColorStop(0, "#fff"); pg.addColorStop(1, "#d9c8ee"); g.fillStyle = pg; g.beginPath(); g.arc(x, y, 6.5, 0, 7); g.fill(); } }
  g.textAlign = "center"; g.fillStyle = "#6b4aa8";
  g.font = `110px ${fontFamily}`; g.fillText("You're Invited", w / 2, 230);
  g.font = "700 28px Nunito, sans-serif"; g.fillStyle = "#4b3f8f";
  (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "7px";
  g.fillText(invitation.copy.revealKicker.toUpperCase(), w / 2, 320);
  (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
  const ng = g.createLinearGradient(300, 0, 800, 0); ng.addColorStop(0, "#a56bd8"); ng.addColorStop(0.55, "#d97fb6"); ng.addColorStop(1, "#c9964a");
  g.fillStyle = ng; g.font = `210px ${fontFamily}`; g.fillText(invitation.child.firstName, w / 2, 540);
  g.fillStyle = "#e9c98f"; g.beginPath(); g.moveTo(w / 2 - 120, 610); g.lineTo(w / 2 + 120, 610); g.lineWidth = 2; g.strokeStyle = "#e9c98f"; g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

/** Scallop: ribbed fan with domed body and scalloped rim; hinge at origin, opens toward +Y, dome toward +Z. */
export function scallop(ribs = 9) {
  return new ParametricGeometry((u, v, t) => {
    const a = (u - 0.5) * 2.5, r = v * (1 + 0.05 * Math.abs(Math.cos(a * ribs * 0.5 * 1.0)));
    const rib = 0.035 * Math.cos(a * ribs) * v;
    t.set(r * Math.sin(a) * 0.95, r * Math.cos(a) * 0.95 - 0.1, 0.32 * Math.sin(v * Math.PI * 0.55) * (1 - Math.pow(Math.abs(a) / 1.25, 2.2) * 0.55) + rib);
  }, 64, 24);
}

function fit(t: THREE.Texture) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / W, 1 / H); t.offset.set(0.5, 0.5); t.anisotropy = 8; return t; }

export default function Envelope3D({ state, fallback, onReady }: { state: MutableRefObject<EnvState>; fallback?: ReactNode; onReady?: (ok: boolean) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current; if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); } catch (e) { reportFail("Envelope3D WebGL context: " + String(e)); setFailed(true); onReady?.(false); return; }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.9;
    renderer.setClearColor(0, 0);
    Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block" });
    el.appendChild(renderer.domElement);
    let raf = 0; const disp: { dispose(): void }[] = [renderer];
    try {
      const scene = new THREE.Scene();
      const pm = new THREE.PMREMGenerator(renderer); try { scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; } catch (e) { console.warn("3D: environment map unavailable", e); } disp.push(pm);
      scene.add(new THREE.HemisphereLight("#eaf6ff", "#f7c4dc", 0.25));
      const key = new THREE.DirectionalLight("#fff3e2", 0.9); key.position.set(-3, 6, 7); scene.add(key);
      const rim = new THREE.DirectionalLight("#bfe0ff", 0.8); rim.position.set(5, 2, -4); scene.add(rim);
      const glowLight = new THREE.PointLight("#fff2fb", 0, 12, 1.4); glowLight.position.set(0, 1.5, 1.4); scene.add(glowLight);

      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
      const root = new THREE.Group(); scene.add(root);

      const colTex = fit(new THREE.CanvasTexture(paper("color", ["#a9d0f4", "#6fa6e0"]))); colTex.colorSpace = THREE.SRGBColorSpace;
      const bumpTex = fit(new THREE.CanvasTexture(paper("bump", ["#000", "#000"])));
      const linerTex = fit(new THREE.CanvasTexture(paper("color", ["#fbd6e8", "#e0cdf6"]))); linerTex.colorSpace = THREE.SRGBColorSpace;
      disp.push(colTex, bumpTex, linerTex);
      const paperMat = new THREE.MeshPhysicalMaterial({ map: colTex, bumpMap: bumpTex, bumpScale: 2.2, roughness: 0.62, sheen: 0.35, sheenColor: new THREE.Color("#dff0ff"), sheenRoughness: 0.6, clearcoat: 0.15, clearcoatRoughness: 0.5, envMapIntensity: 0.35, side: THREE.FrontSide });
      const linerMat = new THREE.MeshPhysicalMaterial({ map: linerTex, bumpMap: bumpTex, bumpScale: 1.2, roughness: 0.7, sheen: 0.5, envMapIntensity: 0.7 });
      disp.push(paperMat, linerMat);

      // back panel (liner)
      const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshPhysicalMaterial({ color: "#a9cdf0", roughness: 0.7, envMapIntensity: 0.6 })); back.position.z = -0.06; root.add(back);
      const backIn = new THREE.Mesh(new THREE.PlaneGeometry(W, H), linerMat); backIn.position.z = -0.045; root.add(backIn);
      disp.push(back.geometry, back.material as THREE.Material, backIn.geometry);

      // card
      const fontFamily = getComputedStyle(document.documentElement).getPropertyValue("--font-script").trim() || "cursive";
      const cardTex = cardTexture(fontFamily); disp.push(cardTex);
      const cardMat = new THREE.MeshPhysicalMaterial({ map: cardTex, roughness: 0.55, sheen: 0.3, emissive: new THREE.Color("#fff"), emissiveMap: cardTex, emissiveIntensity: 0.0, envMapIntensity: 0.6 });
      const card = new THREE.Mesh(new THREE.BoxGeometry(5.3, 3.55, 0.04), cardMat); card.position.set(0, 0.15, -0.0); root.add(card);
      document.fonts?.ready.then(() => { const t2 = cardTexture(fontFamily); cardMat.map = t2; cardMat.emissiveMap = t2; cardMat.needsUpdate = true; });

      // front pocket (V-cut)
      const sh = new THREE.Shape(); sh.moveTo(-W / 2, -H / 2); sh.lineTo(W / 2, -H / 2); sh.lineTo(W / 2, H / 2); sh.lineTo(0, 0.12); sh.lineTo(-W / 2, H / 2); sh.closePath();
      const pocketGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4 });
      const pocket = new THREE.Mesh(pocketGeo, [paperMat, paperMat]); pocket.position.z = 0.02; root.add(pocket); disp.push(pocketGeo);

      // flap, hinged on the top edge
      const pivot = new THREE.Group(); pivot.position.set(0, H / 2, 0.14); root.add(pivot);
      const fs = new THREE.Shape(); fs.moveTo(-W / 2, 0); fs.lineTo(W / 2, 0); fs.lineTo(0.0, -2.2); fs.closePath();
      const flapGeo = new THREE.ShapeGeometry(fs); { const uv = flapGeo.attributes.uv, ps = flapGeo.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, ps.getX(i), ps.getY(i) + H / 2); }
      const flapMat = paperMat.clone(); flapMat.color = new THREE.Color("#e4f0ff"); disp.push(flapMat); const flapOut = new THREE.Mesh(flapGeo, flapMat); flapOut.position.z = 0.012; const flapIn = new THREE.Mesh(flapGeo, linerMat); flapIn.rotation.y = Math.PI; flapIn.position.z = -0.012;
      // flap edge thickness: slightly raised rim
      const rim2 = new THREE.Mesh(new THREE.ExtrudeGeometry(fs, { depth: 0.02, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.015 }), new THREE.MeshPhysicalMaterial({ color: "#4f86c8", roughness: 0.7 }));
      rim2.scale.set(1.014, 1.022, 1); rim2.position.set(0, 0.0, -0.05);
      const shad = new THREE.Mesh(new THREE.ShapeGeometry(fs), new THREE.MeshBasicMaterial({ color: "#1b3a78", transparent: true, opacity: 0.28, depthWrite: false })); shad.scale.set(1.03, 1.04, 1); shad.position.set(0.03, -0.1, -0.035); pivot.add(shad); disp.push(shad.geometry, shad.material as THREE.Material); pivot.add(rim2, flapOut, flapIn); disp.push(flapGeo, rim2.geometry);

      // pearl trim along the V edges
      const pearlMat = new THREE.MeshPhysicalMaterial({ color: "#fff8f0", roughness: 0.1, metalness: 0.4, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.4, envMapIntensity: 1.6 });
      const pg = new THREE.SphereGeometry(1, 20, 14); disp.push(pearlMat, pg);
      const N = 16, pearls = new THREE.InstancedMesh(pg, pearlMat, N * 2 + 1); const d = new THREE.Object3D(); let pi = 0;
      for (let k = 0; k < N; k++) { const t = k / (N - 1); for (const sd of [-1, 1]) { d.position.set(sd * (W / 2 - t * (W / 2 - 0.18)), H / 2 - t * (H / 2 - 0.1) - 0.06, 0.2); d.scale.setScalar(0.055 + 0.03 * Math.sin(t * Math.PI)); d.updateMatrix(); pearls.setMatrixAt(pi++, d.matrix); } }
      d.position.set(0, 0.0, 0.16); d.scale.setScalar(0.1); d.updateMatrix(); pearls.setMatrixAt(pi++, d.matrix); root.add(pearls);

      // seal: 3D scallop with pearl
      const sealGeo = scallop(9); disp.push(sealGeo);
      const sealMat = new THREE.MeshPhysicalMaterial({ color: "#ffd3e6", roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1, iridescence: 1, iridescenceIOR: 1.5, sheen: 0.8, sheenColor: new THREE.Color("#cfe6ff"), emissive: new THREE.Color("#ff9fcf"), emissiveIntensity: 0.12, side: THREE.DoubleSide, transparent: true, envMapIntensity: 1.3 });
      const seal = new THREE.Group(); const shell = new THREE.Mesh(sealGeo, sealMat); shell.scale.set(0.9, 0.9, 0.9); shell.position.y = -0.25; shell.rotation.x = 0.05;
      const sp = new THREE.Mesh(pg, pearlMat); sp.scale.setScalar(0.13); sp.position.set(0, -0.05, 0.2); seal.add(shell, sp); seal.position.set(0, -0.12, 0.26); root.add(seal); disp.push(sealMat);

      // sparkle motes
      const spark = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: "#fff", size: 0.07, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      const sp3 = new Float32Array(60 * 3); for (let i = 0; i < 60; i++) { sp3[i * 3] = (Math.random() - 0.5) * 6; sp3[i * 3 + 1] = Math.random() * 4.5; sp3[i * 3 + 2] = 0.3 + Math.random(); }
      spark.geometry.setAttribute("position", new THREE.BufferAttribute(sp3, 3)); root.add(spark); disp.push(spark.geometry, spark.material as THREE.Material);

      let px = 0, py = 0, w = 1, h = 1, baseDist = 20, visH = 8;
      const onMove = (e: PointerEvent) => { px = (e.clientX / window.innerWidth - 0.5) * 2; py = (e.clientY / window.innerHeight - 0.5) * 2; };
      window.addEventListener("pointermove", onMove, { passive: true });
      const resize = () => {
        w = el.clientWidth || 1; h = el.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h;
        const frac = Math.min(0.8 * w, 640) / w, tan = Math.tan((camera.fov * Math.PI) / 360);
        baseDist = W / frac / (2 * tan * camera.aspect); visH = 2 * tan * baseDist; camera.updateProjectionMatrix();
      };
      resize(); const ro = new ResizeObserver(resize); ro.observe(el);
      onReady?.(true);

      const tgt = new THREE.Vector3(), ease = (x: number) => 1 - Math.pow(1 - x, 3);
      const safe = makeSafe(renderer, scene, () => { cancelAnimationFrame(raf); setFailed(true); onReady?.(false); });
    const loop = (ms: number) => {
        raf = requestAnimationFrame(loop);
        const t = ms / 1000, s = state.current;
        const fl = reduce ? 0 : Math.sin(t * 0.9) * 0.07 * (1 - s.zoom);
        root.position.set(0, -0.1 * visH + 0.08 * visH * 0 + fl, 0);
        root.rotation.set(reduce ? -0.08 : -0.1 + py * 0.05 + Math.sin(t * 0.6) * 0.012, reduce ? 0 : px * 0.1 + Math.sin(t * 0.5) * 0.02, 0);
        pivot.rotation.x = Math.PI * ease(s.flap) * 0.995;
        card.position.y = 0.15 + 1.9 * ease(s.card); card.position.z = 0.0 + 0.25 * ease(s.card); card.rotation.x = -0.04 * s.card;
        cardMat.emissiveIntensity = 0.06 * s.glow; glowLight.intensity = 3 * s.glow;
        const so = ease(s.seal); seal.position.set(0.5 * so, -0.12 - 1.7 * so, 0.26 + 0.9 * so); seal.rotation.set(-0.6 * so, 0, 0.9 * so); seal.scale.setScalar(1 + 0.12 * Math.min(1, s.seal * 3) * (1 - s.seal)); sealMat.opacity = Math.max(0, 1 - Math.max(0, so - 0.55) / 0.45);
        sealMat.emissiveIntensity = 0.12 + (reduce ? 0 : 0.07 * Math.sin(t * 2.4)) + 0.4 * (1 - so) * s.seal;
        seal.visible = sealMat.opacity > 0.01;
        (spark.material as THREE.PointsMaterial).opacity = 0.9 * s.glow; spark.position.y = reduce ? 0 : (t * 0.15) % 0.6;
        const z = baseDist * (1 - 0.5 * ease(s.zoom));
        tgt.set(0, (0.1 * visH * 0) + 2.1 * ease(s.zoom) * 0.7 + root.position.y * 0.2, 0);
        camera.position.set(0, tgt.y + 0.4 * (1 - s.zoom), z); camera.lookAt(tgt);
        safe(camera);
      };
      raf = requestAnimationFrame(loop);
      var cleanupAll = () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("pointermove", onMove); disp.forEach((x) => x.dispose()); renderer.domElement.remove(); };
    } catch (e) { console.error("Envelope3D failed", e); reportFail("Envelope3D: " + String(e)); try { renderer.dispose(); renderer.domElement.remove(); } catch {} setFailed(true); onReady?.(false); return; }
    return () => cleanupAll();
  }, [state, onReady]);

  return <div ref={host} className="env3d" aria-hidden>{failed && fallback}</div>;
}
