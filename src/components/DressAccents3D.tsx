"use client";
/* Scene 07 - 3D finishing touches around the dress: iridescent shells at the hem, a draped pearl garland and drifting pearls. Decorative. */
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeSafe } from "@/lib/safeRender";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { scallop } from "./Envelope3D";

export default function DressAccents3D() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current; if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { return; }
    const small = window.innerWidth < 760, reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.75)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.9; renderer.setClearColor(0, 0);
    Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block" });
    el.appendChild(renderer.domElement);
    const disp: { dispose(): void }[] = [renderer]; let raf = 0;
    const scene = new THREE.Scene(), pm = new THREE.PMREMGenerator(renderer); try { scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; } catch (e) { console.warn("3D: environment map unavailable", e); } scene.environmentIntensity = 0.6; disp.push(pm);
    scene.add(new THREE.HemisphereLight("#ffffff", "#f7c4dc", 0.6));
    const key = new THREE.DirectionalLight("#fff6ee", 1.3); key.position.set(-3, 5, 7); scene.add(key);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
    const pearlM = new THREE.MeshPhysicalMaterial({ color: "#fffaf2", roughness: 0.12, metalness: 0.15, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.4, envMapIntensity: 1.5 }), pg = new THREE.SphereGeometry(1, 24, 16); disp.push(pearlM, pg);
    const sg = scallop(13); disp.push(sg);
    const mk = (c: string, e: string) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.22, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.5, sheen: 0.9, sheenColor: new THREE.Color("#e0f0ff"), emissive: new THREE.Color(e), emissiveIntensity: 0.12, side: THREE.DoubleSide });
    const sA = new THREE.Mesh(sg, mk("#8fc3f0", "#6fb0ff")), sB = new THREE.Mesh(sg, mk("#f79fc6", "#ff7fb8"));
    sA.scale.setScalar(1.5); sA.position.set(-2.2, -3.55, 0.8); sA.rotation.set(-0.25, 0.4, 0.08);
    sB.scale.setScalar(1.1); sB.position.set(2.3, -3.6, 0.8); sB.rotation.set(-0.25, -0.4, -0.1);
    scene.add(sA, sB);
    for (const [s, x] of [[sA, -2.2], [sB, 2.3]] as [THREE.Mesh, number][]) { const p = new THREE.Mesh(pg, pearlM); p.scale.setScalar(0.17); p.position.set(x, -3.2, 1.4); scene.add(p); }
    // draped pearl garland (catenary) across the shoulders/hanger line
    const N = 26, garland = new THREE.InstancedMesh(pg, pearlM, N), d = new THREE.Object3D();
    for (let i = 0; i < N; i++) { const t = i / (N - 1), x = -2.6 + t * 5.2, y = 3.6 - 0.7 * Math.sin(t * Math.PI); d.position.set(x, y, 0.9); d.scale.setScalar(0.07 + 0.03 * Math.sin(t * Math.PI)); d.updateMatrix(); garland.setMatrixAt(i, d.matrix); }
    scene.add(garland);
    const bm = new THREE.MeshPhysicalMaterial({ color: "#eef8ff", roughness: 0.04, transparent: true, opacity: 0.32, clearcoat: 1, depthWrite: false, envMapIntensity: 1.8 }); disp.push(bm);
    const floaters = Array.from({ length: small ? 6 : 10 }, (_, i) => { const pearl = i % 2 === 0, m = new THREE.Mesh(pg, pearl ? pearlM : bm); m.scale.setScalar(pearl ? 0.1 + (i % 3) * 0.03 : 0.14 + (i % 4) * 0.04); scene.add(m); return { m, x: ((i * 53) % 100) / 100 * 7 - 3.5, ph: i * 1.7, sp: 0.1 + ((i * 29) % 10) / 90 }; });
    const resize = () => { const w = el.clientWidth || 1, h = el.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; const t = Math.tan((camera.fov * Math.PI) / 360); camera.position.set(0, 0, Math.max(8.2 / (2 * t * camera.aspect), 9.4 / (2 * t))); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); };
    resize(); const ro = new ResizeObserver(resize); ro.observe(el);
    let visible = true; const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "100px" }); io.observe(el);
    const safe = makeSafe(renderer, scene, () => { cancelAnimationFrame(raf);  });
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop); if (!visible || document.hidden) return;
      const t = reduce ? 0 : ms / 1000;
      sA.rotation.z = 0.08 + Math.sin(t * 0.6) * 0.03; sB.rotation.z = -0.1 + Math.sin(t * 0.6 + 1) * 0.03; garland.rotation.z = Math.sin(t * 0.5) * 0.012;
      floaters.forEach((f) => f.m.position.set(f.x + Math.sin(t * 0.5 + f.ph) * 0.3, ((t * f.sp + f.ph) % 8) - 4, 1.3));
      safe(camera);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); scene.traverse((o) => { const m = o as THREE.Mesh; const mm = m.material as THREE.Material | THREE.Material[] | undefined; if (mm) (Array.isArray(mm) ? mm : [mm]).forEach((x) => x.dispose()); }); disp.forEach((x) => x.dispose()); renderer.domElement.remove(); };
  }, []);
  return <div ref={host} className="dress-3d" aria-hidden />;
}
