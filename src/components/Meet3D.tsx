"use client";
/* Scene 05 - the pearl shell that opens to present Aurora's portrait (Three.js). `state.open` 0..1 swings the lid up. */
import { MutableRefObject, useEffect, useRef } from "react";
import * as THREE from "three";
import { makeSafe } from "@/lib/safeRender";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { scallop } from "./Envelope3D";

export type MeetState = { open: number };

export default function Meet3D({ state }: { state: MutableRefObject<MeetState> }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current; if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); } catch { return; }
    const small = window.innerWidth < 760, reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85; renderer.setClearColor(0, 0);
    Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block" });
    el.appendChild(renderer.domElement);
    const disp: { dispose(): void }[] = [renderer]; let raf = 0;
    const scene = new THREE.Scene(), pm = new THREE.PMREMGenerator(renderer); try { scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; } catch (e) { console.warn("3D: environment map unavailable", e); } scene.environmentIntensity = 0.6; disp.push(pm);
    scene.add(new THREE.HemisphereLight("#f4fbff", "#f7c4dc", 0.6));
    const key = new THREE.DirectionalLight("#fff4ee", 1.4); key.position.set(-3, 6, 8); scene.add(key);
    const glow = new THREE.PointLight("#ffd9f0", 0, 14, 1.2); glow.position.set(0, 0.5, 3); scene.add(glow);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);

    const sg = scallop(15); disp.push(sg);
    const shellMat = (c: string, e: string, ei: number) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1, iridescence: 1, iridescenceIOR: 1.5, sheen: 0.9, sheenColor: new THREE.Color("#d8ecff"), emissive: new THREE.Color(e), emissiveIntensity: ei, side: THREE.DoubleSide, envMapIntensity: 1.1 });
    const back = new THREE.Mesh(sg, shellMat("#e6aedb", "#ffb0e0", 0.08)), lid = new THREE.Group(), lidM = new THREE.Mesh(sg, shellMat("#8fc3f0", "#6fb0ff", 0.06)), front = new THREE.Mesh(sg, shellMat("#f79fc6", "#ff7fb8", 0.08));
    const BASE = -1.6;
    back.scale.set(3.5, 3.1, 3.5); back.position.set(0, BASE, -0.5);
    lidM.scale.set(3.2, 2.9, 3.2); lid.add(lidM); lid.position.set(0, BASE, 0.0);
    front.scale.set(1.2, 1.1, 1.2); front.position.set(0, BASE - 0.55, 1.1); front.rotation.x = -0.25;
    scene.add(back, lid, front);
    const pearlM = new THREE.MeshPhysicalMaterial({ color: "#fff8ee", roughness: 0.1, metalness: 0.4, clearcoat: 1, iridescence: 1, envMapIntensity: 1.6 }), pg = new THREE.SphereGeometry(1, 24, 16); disp.push(pearlM, pg);
    const mainPearl = new THREE.Mesh(pg, pearlM); mainPearl.scale.setScalar(0.3); mainPearl.position.set(0, BASE - 0.35, 1.5); scene.add(mainPearl);
    [[-1.7, -0.6], [1.9, -0.7], [-2.4, -0.4], [2.5, -0.5], [-0.9, -0.55], [1.0, -0.6]].forEach(([x, y], i) => { const p = new THREE.Mesh(pg, pearlM); p.scale.setScalar(0.1 + (i % 3) * 0.04); p.position.set(x, BASE + 0.1 + y * 0.3, 1.2); scene.add(p); });
    // drifting bubbles
    const bm = new THREE.MeshPhysicalMaterial({ color: "#e8f6ff", roughness: 0.04, transparent: true, opacity: 0.3, clearcoat: 1, envMapIntensity: 1.8, depthWrite: false }); disp.push(bm);
    const bubbles = Array.from({ length: small ? 8 : 14 }, (_, i) => { const m = new THREE.Mesh(pg, bm); const s = 0.08 + ((i * 37) % 10) / 60; m.scale.setScalar(s); scene.add(m); return { m, x: ((i * 53) % 100) / 100 * 7 - 3.5, ph: i * 1.7, sp: 0.15 + ((i * 29) % 10) / 60 }; });

    let w = 1, h = 1;
    const resize = () => { w = el.clientWidth || 1; h = el.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; const t = Math.tan((camera.fov * Math.PI) / 360); camera.position.set(0, 0, 6.6 / (2 * t * camera.aspect)); camera.lookAt(0, -0.1, 0); camera.updateProjectionMatrix(); };
    resize(); const ro = new ResizeObserver(resize); ro.observe(el);
    let visible = true; const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "100px" }); io.observe(el);
    const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
    const safe = makeSafe(renderer, scene, () => { cancelAnimationFrame(raf);  });
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop); if (!visible || document.hidden) return;
      const t = reduce ? 0 : ms / 1000, o = ease(state.current.open);
      lid.rotation.x = (1 - o) * 1.35;          // folded forward and down -> standing open
      lid.position.z = (1 - o) * 0.8;
      glow.intensity = 4 * o * (0.9 + 0.1 * Math.sin(t * 1.5));
      back.rotation.y = Math.sin(t * 0.4) * 0.04; front.rotation.z = Math.sin(t * 0.6) * 0.02;
      bubbles.forEach((b) => { const y = ((t * b.sp + b.ph) % 5) - 1.8; b.m.position.set(b.x + Math.sin(t * 0.7 + b.ph) * 0.25, y, 1.6); (b.m.material as THREE.MeshPhysicalMaterial).opacity = 0.3; });
      safe(camera);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); scene.traverse((o) => { const m = o as THREE.Mesh; const mm = m.material as THREE.Material | THREE.Material[] | undefined; if (mm) (Array.isArray(mm) ? mm : [mm]).forEach((x) => x.dispose()); }); disp.forEach((d) => d.dispose()); renderer.domElement.remove(); };
  }, [state]);
  return <div ref={host} className="meet3d" aria-hidden />;
}
