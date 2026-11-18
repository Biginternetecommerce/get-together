"use client";
/* Scene 06 - a large illuminated pearl shell glowing behind the invitation panel (Three.js). Slow breathing glow, drifting pearls and bubbles. */
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeSafe } from "@/lib/safeRender";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { scallop } from "./Envelope3D";

export default function InviteShell3D() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current; if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); } catch { return; }
    const small = window.innerWidth < 760, reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.9; renderer.setClearColor(0, 0);
    Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block" });
    el.appendChild(renderer.domElement);
    const disp: { dispose(): void }[] = [renderer]; let raf = 0;
    const scene = new THREE.Scene(), pm = new THREE.PMREMGenerator(renderer); try { scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; } catch (e) { console.warn("3D: environment map unavailable", e); } scene.environmentIntensity = 0.6; disp.push(pm);
    scene.add(new THREE.HemisphereLight("#fff4ff", "#d9b8f4", 0.7));
    const key = new THREE.DirectionalLight("#fff0f6", 1.3); key.position.set(-3, 6, 8); scene.add(key);
    const glow = new THREE.PointLight("#ffd0ec", 6, 18, 1.2); glow.position.set(0, 0.5, 3); scene.add(glow);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
    const sg = scallop(17); disp.push(sg);
    const mk = (c: string, e: string, ei: number) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.22, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.5, sheen: 0.9, sheenColor: new THREE.Color("#ffe4f4"), emissive: new THREE.Color(e), emissiveIntensity: ei, side: THREE.DoubleSide });
    const big = new THREE.Mesh(sg, mk("#f2b8e6", "#ff9fd8", 0.25)); big.scale.set(5.2, 4.6, 5.2); big.position.set(0, -2.0, -1);
    const mid = new THREE.Mesh(sg, mk("#bfaaf0", "#a58aff", 0.18)); mid.scale.set(4.4, 3.8, 4.4); mid.position.set(0, -2.0, -0.5);
    scene.add(big, mid);
    const pearlM = new THREE.MeshPhysicalMaterial({ color: "#fff8ee", roughness: 0.1, metalness: 0.4, clearcoat: 1, iridescence: 1, envMapIntensity: 1.5 }), pg = new THREE.SphereGeometry(1, 20, 14); disp.push(pearlM, pg);
    const bm = new THREE.MeshPhysicalMaterial({ color: "#f4ecff", roughness: 0.04, transparent: true, opacity: 0.3, clearcoat: 1, depthWrite: false, envMapIntensity: 1.8 }); disp.push(bm);
    const items = Array.from({ length: small ? 10 : 18 }, (_, i) => { const pearl = i % 3 === 0, m = new THREE.Mesh(pg, pearl ? pearlM : bm); m.scale.setScalar(pearl ? 0.14 : 0.1 + ((i * 31) % 10) / 45); scene.add(m); return { m, x: ((i * 47) % 100) / 100 * 11 - 5.5, ph: i * 1.9, sp: 0.1 + ((i * 17) % 10) / 80 }; });
    const resize = () => { const w = el.clientWidth || 1, h = el.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; const t = Math.tan((camera.fov * Math.PI) / 360); camera.position.set(0, 0, Math.max(11 / (2 * t * camera.aspect), 8 / (2 * t))); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); };
    resize(); const ro = new ResizeObserver(resize); ro.observe(el);
    let visible = true; const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "100px" }); io.observe(el);
    const safe = makeSafe(renderer, scene, () => { cancelAnimationFrame(raf);  });
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop); if (!visible || document.hidden) return;
      const t = reduce ? 0 : ms / 1000;
      glow.intensity = 6 + 2 * Math.sin(t * 0.9); big.rotation.y = Math.sin(t * 0.3) * 0.05; mid.rotation.y = Math.sin(t * 0.3 + 1) * -0.05;
      items.forEach((b) => b.m.position.set(b.x + Math.sin(t * 0.5 + b.ph) * 0.3, ((t * b.sp + b.ph) % 7) - 3.6, 1.5));
      safe(camera);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); scene.traverse((o) => { const m = o as THREE.Mesh; const mm = m.material as THREE.Material | THREE.Material[] | undefined; if (mm) (Array.isArray(mm) ? mm : [mm]).forEach((x) => x.dispose()); }); disp.forEach((d) => d.dispose()); renderer.domElement.remove(); };
  }, []);
  return <div ref={host} className="inv-shell3d" aria-hidden />;
}
