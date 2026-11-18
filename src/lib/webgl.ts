let cached: boolean | null = null;
/** True if this browser can actually create the kind of WebGL2 context the 3D scenes need. */
export function hasWebGL2(): boolean {
  if (cached !== null) return cached;
  if (process.env.NODE_ENV !== "production" && location.search.includes("nogl")) { // test switch: simulate a device with no WebGL
    const orig = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, t: string, ...a: unknown[]) { return /webgl/.test(t) ? null : (orig as (...x: unknown[]) => unknown).call(this, t, ...a); } as typeof orig;
    return (cached = false);
  }
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2", { antialias: true, alpha: true, powerPreference: "high-performance" }) as WebGL2RenderingContext | null;
    cached = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch { cached = false; }
  return cached;
}
