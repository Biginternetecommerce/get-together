/* Dress-code illustration: baby-blue tulle gown with pearl + seashell detailing, drawn as a lit, layered vector piece. */
import React from "react";

type P = { className?: string; style?: React.CSSProperties };
const pearls = (pts: [number, number][], r = 4.2) => pts.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={r} fill="url(#g-pearl)" /><circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.28} fill="#fff" /></g>);

export function DressArt({ className, style }: P) {
  const waist = Array.from({ length: 13 }, (_, i) => [96 + i * 11.5, 206 + Math.sin((i / 12) * Math.PI) * 5] as [number, number]);
  const neck = Array.from({ length: 11 }, (_, i) => { const t = i / 10; return [112 + t * 96, 118 + Math.sin(t * Math.PI) * 14] as [number, number]; });
  const dots = [[84, 330], [120, 352], [170, 340], [210, 360], [244, 330], [104, 384], [150, 392], [196, 396], [236, 384], [128, 300], [190, 310], [226, 296], [90, 270], [160, 272], [66, 360], [262, 372]] as [number, number][];
  return (
    <svg viewBox="0 0 320 470" className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id="d-skirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d9eefc" /><stop offset=".55" stopColor="#bfe0f6" /><stop offset="1" stopColor="#a6d2f0" /></linearGradient>
        <linearGradient id="d-tulle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#9fcdee" /><stop offset=".3" stopColor="#e6f5fd" /><stop offset=".55" stopColor="#c7e4f7" /><stop offset="1" stopColor="#9fcdee" /></linearGradient>
        <linearGradient id="d-bodice" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e7f5fe" /><stop offset=".6" stopColor="#bfe0f6" /><stop offset="1" stopColor="#9ccaed" /></linearGradient>
        <linearGradient id="d-sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".45" stopColor="#fff" stopOpacity=".7" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
      </defs>
      <ellipse cx="160" cy="456" rx="120" ry="9" fill="#2a4f7a" opacity=".2" filter="url(#f-blur2)" />
      {/* hanger */}
      <path d="M160 14c-8 0-12 6-12 12 0 5 4 8 8 8" fill="none" stroke="#e6c98f" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M156 34L84 92M164 34l72 58" stroke="#e6c98f" strokeWidth="3.4" strokeLinecap="round" />
      {/* back tulle layers */}
      <path d="M84 232C60 330 22 400 14 440c40 14 90 10 146 10s106 4 146-10c-8-40-46-110-70-208z" fill="url(#d-tulle)" opacity=".9" />
      <path d="M92 232C74 320 44 384 36 424c40 12 82 8 124 8s84 4 124-8c-8-40-38-104-56-192z" fill="url(#d-skirt)" opacity=".95" />
      {/* tulle scalloped tiers */}
      {[0, 1, 2].map((t) => { const y = 292 + t * 52, wd = 66 + t * 24; return <path key={t} d={`M${160 - wd} ${y}${Array.from({ length: 9 }, (_, i) => `q${(wd * 2) / 18} ${14 + (i % 2) * 5} ${(wd * 2) / 9} 0`).join("")}`} fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth="2.6" strokeLinecap="round" />; })}
      <path d="M96 236C76 322 52 392 44 432M224 236c20 86 44 156 52 196M160 236v200" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2.4" />
      <path d="M118 238C108 320 96 380 92 428M202 238c10 82 22 142 26 190" fill="none" stroke="#7fb1dd" strokeOpacity=".22" strokeWidth="6" />
      <path d="M130 240c-14 80-22 140-20 190" fill="none" stroke="url(#d-sheen)" strokeWidth="26" strokeLinecap="round" opacity=".55" />
      {/* skirt-top gathers */}
      <path d="M92 232c26 14 100 14 136 0l4 14c-40 16-104 16-144 0z" fill="#8fc0e8" />
      {/* bodice */}
      <path d="M100 126C98 160 104 190 110 214c32 10 68 10 100 0 6-24 12-54 10-88-18 10-40 14-60 14s-42-4-60-14z" fill="url(#d-bodice)" />
      <path d="M100 126c18 10 40 14 60 14s42-4 60-14" fill="none" stroke="#fff" strokeWidth="2.6" strokeOpacity=".9" />
      <path d="M110 214c32 10 68 10 100 0" fill="none" stroke="#fff" strokeWidth="2.4" />
      <path d="M112 150C108 176 112 196 116 212M208 150c4 26 0 46-4 62" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2.4" />
      {/* seashell appliqués on the bust */}
      {[[140, 168, -8], [180, 168, 8]].map(([x, y, rot], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
          <path d="M-18 8C-24-12-10-24 0-24s24 12 18 32c-8 6-28 6-36 0z" fill="#fff" stroke="#c9a3d6" strokeWidth="1.6" strokeOpacity=".7" />
          {[-12, -4, 4, 12].map((dx, k) => <path key={k} d={`M0 8L${dx} -18`} stroke="#d9b7e6" strokeWidth="1.4" />)}
          <path d="M-18 8h36" stroke="#d9b7e6" strokeWidth="1.6" /><circle cx="0" cy="12" r="3.6" fill="url(#g-pearl)" />
        </g>
      ))}
      <path d="M154 140l6 14 6-14" fill="none" stroke="#fff" strokeWidth="2" strokeOpacity=".8" />
      {/* straps */}
      <path d="M112 128C108 96 100 78 88 66M208 128c4-32 12-50 24-62" fill="none" stroke="url(#d-bodice)" strokeWidth="11" strokeLinecap="round" />
      <path d="M112 128C108 96 100 78 88 66M208 128c4-32 12-50 24-62" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2.4" strokeLinecap="round" transform="translate(-2 -1)" />
      {pearls(neck, 3.6)}
      {/* pearl belt + bow */}
      <path d="M98 208c40 14 84 14 124 0" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
      <path d="M98 208c40 14 84 14 124 0" fill="none" stroke="#e8d7f4" strokeWidth="9" strokeLinecap="round" strokeOpacity=".5" />
      {pearls(waist, 4.4)}
      <g transform="translate(160 232)"><path d="M0 0C-26-18-44-8-40 8c4 14 28 8 40-8z" fill="#f6b8d6" /><path d="M0 0C26-18 44-8 40 8c-4 14-28 8-40-8z" fill="#f6b8d6" /><path d="M-30 4c10-8 20-6 30 0" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2.4" /><path d="M-6 6L-20 44M6 6l14 40" stroke="#f6b8d6" strokeWidth="9" strokeLinecap="round" /><circle cx="0" cy="2" r="8" fill="url(#g-pearl)" /></g>
      {pearls(dots, 3.6)}
    </svg>
  );
}

/** Silk fabric swatch: folded highlight, stitched edge, pearl button. */
export function Swatch({ color, deep, name }: { color: string; deep: string; name: string }) {
  const id = name.replace(/\W/g, "");
  return (
    <figure className="swatch">
      <svg viewBox="0 0 120 120" aria-hidden>
        <defs>
          <linearGradient id={`sw-${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".9" /><stop offset=".3" stopColor={color} /><stop offset=".8" stopColor={deep} /></linearGradient>
          <linearGradient id={`sf-${id}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        </defs>
        <ellipse cx="62" cy="112" rx="44" ry="5" fill="#2a4f7a" opacity=".18" />
        <path d="M14 18c20-8 40 6 60 0s26-8 34-2c4 30 2 60 0 84-22 8-42-6-62 0s-26 6-32 0c-4-30-4-56 0-82z" fill={`url(#sw-${id})`} />
        <path d="M14 18c20-8 40 6 60 0s26-8 34-2c4 30 2 60 0 84-22 8-42-6-62 0s-26 6-32 0c-4-30-4-56 0-82z" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="2" strokeDasharray="4 4" transform="translate(0 0) scale(.94) translate(4 4)" />
        <path d="M44 14c-10 34 12 62 2 94" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="9" strokeLinecap="round" />
        <circle cx="86" cy="36" r="8.5" fill="url(#g-pearl)" /><circle cx="83" cy="33" r="2.6" fill="#fff" />
      </svg>
      <figcaption>{name}</figcaption>
    </figure>
  );
}
