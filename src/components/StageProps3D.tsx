"use client";
/* Scene 04 - 3D stage dressing: octopus, turtle, coral and glowing shells, layered over the platform. Reveal follows `progress` (0..1). */
import { MutableRefObject, useEffect, useRef } from "react";
import * as THREE from "three";
import { makeSafe } from "@/lib/safeRender";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { branchCoral, brainCoral, hexTexture, makeOctopus, makeTurtle, mat, tubeCoral } from "./Dive3D";
import { scallop } from "./Envelope3D";

export default function StageProps3D({ progress }: { progress: MutableRefObject<number> }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current; if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); } catch { return; }
    const small = window.innerWidth < 760, reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.setClearColor(0, 0);
    Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block" });
    el.appendChild(renderer.domElement);
    const disp: { dispose(): void }[] = [renderer]; let raf = 0;
    const scene = new THREE.Scene(), pm = new THREE.PMREMGenerator(renderer); try { scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; } catch (e) { console.warn("3D: environment map unavailable", e); } scene.environmentIntensity = 0.45; disp.push(pm);
    scene.add(new THREE.HemisphereLight("#f4e8ff", "#f7b8dc", 0.55));
    const key = new THREE.DirectionalLight("#fff2f8", 1.2); key.position.set(-3, 8, 9); scene.add(key);
    const rim = new THREE.DirectionalLight("#c9b8ff", 0.9); rim.position.set(5, 3, -4); scene.add(rim);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80); camera.position.set(0, 0, 18);

    const props = new THREE.Group(); scene.add(props);
    const tex = hexTexture(); disp.push(tex);
    const oct = makeOctopus(), tur = makeTurtle(tex);
    const em = (c: string, e: string) => mat(c, { emissive: new THREE.Color(e), emissiveIntensity: 0.15 });
    const pink = em("#f08fbb", "#f7b6d3"), lav = em("#b093e6", "#cdb6f3"), blue = em("#8cc6ee", "#bfe3f7"), mint = em("#8dd8bd", "#c8f0de");
    const bc = branchCoral(31), bc2 = branchCoral(32), tc = tubeCoral(61), br = brainCoral(5); disp.push(bc, bc2, tc, br, pink, lav, blue, mint);
    const shellMat = (c: string, e: string) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.25, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.5, sheen: 0.8, sheenColor: new THREE.Color("#cfe6ff"), emissive: new THREE.Color(e), emissiveIntensity: 0.35, side: THREE.DoubleSide });
    const sg = scallop(11), pearlM = new THREE.MeshPhysicalMaterial({ color: "#fff8ee", roughness: 0.1, metalness: 0.4, clearcoat: 1, iridescence: 1, envMapIntensity: 1.5 }), pg = new THREE.SphereGeometry(1, 20, 14); disp.push(sg, pearlM, pg);
    const mkShell = (c: string, e: string) => {
      const g = new THREE.Group(); const m = new THREE.Mesh(sg, shellMat(c, e)); m.scale.setScalar(1.15);
      const p = new THREE.Mesh(pg, pearlM); p.scale.setScalar(0.17); p.position.set(0, 0.12, 0.28); g.add(m, p);
      const l = new THREE.PointLight(e, 0, 6, 1.5); l.position.set(0, 0.8, 1.2); g.add(l); return { g, l };
    };
    const shellL = mkShell("#bfe3f7", "#9fd2ff"), shellR = mkShell("#ffcfe6", "#ff9fcf");
    const add = (o: THREE.Object3D) => { props.add(o); return o; };
    const mc = (geo: THREE.BufferGeometry, m: THREE.Material) => new THREE.Mesh(geo, m);
    const items = { oct: add(oct.g), tur: add(tur.g), c1: add(mc(bc, pink)), c2: add(mc(bc2, lav)), c3: add(mc(tc, blue)), c4: add(mc(br, mint)), c5: add(mc(bc, lav)), c6: add(mc(tc, pink)), sl: add(shellL.g), sr: add(shellR.g) };
    type K = keyof typeof items;
    let W = 8, H = 6.9, S = 1;
    const base: Record<K, number> = { oct: 1.1, tur: 1.05, c1: 1.7, c2: 1.7, c3: 0.8, c4: 0.9, c5: 1.0, c6: 0.7, sl: 1.0, sr: 0.9 };
    const place = () => {
      const x = (f: number) => f * W, y = (f: number) => -H + f * H;
      items.oct.position.set(x(-0.74), y(0.14), 0.5); items.oct.rotation.y = 0.3;
      items.tur.position.set(x(0.7), y(W < H ? 0.3 : 0.5), 0); items.tur.rotation.y = -Math.PI / 2 + 1.0;
      items.c1.position.set(x(-0.97), y(0.1), -0.5); items.c2.position.set(x(0.96), y(0.1), -0.5);
      items.c3.position.set(x(-0.48), y(0.1), 1); items.c4.position.set(x(0.48), y(0.12), 1.2); items.c5.position.set(x(0.72), y(0.08), 0.8); items.c6.position.set(x(-0.9), y(0.08), 0.6);
      items.sl.position.set(x(-0.3), y(0.2), 2); items.sl.rotation.set(-0.1, 0.35, 0); items.sr.position.set(x(0.32), y(0.2), 2); items.sr.rotation.set(-0.1, -0.35, 0);
      (Object.keys(items) as K[]).forEach((k) => { items[k].userData.s = base[k] * S; });
    };
    const resize = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = camera.aspect < 0.8 ? 52 : 42; camera.updateProjectionMatrix();
      H = Math.tan((camera.fov * Math.PI) / 360) * 18; W = H * camera.aspect; S = Math.min(1, camera.aspect * 1.05) * (camera.aspect < 0.8 ? 0.85 : 1); place();
    };
    resize(); const ro = new ResizeObserver(resize); ro.observe(el);
    let visible = true; const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "100px" }); io.observe(el);
    const ease = (x: number) => { const c = Math.min(1, Math.max(0, x)); return 1 - Math.pow(1 - c, 3); };
    const stagger: Record<K, number> = { c1: 0.1, c2: 0.14, c6: 0.16, c5: 0.2, c3: 0.22, c4: 0.26, oct: 0.3, tur: 0.34, sl: 0.4, sr: 0.44 };
    const safe = makeSafe(renderer, scene, () => { cancelAnimationFrame(raf);  });
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop); if (!visible || document.hidden) return;
      const t = reduce ? 0 : ms / 1000, p = progress.current;
      (Object.keys(items) as K[]).forEach((k) => { const o = items[k], g = ease((p - stagger[k]) / 0.3); o.scale.setScalar(Math.max(0.0001, o.userData.s * g)); o.visible = g > 0.001; });
      oct.head.scale.y = 1.15 + Math.sin(t * 1.4) * 0.03;
      oct.tents.forEach((ch, k) => ch.forEach((s, i) => { const w = Math.sin(t * 1.3 - i * 0.55 + k) * 0.16; if (i > 0) { s.rotation.x = 0.28 + w * 0.6; s.rotation.z = Math.cos(t * 1.1 - i * 0.5 + k * 1.7) * 0.14; } else s.rotation.x = 0.9 + w * 0.3; }));
      items.tur.position.y = -H + (W < H ? 0.3 : 0.5) * H + Math.sin(t * 0.8) * 0.18; items.tur.rotation.z = Math.cos(t * 0.8) * 0.05;
      tur.fl.forEach((f, i) => { const sd = (f as unknown as { side: number }).side, ph = i < 2 ? 0 : 1.2; f.rotation.z = sd * Math.sin(t * 2.2 + ph) * 0.55; f.rotation.y = sd * Math.cos(t * 2.2 + ph) * 0.18; });
      shellL.l.intensity = 6 * ease((p - 0.45) / 0.3) * (0.85 + 0.15 * Math.sin(t * 1.6)); shellR.l.intensity = 6 * ease((p - 0.5) / 0.3) * (0.85 + 0.15 * Math.sin(t * 1.6 + 1));
      safe(camera);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose?.(); const mm = m.material as THREE.Material | THREE.Material[] | undefined; if (mm) (Array.isArray(mm) ? mm : [mm]).forEach((x) => x.dispose()); });
      disp.forEach((d) => d.dispose()); renderer.domElement.remove();
    };
  }, [progress]);
  return <div ref={host} className="st-props3d" aria-hidden />;
}
