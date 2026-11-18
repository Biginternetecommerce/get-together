"use client";
/* Environment building blocks: every scene composes its own light, haze, reef and particles from these. */
import React, { useEffect, useMemo } from "react";
import { causticDataUrl } from "@/lib/caustics";
import { rng, taper } from "./Art";

type P = { className?: string; style?: React.CSSProperties };

/** Publishes the procedural caustic texture as --caustic on :root (once). */
export function useCausticTexture() {
  useEffect(() => { document.documentElement.style.setProperty("--caustic", `url(${causticDataUrl()})`); }, []);
}

/** Animated caustic light-web. `tint` colours the light, mask fades it with depth. */
export function Caustics({ opacity = 0.5, size = 420, className, style }: P & { opacity?: number; size?: number }) {
  return <div className={`caustics ${className || ""}`} style={{ ["--cs" as string]: `${size}px`, opacity, ...style }} aria-hidden><i /><i /></div>;
}

/** Soft volumetric light beams (blurred, uneven, swaying) - replaces the straight repeating rays. */
export function Shafts({ color = "255,255,255", seed = 1, count = 5, className, style }: P & { color?: string; seed?: number; count?: number }) {
  const beams = useMemo(() => { const r = rng(seed * 13); return Array.from({ length: count }, (_, i) => ({ l: 8 + (i / count) * 84 + (r() - 0.5) * 8, w: 5 + r() * 12, a: -16 + r() * 28, o: 0.12 + r() * 0.2, d: 9 + r() * 9, de: -r() * 9 })); }, [seed, count]);
  return (
    <div className={`shafts ${className || ""}`} style={style} aria-hidden>
      {beams.map((b, i) => <i key={i} style={{ left: `${b.l}%`, width: `${b.w}%`, opacity: b.o, transform: `rotate(${b.a}deg)`, animationDuration: `${b.d}s`, animationDelay: `${b.de}s`, background: `linear-gradient(180deg, rgba(${color},.95), rgba(${color},.35) 45%, rgba(${color},0) 90%)` }} />)}
    </div>
  );
}

/** Procedural distant-reef silhouette: ridges, rounded coral heads, branching spires, sea fans. Haze-tinted for depth. */
export function ReefLayer({ seed = 1, top = "#8fd5e8", bottom = "#6fb8dd", height = 260, detail = 1, className, style }: P & { seed?: number; top?: string; bottom?: string; height?: number; detail?: number }) {
  const { d, spires } = useMemo(() => {
    const r = rng(seed * 101 + 5), W = 1600; let path = `M0 ${height}`; let y = height * 0.5; const spiresArr: string[] = [];
    for (let x = 0; x <= W; x += 40) {
      y += (r() - 0.5) * height * 0.22; y = Math.max(height * 0.22, Math.min(height * 0.7, y));
      path += `L${x} ${y.toFixed(0)}`;
      if (r() < 0.34 * detail) { const h = height * (0.22 + r() * 0.3), a = -Math.PI / 2 + (r() - 0.5) * 0.5; const p: [number, number][] = [[x, y + 6], [x + Math.cos(a) * h * 0.5 + (r() - 0.5) * 12, y - h * 0.5], [x + Math.cos(a) * h + (r() - 0.5) * 20, y - h]]; spiresArr.push(taper(p, 16 + r() * 14, 7)); }
      if (r() < 0.22 * detail) { const rad = 26 + r() * 40; spiresArr.push(`M${x - rad} ${y + 10}a${rad} ${rad * 0.8} 0 0 1 ${rad * 2} 0z`); }
    }
    return { d: path + `L${W} ${height}Z`, spires: spiresArr };
  }, [seed, height, detail]);
  const id = `rl-${seed}-${top.replace("#", "")}`;
  return (
    <svg className={className} style={style} viewBox={`0 0 1600 ${height}`} preserveAspectRatio="none" aria-hidden>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bottom} /></linearGradient></defs>
      <g fill={`url(#${id})`}><path d={d} />{spires.map((s, i) => <path key={i} d={s} />)}</g>
    </svg>
  );
}

/** Drifting marine snow / sparkle motes. Pure CSS, a handful of nodes. */
export function Motes({ count = 22, seed = 4, color = "255,255,255", className, style }: P & { count?: number; seed?: number; color?: string }) {
  const m = useMemo(() => { const r = rng(seed * 17); return Array.from({ length: count }, () => ({ l: r() * 100, t: r() * 100, s: 2 + r() * 5, d: 8 + r() * 12, de: -r() * 12, o: 0.25 + r() * 0.5 })); }, [count, seed]);
  return <div className={`motes ${className || ""}`} style={style} aria-hidden>{m.map((p, i) => <i key={i} style={{ left: `${p.l}%`, top: `${p.t}%`, width: p.s, height: p.s, opacity: p.o, animationDuration: `${p.d}s`, animationDelay: `${p.de}s`, background: `rgba(${color},.9)`, boxShadow: `0 0 ${p.s * 3}px rgba(${color},.8)` }} />)}</div>;
}
