"use client";
/* A dimensional pastel scallop with a pearl, used as the art for the RSVP YES / NO buttons.
   Hover / focus / press on the parent button tilts it and brightens its glow. Decorative only: the label stays in HTML. */
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeSafe } from "@/lib/safeRender";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { scallop } from "./Envelope3D";

const TONES = { blue: { c: "#8fc3f0", e: "#6fb0ff", sheen: "#d8ecff" }, pink: { c: "#f79fc6", e: "#ff7fb8", sheen: "#ffe0f0" } };

export default function ShellButton3D({ tone }: { tone: "blue" | "pink" }) {
  const host = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = host.current; if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { return; }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches, T = TONES[tone];
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.9; renderer.setClearColor(0, 0);
    Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block" });
    el.appendChild(renderer.domElement);
    const disp: { dispose(): void }[] = [renderer]; let raf = 0;
    const scene = new THREE.Scene(), pm = new THREE.PMREMGenerator(renderer); try { scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; } catch (e) { console.warn("3D: environment map unavailable", e); } scene.environmentIntensity = 0.6; disp.push(pm);
    scene.add(new THREE.HemisphereLight("#ffffff", "#f7c4dc", 0.6));
    const key = new THREE.DirectionalLight("#fff6ee", 1.4); key.position.set(-2, 4, 6); scene.add(key);
    const glow = new THREE.PointLight(T.e, 1.5, 8, 1.4); glow.position.set(0, 0.6, 2.2); scene.add(glow);
    const camera = new THREE.PerspectiveCamera(28, 1.28, 0.1, 30); camera.position.set(0, 0.15, 7.4); camera.lookAt(0, -0.1, 0);
    const g = scallop(13), m = new THREE.MeshPhysicalMaterial({ color: T.c, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1, iridescence: 1, iridescenceIOR: 1.5, sheen: 0.9, sheenColor: new THREE.Color(T.sheen), emissive: new THREE.Color(T.e), emissiveIntensity: 0.1, side: THREE.DoubleSide });
    const pearlM = new THREE.MeshPhysicalMaterial({ color: "#fff8ee", roughness: 0.1, metalness: 0.4, clearcoat: 1, iridescence: 1, envMapIntensity: 1.5 }), pg = new THREE.SphereGeometry(1, 24, 16); disp.push(g, m, pearlM, pg);
    const grp = new THREE.Group(); scene.add(grp);
    const shell = new THREE.Mesh(g, m); shell.scale.setScalar(2.0); shell.position.y = -0.75; grp.add(shell);
    const pearl = new THREE.Mesh(pg, pearlM); pearl.scale.setScalar(0.26); pearl.position.set(0, -0.62, 0.62); grp.add(pearl);
    const btn = el.closest("button"); let hot = 0, target = 0, press = 0;
    const on = () => { target = 1; }, off = () => { target = 0; press = 0; }, down = () => { press = 1; }, up = () => { press = 0; };
    btn?.addEventListener("pointerenter", on); btn?.addEventListener("pointerleave", off); btn?.addEventListener("focus", on); btn?.addEventListener("blur", off); btn?.addEventListener("pointerdown", down); btn?.addEventListener("pointerup", up);
    const resize = () => { const w = el.clientWidth || 1, h = el.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    resize(); const ro = new ResizeObserver(resize); ro.observe(el);
    let visible = true; const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "60px" }); io.observe(el);
    const safe = makeSafe(renderer, scene, () => { cancelAnimationFrame(raf);  });
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop); if (!visible || document.hidden) return;
      const t = reduce ? 0 : ms / 1000; hot += (target - hot) * 0.12;
      grp.rotation.y = Math.sin(t * 0.7) * 0.08 + hot * 0.22; grp.rotation.x = -0.18 - hot * 0.12; grp.position.y = Math.sin(t * 0.9) * 0.05 + hot * 0.08; grp.scale.setScalar(1 + hot * 0.06 - press * 0.06);
      m.emissiveIntensity = 0.1 + hot * 0.35 + (reduce ? 0 : 0.04 * Math.sin(t * 2)); glow.intensity = 1.5 + hot * 5;
      safe(camera);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); btn?.removeEventListener("pointerenter", on); btn?.removeEventListener("pointerleave", off); btn?.removeEventListener("focus", on); btn?.removeEventListener("blur", off); btn?.removeEventListener("pointerdown", down); btn?.removeEventListener("pointerup", up); disp.forEach((d) => d.dispose()); renderer.domElement.remove(); };
  }, [tone]);
  return <span ref={host} className="rs-3d" aria-hidden />;
}
