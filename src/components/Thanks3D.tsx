"use client";
/* Scene 10 - golden-hour farewell (Three.js). Warm low sun through the water, pastel coral, glowing jellyfish,
   a turtle gliding past and a little octopus waving goodbye. Time-based, calm. */
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeSafe } from "@/lib/safeRender";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { branchCoral, brainCoral, hexTexture, makeJelly, makeOctopus, makeTurtle, mat, ridge, rng, tubeCoral } from "./Dive3D";
import { causticCanvas } from "@/lib/caustics";

const FY = -4;
const C = (h: string) => new THREE.Color(h);

export default function Thanks3D() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current; if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: (window.devicePixelRatio || 1) < 1.5, powerPreference: "high-performance" }); } catch { return; }
    const small = window.innerWidth < 760, reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85;
    Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block" });
    el.appendChild(renderer.domElement);
    const disp: { dispose(): void }[] = [renderer]; let raf = 0;
    const scene = new THREE.Scene(), pm = new THREE.PMREMGenerator(renderer); try { scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; } catch (e) { console.warn("3D: environment map unavailable", e); } scene.environmentIntensity = 0.4; disp.push(pm);
    scene.fog = new THREE.FogExp2(C("#f6b4c0"), 0.013);
    scene.add(new THREE.HemisphereLight("#ffe2c4", "#c79ae0", 0.9));
    const sun = new THREE.DirectionalLight("#ffd29a", 2.2); sun.position.set(2, 6, -6); scene.add(sun);
    const fill = new THREE.DirectionalLight("#ffb6d6", 0.8); fill.position.set(-5, 3, 8); scene.add(fill);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 150); camera.position.set(0, 1.4, 15); scene.add(camera);

    /* sunset-water backdrop (vertex-coloured quad on the camera) + sun disc */
    const col = new Float32Array(12), bgG = new THREE.PlaneGeometry(1, 1); bgG.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const stops = [C("#9cc6ee"), C("#ffd9b8"), C("#f9a9b8")]; // top, mid, bottom
    [stops[0], stops[0], stops[2], stops[2]].forEach((c, i) => { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; });
    const bg = new THREE.Mesh(bgG, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, depthWrite: false, toneMapped: false })); bg.position.z = -100; bg.renderOrder = -10; camera.add(bg);
    const glowTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!; const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, "rgba(255,250,225,1)"); gr.addColorStop(0.18, "rgba(255,226,166,.85)"); gr.addColorStop(0.5, "rgba(255,180,150,.28)"); gr.addColorStop(1, "rgba(255,160,150,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); })(); disp.push(glowTex);
    const sunM = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, toneMapped: false })); sunM.position.set(0, 2, -95); sunM.renderOrder = -9; camera.add(sunM);

    /* reef silhouettes in warm pastel */
    for (const [z, w, b, a, t, bt, seed] of [[-80, 220, -6, 5, "#f9c6c4", "#f0a9bb", 4], [-55, 180, -5.5, 4.5, "#e9b0d0", "#d594c4", 8], [-34, 140, -5.2, 3.2, "#c9a0e0", "#b08ad2", 13]] as [number, number, number, number, string, string, number][]) {
      const g = ridge(seed, w, b, a, t, bt); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })); m.position.z = z; scene.add(m); disp.push(g, m.material as THREE.Material);
    }
    /* sand + golden caustics */
    const fg = new THREE.PlaneGeometry(160, 120, 80, 60), fp = fg.attributes.position;
    for (let i = 0; i < fp.count; i++) fp.setZ(i, 0.4 * Math.sin(fp.getX(i) * 0.2) * Math.cos(fp.getY(i) * 0.16));
    fg.computeVertexNormals();
    const floor = new THREE.Mesh(fg, mat("#f8cfa8", { roughness: 0.9, clearcoat: 0 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, FY, -30); scene.add(floor);
    const cTex = new THREE.CanvasTexture(causticCanvas(256)); cTex.wrapS = cTex.wrapT = THREE.RepeatWrapping; cTex.repeat.set(12, 9); cTex.colorSpace = THREE.SRGBColorSpace;
    const cm = new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ map: cTex, color: "#ffe2a8", transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })); cm.rotation.copy(floor.rotation); cm.position.set(0, FY + 0.03, -30); scene.add(cm);
    disp.push(fg, floor.material as THREE.Material, cTex, cm.material as THREE.Material);

    /* coral in sunset pastels */
    const em = (c: string, e: string) => mat(c, { emissive: C(e), emissiveIntensity: 0.14 });
    const mats = [em("#f59ac0", "#ffc4dc"), em("#ffb292", "#ffd8b8"), em("#c39bec", "#e3cdfa"), em("#f8a6d8", "#ffd0ee")]; disp.push(...mats);
    const geos = [branchCoral(41), branchCoral(42), branchCoral(43), tubeCoral(71), brainCoral(7)]; disp.push(...geos);
    const r = rng(19), n = small ? 16 : 28;
    for (let i = 0; i < n; i++) {
      const side = r() < 0.5 ? -1 : 1, z = 8 - r() * 36, x = side * (8 + r() * 16), g = geos[Math.floor(r() * geos.length)];
      const m = new THREE.Mesh(g, mats[Math.floor(r() * mats.length)]); const s = (0.9 + r() * 1.5) * (z < -12 ? 1.4 : 1); m.scale.set(s, s * (0.9 + r() * 0.4), s); m.rotation.y = r() * 6; m.position.set(x, FY + 0.1, z); scene.add(m);
    }
    for (const [x, z, gi, mi, s] of [[-9, 2, 0, 0, 2.4], [10, 0, 1, 1, 2.6], [-13, -8, 2, 2, 3], [15, -10, 0, 3, 3.2]] as [number, number, number, number, number][]) { const m = new THREE.Mesh(geos[gi], mats[mi]); m.scale.setScalar(s); m.position.set(x, FY + 0.1, z); scene.add(m); }

    /* characters */
    const oct = makeOctopus(); const octX = small ? -2.4 : -6.4; oct.g.scale.setScalar(small ? 0.9 : 1.2); oct.g.position.set(octX, FY + 0.3, -1); oct.g.rotation.y = 0.5; scene.add(oct.g);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(2, 1), mat("#f4c3d6", { roughness: 0.7 })); rock.scale.set(1.5, 0.6, 1.1); rock.position.set(octX + 0.2, FY + 0.1, -1.4); scene.add(rock); disp.push(rock.geometry, rock.material as THREE.Material);
    const tex = hexTexture(); disp.push(tex); const tur = makeTurtle(tex); tur.g.scale.setScalar(1.1); scene.add(tur.g);
    const jr = rng(5);
    const jellies = ([[6.5, 2.2, 2, "#ffd0e8", 1.4], [-2, 4.2, -4, "#ffe0b8", 1.8], [3, 0.5, -8, "#e6d0ff", 2.2], [-9, 1.5, -6, "#ffd7ee", 1.6], [10, 4, -10, "#fff0c8", 2]] as [number, number, number, string, number][]).slice(0, small ? 3 : 5)
      .map(([x, y, z, tint, sc]) => { const j = makeJelly(jr, tint); j.g.scale.setScalar(sc); j.g.position.set(x, y, z); scene.add(j.g); return { ...j, x, y, ph: jr() * 6 }; });

    /* warm light shafts */
    const shaftTex = (() => { const c = document.createElement("canvas"); c.width = 64; c.height = 256; const g = c.getContext("2d")!; const gh = g.createLinearGradient(0, 0, 64, 0); gh.addColorStop(0, "rgba(255,255,255,0)"); gh.addColorStop(0.5, "rgba(255,255,255,1)"); gh.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gh; g.fillRect(0, 0, 64, 256); g.globalCompositeOperation = "destination-in"; const gv = g.createLinearGradient(0, 0, 0, 256); gv.addColorStop(0, "rgba(0,0,0,1)"); gv.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gv; g.fillRect(0, 0, 64, 256); return new THREE.CanvasTexture(c); })(); disp.push(shaftTex);
    const shafts = Array.from({ length: 6 }, (_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(3 + (i % 3) * 2.5, 40), new THREE.MeshBasicMaterial({ map: shaftTex, color: "#ffdca0", transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false })); m.position.set(-14 + i * 6, 10, -12 - (i % 3) * 8); m.rotation.z = -0.25 + (i % 2) * 0.12; scene.add(m); disp.push(m.geometry, m.material as THREE.Material); return { m, ph: i * 1.3 }; });

    /* golden motes */
    const mn = small ? 120 : 260, mp = new Float32Array(mn * 3), mr = rng(2);
    for (let i = 0; i < mn; i++) { mp[i * 3] = (mr() - 0.5) * 44; mp[i * 3 + 1] = FY + mr() * 14; mp[i * 3 + 2] = 12 - mr() * 40; }
    const mg = new THREE.BufferGeometry(); mg.setAttribute("position", new THREE.BufferAttribute(mp, 3));
    const motes = new THREE.Points(mg, new THREE.PointsMaterial({ map: glowTex, color: "#ffe6b0", size: 0.3, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(motes); disp.push(mg);

    const resize = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = camera.aspect < 0.8 ? 62 : 45; camera.updateProjectionMatrix();
      const vh = 2 * Math.tan((camera.fov * Math.PI) / 360) * 100; bg.scale.set(vh * camera.aspect * 1.3, vh * 1.3, 1);
      camera.position.set(0, small ? 2.2 : 2.4, small ? 18 : 17); camera.lookAt(0, small ? 0.2 : 0.6, 0);
    };
    resize(); const ro = new ResizeObserver(resize); ro.observe(el);
    let visible = true; const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "100px" }); io.observe(el);
    const safe = makeSafe(renderer, scene, () => { cancelAnimationFrame(raf);  });
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop); if (!visible || document.hidden) return;
      const t = reduce ? 0 : ms / 1000;
      // octopus: idle sway + one arm raised in a slow wave
      oct.head.scale.y = 1.15 + Math.sin(t * 1.3) * 0.03; oct.g.position.y = FY + 0.3 + Math.sin(t * 0.9) * 0.06;
      oct.tents.forEach((ch, k) => ch.forEach((s, i) => {
        if (k === 0) { s.rotation.x = 0; s.rotation.z = (i === 0 ? -2.0 : -0.12) + (i === 0 ? 0 : 0) + Math.sin(t * 3.2 - i * 0.45) * (i === 0 ? 0.35 : 0.28); }
        else { const w = Math.sin(t * 1.3 - i * 0.55 + k) * 0.16; if (i > 0) { s.rotation.x = 0.28 + w * 0.6; s.rotation.z = Math.cos(t * 1.1 - i * 0.5 + k * 1.7) * 0.14; } else s.rotation.x = 0.9 + w * 0.3; }
      }));
      // turtle glides across the background
      const u = ((t / 38) % 1); tur.g.position.set(-16 + 32 * u, 3.5 + Math.sin(t * 0.7) * 0.4, -5); tur.g.rotation.set(0, Math.PI / 2 - 0.2, Math.cos(t * 0.7) * 0.04);
      tur.fl.forEach((f, i) => { const sd = (f as unknown as { side: number }).side, ph = i < 2 ? 0 : 1.2; f.rotation.z = sd * Math.sin(t * 2 + ph) * 0.5; });
      for (const j of jellies) { const s = 1 + Math.sin(t * 1.4 + j.ph) * 0.07; j.bell.scale.set(1 + (1 - s) * 0.5, 0.85 * s, 1 + (1 - s) * 0.5); j.g.position.y = j.y + Math.sin(t * 0.4 + j.ph) * 0.9; j.g.position.x = j.x + Math.sin(t * 0.23 + j.ph) * 0.7; j.tents.forEach((m, i) => { m.rotation.z = Math.sin(t * 1.1 + i + j.ph) * 0.05; }); }
      for (const s of shafts) (s.m.material as THREE.MeshBasicMaterial).opacity = 0.09 + 0.04 * Math.sin(t * 0.5 + s.ph);
      cTex.offset.set(t * 0.01, t * 0.016); motes.position.y = reduce ? 0 : (t * 0.15) % 2;
      safe(camera);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose?.(); const mm = m.material as THREE.Material | THREE.Material[] | undefined; if (mm) (Array.isArray(mm) ? mm : [mm]).forEach((x) => x.dispose()); }); disp.forEach((d) => d.dispose()); renderer.domElement.remove(); };
  }, []);
  return <div ref={host} className="ty-3d" aria-hidden />;
}
