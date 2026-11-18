import * as THREE from "three";

/** Convert fancy physical materials (clearcoat/sheen/iridescence) into plain standard ones. Used when a GPU/driver fails to compile the heavy shaders. */
function simplify(scene: THREE.Scene) {
  const swap = (m: THREE.Material): THREE.Material => {
    if (!(m instanceof THREE.MeshPhysicalMaterial)) return m;
    const n = new THREE.MeshStandardMaterial({
      color: m.color, map: m.map, roughness: Math.max(0.35, m.roughness), metalness: Math.min(m.metalness, 0.5), emissive: m.emissive, emissiveIntensity: m.emissiveIntensity, emissiveMap: m.emissiveMap,
      transparent: m.transparent, opacity: m.opacity, side: m.side, depthWrite: m.depthWrite, vertexColors: m.vertexColors, envMapIntensity: m.envMapIntensity, fog: m.fog,
    });
    m.dispose(); return n;
  };
  scene.traverse((o) => { const mesh = o as THREE.Mesh; if (!mesh.material) return; mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material); });
}

const lowEnd = () => typeof navigator !== "undefined" && ((navigator.hardwareConcurrency || 8) <= 4 || ((navigator as unknown as { deviceMemory?: number }).deviceMemory || 8) <= 4);

/** Never leave a blank canvas, and never stay laggy:
 *  - render failure -> retry once with simplified materials, then hide the canvas and call onFatal (show a fallback)
 *  - slow frames (or a weak device) -> cheaper materials and lower resolution, automatically. */
export function makeSafe(renderer: THREE.WebGLRenderer, scene: THREE.Scene, onFatal: () => void) {
  let stage = 0, simplified = false, last = 0, ema = 16, frames = 0, tier = 0;
  const fatal = () => { stage = 2; reportFail("render failed, 3D hidden"); try { renderer.domElement.style.display = "none"; } catch {} onFatal(); };
  const cheap = () => { if (!simplified) { simplified = true; simplify(scene); } };
  const dpr = (v: number) => { try { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, v)); renderer.setSize(renderer.domElement.clientWidth || 1, renderer.domElement.clientHeight || 1, false); } catch {} };
  renderer.domElement.addEventListener("webglcontextlost", (e) => { e.preventDefault(); fatal(); });
  if (lowEnd()) { cheap(); dpr(1); tier = 1; }
  return (camera: THREE.Camera) => {
    if (stage >= 2) return;
    const now = performance.now(), dt = now - last; last = now;
    if (dt > 0 && dt < 200) { ema = ema * 0.94 + dt * 0.06; frames++; }
    if (frames > 90) {            // adapt: ~1.5s of data
      frames = 0;
      if (ema > 26 && tier < 3) { tier++; if (tier === 1) { cheap(); dpr(1); } else if (tier === 2) dpr(0.75); else dpr(0.55); }
    }
    try {
      renderer.render(scene, camera);
      if (stage === 0 && renderer.info.programs && renderer.info.programs.some((p) => { const d = (p as unknown as { diagnostics?: { runnable: boolean } }).diagnostics; return d && !d.runnable; })) throw new Error("shader not runnable");
    } catch (e) {
      if (stage === 0) { stage = 1; console.warn("3D: simplifying materials after render failure", e); try { cheap(); renderer.render(scene, camera); } catch { fatal(); } }
      else fatal();
    }
  };
}

/** Dev-only on-screen note so a failing GPU/driver is visible without opening the console. */
export function reportFail(msg: string) {
  if (typeof document === "undefined" || process.env.NODE_ENV === "production") return;
  let el = document.getElementById("diag-3d");
  if (!el) { el = document.createElement("div"); el.id = "diag-3d"; el.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:9999;max-width:min(92vw,560px);padding:8px 10px;border-radius:10px;background:rgba(40,20,70,.92);color:#fff;font:12px/1.4 monospace;white-space:pre-wrap;pointer-events:none"; document.body.appendChild(el); }
  if (!el.textContent?.includes(msg)) el.textContent = (el.textContent ? el.textContent + "\n" : "3D problem on this device:\n") + msg.slice(0, 220);
}
