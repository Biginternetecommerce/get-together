/* Original layered illustration library - premium soft-3D look built from lit gradients, rim light,
   subsurface glow, tapered organic limbs and ambient-occlusion shading. All shared defs live in <ArtDefs/>. */
import React from "react";

type P = { className?: string; style?: React.CSSProperties };
type Pt = [number, number];

/** Deterministic pseudo-random so SSR and client agree. */
export function rng(seed: number) { let s = seed; return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296); }
const f1 = (n: number) => +n.toFixed(1);

/* ---------- geometry helpers ---------- */
function spline(pts: Pt[], seg = 7): Pt[] {
  const out: Pt[] = [];
  const g = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    for (let s = 0; s < seg; s++) {
      const t = s / seg, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
/** Tapered organic limb outline along a spine; `shift` offsets the outline sideways (for highlight/shadow strips). */
export function taper(pts: Pt[], w0: number, w1: number, shift = 0, seg = 7): string {
  const s = spline(pts, seg), n = s.length, L: Pt[] = [], R: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = s[Math.max(0, i - 1)], b = s[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    const nx = -ty, ny = tx, k = i / (n - 1), w = (w0 + (w1 - w0) * Math.pow(k, 0.85)) / 2;
    const cx = s[i][0] + nx * shift, cy = s[i][1] + ny * shift;
    L.push([cx + nx * w, cy + ny * w]); R.push([cx - nx * w, cy - ny * w]);
  }
  const e = s[n - 1], we = (w1 / 2);
  return `M${L.map((p) => `${f1(p[0])} ${f1(p[1])}`).join("L")}A${f1(we)} ${f1(we)} 0 0 ${1} ${f1(R[n - 1][0])} ${f1(R[n - 1][1])}L${R.slice().reverse().map((p) => `${f1(p[0])} ${f1(p[1])}`).join("L")}Z`;
  void e;
}

/* ---------- shared gradients & filters (render once per page) ---------- */
export function ArtDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        <radialGradient id="g-pearl" cx="34%" cy="30%" r="78%"><stop offset="0" stopColor="#fff" /><stop offset=".35" stopColor="#fff7f0" /><stop offset=".72" stopColor="#ecdcf3" /><stop offset="1" stopColor="#b9a4dd" /></radialGradient>
        <radialGradient id="g-pearlrim" cx="50%" cy="50%" r="50%"><stop offset=".8" stopColor="#bfe5f3" stopOpacity="0" /><stop offset="1" stopColor="#9fd9f0" stopOpacity=".6" /></radialGradient>
        <radialGradient id="g-oct" cx="36%" cy="24%" r="92%"><stop offset="0" stopColor="#f7efff" /><stop offset=".32" stopColor="#dcc6f7" /><stop offset=".68" stopColor="#bb9bea" /><stop offset="1" stopColor="#8e69cc" /></radialGradient>
        <radialGradient id="g-octao" cx="60%" cy="95%" r="70%"><stop offset="0" stopColor="#6d4aa8" stopOpacity=".5" /><stop offset="1" stopColor="#6d4aa8" stopOpacity="0" /></radialGradient>
        <linearGradient id="g-octleg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c5a8ee" /><stop offset=".55" stopColor="#dca9e0" /><stop offset="1" stopColor="#f6bcd9" /></linearGradient>
        <linearGradient id="g-octlegdark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9b78d4" /><stop offset="1" stopColor="#d48fc3" /></linearGradient>
        <linearGradient id="g-gloss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".95" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <radialGradient id="g-eye" cx="45%" cy="35%" r="70%"><stop offset="0" stopColor="#6e5bc0" /><stop offset=".55" stopColor="#2e2466" /><stop offset="1" stopColor="#1b1445" /></radialGradient>
        <radialGradient id="g-blush" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#ff7fb2" stopOpacity=".7" /><stop offset="1" stopColor="#ff7fb2" stopOpacity="0" /></radialGradient>
        {/* shell: iridescent mother-of-pearl */}
        <radialGradient id="g-shellrib" cx="120" cy="196" r="170" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#f6c3df" /><stop offset=".3" stopColor="#fff2f8" /><stop offset=".62" stopColor="#ffffff" /><stop offset=".86" stopColor="#d4ecfb" /><stop offset="1" stopColor="#f3d0ec" /></radialGradient>
        <radialGradient id="g-shellrib2" cx="120" cy="196" r="170" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#e9b4d6" /><stop offset=".3" stopColor="#f9dcec" /><stop offset=".62" stopColor="#f3ecfb" /><stop offset=".86" stopColor="#bfdff6" /><stop offset="1" stopColor="#e7bfe5" /></radialGradient>
        <radialGradient id="g-shellblue" cx="120" cy="196" r="170" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#8fc3ee" /><stop offset=".4" stopColor="#d4ebfb" /><stop offset=".75" stopColor="#ffffff" /><stop offset="1" stopColor="#bfe5f3" /></radialGradient>
        <radialGradient id="g-shellblue2" cx="120" cy="196" r="170" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#6fa9e0" /><stop offset=".4" stopColor="#b9dcf6" /><stop offset=".75" stopColor="#e9f5fd" /><stop offset="1" stopColor="#a9d6ef" /></radialGradient>
        <radialGradient id="g-shellpink" cx="120" cy="196" r="170" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#ef9dc5" /><stop offset=".4" stopColor="#ffd9ea" /><stop offset=".75" stopColor="#fff" /><stop offset="1" stopColor="#f6c3e0" /></radialGradient>
        <radialGradient id="g-shellpink2" cx="120" cy="196" r="170" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#e07fae" /><stop offset=".4" stopColor="#f9c3dd" /><stop offset=".75" stopColor="#fdeaf4" /><stop offset="1" stopColor="#efb3d6" /></radialGradient>
        <linearGradient id="g-hinge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#dcbfe6" /></linearGradient>
        <radialGradient id="g-turtle" cx="40%" cy="22%" r="90%"><stop offset="0" stopColor="#ffe9b8" /><stop offset=".4" stopColor="#efc98a" /><stop offset=".8" stopColor="#c99660" /><stop offset="1" stopColor="#a87445" /></radialGradient>
        <linearGradient id="g-scute" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff2c9" stopOpacity=".95" /><stop offset=".55" stopColor="#f0cd92" stopOpacity=".6" /><stop offset="1" stopColor="#c99660" stopOpacity=".3" /></linearGradient>
        <linearGradient id="g-turtleskin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d8f0c0" /><stop offset=".6" stopColor="#a9d98f" /><stop offset="1" stopColor="#84c48d" /></linearGradient>
        <linearGradient id="g-turtleskin2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b2d99a" /><stop offset="1" stopColor="#6fb383" /></linearGradient>
        <radialGradient id="g-bell" cx="50%" cy="78%" r="75%"><stop offset="0" stopColor="#ffb9e0" stopOpacity=".95" /><stop offset=".45" stopColor="#f1c9f2" stopOpacity=".7" /><stop offset="1" stopColor="#c3b0f2" stopOpacity=".5" /></radialGradient>
        <linearGradient id="g-tent" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd2ec" stopOpacity=".95" /><stop offset="1" stopColor="#c9b8f6" stopOpacity="0" /></linearGradient>
        <linearGradient id="g-horse" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e6d9fb" /><stop offset=".6" stopColor="#bda6ee" /><stop offset="1" stopColor="#8fb0ee" /></linearGradient>
        <linearGradient id="g-star" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe0d2" /><stop offset=".6" stopColor="#f9b4a0" /><stop offset="1" stopColor="#ef8f9a" /></linearGradient>
        <radialGradient id="g-balloon" cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="#fff" stopOpacity=".7" /><stop offset=".45" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#8a6bb8" stopOpacity=".22" /></radialGradient>
        <radialGradient id="g-bubble" cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="#fff" stopOpacity=".9" /><stop offset=".3" stopColor="#fff" stopOpacity=".06" /><stop offset=".78" stopColor="#bfe5f3" stopOpacity=".16" /><stop offset=".92" stopColor="#f6c5db" stopOpacity=".5" /><stop offset="1" stopColor="#bfe5f3" stopOpacity=".7" /></radialGradient>
        <linearGradient id="g-kelp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7fd3b4" /><stop offset=".5" stopColor="#b7ecd2" /><stop offset="1" stopColor="#6cbfa3" /></linearGradient>
        <linearGradient id="g-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff3c9" /><stop offset=".45" stopColor="#e9c77f" /><stop offset="1" stopColor="#b98f4b" /></linearGradient>
        <filter id="f-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id="f-blur2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2" /></filter>
        <filter id="f-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="14" /></filter>
        <filter id="f-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="n" /><feColorMatrix in="n" type="matrix" values="0 0 0 0 .45  0 0 0 0 .4  0 0 0 0 .6  0 0 0 .22 0" /><feComposite in2="SourceGraphic" operator="in" /></filter>
        <filter id="f-emboss" x="-5%" y="-5%" width="110%" height="110%"><feOffset in="SourceAlpha" dx="-1.4" dy="-1.4" result="a" /><feFlood floodColor="#fff" floodOpacity=".95" /><feComposite in2="a" operator="in" result="hi" /><feOffset in="SourceAlpha" dx="1.6" dy="1.8" result="b" /><feFlood floodColor="#5b79b4" floodOpacity=".4" /><feComposite in2="b" operator="in" result="lo" /><feMerge><feMergeNode in="lo" /><feMergeNode in="hi" /></feMerge></filter>
      </defs>
    </svg>
  );
}

/* ---------- small things ---------- */
export function Pearl({ className, style }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden>
      <ellipse cx="12.6" cy="21.6" rx="8" ry="1.6" fill="#4b3a8f" opacity=".18" />
      <circle cx="12" cy="12" r="10.4" fill="url(#g-pearl)" /><circle cx="12" cy="12" r="10.4" fill="url(#g-pearlrim)" />
      <ellipse cx="8.4" cy="7.6" rx="3.6" ry="2.3" fill="#fff" opacity=".9" transform="rotate(-30 8.4 7.6)" /><circle cx="16.2" cy="16.4" r="1.2" fill="#fff" opacity=".5" />
    </svg>
  );
}

export function Bubble({ className, style }: P) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <circle cx="50" cy="50" r="47" fill="url(#g-bubble)" stroke="#fff" strokeOpacity=".5" strokeWidth="1.4" />
      <path d="M18 56a34 34 0 0 0 58 20" fill="none" stroke="#bfe5f3" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round" />
      <path d="M26 34a28 28 0 0 1 22-18" fill="none" stroke="#f6c5db" strokeOpacity=".6" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="33" cy="28" rx="13" ry="7" fill="#fff" opacity=".9" transform="rotate(-32 33 28)" />
      <rect x="64" y="62" width="9" height="5" rx="2.5" fill="#fff" opacity=".75" transform="rotate(-40 68 64)" />
    </svg>
  );
}

export function Sparkle({ className, style }: P) {
  return (<svg viewBox="0 0 40 40" className={className} style={style} aria-hidden><path d="M20 0q2.4 17.6 20 20-17.6 2.4-20 20-2.4-17.6-20-20Q17.6 17.6 20 0z" fill="#fff" /><circle cx="20" cy="20" r="3" fill="#fff" filter="url(#f-blur2)" /></svg>);
}

/* ---------- OCTOPUS ---------- */
export function Octopus({ className, style, mood = "smile", bow = true }: P & { mood?: "smile" | "sleep" | "cheer"; bow?: boolean }) {
  const wave = mood === "cheer";
  const legs: { pts: Pt[]; w: [number, number]; cls: string; dark?: boolean }[] = [
    { pts: [[74, 150], [46, 170], [26, 196], [32, 216], [50, 214]], w: [26, 6], cls: "oct-sway", dark: true },
    { pts: [[92, 158], [72, 188], [70, 214], [88, 226], [102, 212]], w: [28, 6], cls: "" },
    { pts: [[116, 162], [112, 196], [124, 222], [144, 222], [146, 206]], w: [30, 7], cls: "oct-slow" },
    { pts: [[140, 158], [158, 190], [182, 208], [200, 198], [192, 184]], w: [28, 6], cls: "" },
    wave
      ? { pts: [[160, 142], [194, 128], [214, 98], [208, 66], [192, 60]], w: [26, 6], cls: "oct-wave-fast" }
      : { pts: [[160, 148], [196, 164], [218, 184], [234, 176], [228, 160]], w: [26, 6], cls: "oct-wave" },
  ];
  return (
    <svg viewBox="0 0 250 240" className={className} style={style} aria-hidden>
      <ellipse cx="120" cy="230" rx="82" ry="9" fill="#4b3a8f" opacity=".2" filter="url(#f-blur2)" />
      {legs.map((l, i) => (
        <g key={i} className={l.cls} style={{ transformBox: "fill-box", transformOrigin: "10% 0%" }}>
          <path d={taper(l.pts, l.w[0], l.w[1])} fill={l.dark ? "url(#g-octlegdark)" : "url(#g-octleg)"} />
          <path d={taper(l.pts, l.w[0] * 0.5, l.w[1] * 0.4, -l.w[0] * 0.16)} fill="#fff" opacity=".32" />
          <path d={taper(l.pts, l.w[0] * 0.5, l.w[1] * 0.4, l.w[0] * 0.3)} fill="#6d4aa8" opacity=".22" />
          {spline(l.pts, 3).filter((_, k) => k % 3 === 1 && k > 3).map((p, k, a) => (
            <g key={k}><circle cx={f1(p[0] + 1)} cy={f1(p[1] + 3)} r={f1(Math.max(1.2, (l.w[0] * (1 - k / a.length) * 0.2)))} fill="#ffe2f1" opacity=".85" /><circle cx={f1(p[0] - 0.4)} cy={f1(p[1] + 2.2)} r={f1(Math.max(0.5, l.w[0] * (1 - k / a.length) * 0.07))} fill="#fff" /></g>
          ))}
        </g>
      ))}
      {/* mantle */}
      <path d="M44 112C34 50 74 8 124 8c52 0 88 42 78 104-6 34-38 52-80 52S50 148 44 112z" fill="url(#g-oct)" />
      <path d="M44 112C34 50 74 8 124 8c52 0 88 42 78 104-6 34-38 52-80 52S50 148 44 112z" fill="url(#g-octao)" />
      <path d="M52 100C48 56 80 22 118 20" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" />
      <path d="M196 90c-2 28-22 50-58 56" fill="none" stroke="#ff9ed0" strokeOpacity=".4" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="86" cy="34" rx="26" ry="12" fill="url(#g-gloss)" transform="rotate(-30 86 34)" />
      <ellipse cx="140" cy="24" rx="7" ry="3.4" fill="#fff" opacity=".8" transform="rotate(-28 140 24)" />
      {[[72, 62, 4], [110, 40, 3.4], [150, 52, 5], [168, 78, 3.6], [128, 70, 3], [86, 84, 3.4], [178, 54, 2.6], [64, 90, 2.6]].map(([x, y, r], i) => <g key={i}><circle cx={x} cy={y} r={r + 1.5} fill="#8e69cc" opacity=".14" /><circle cx={x} cy={y} r={r} fill="#fff" opacity=".45" /></g>)}
      {bow && <g transform="translate(116 12) rotate(-6)"><path d="M0 4C-14-10-30-6-28 6c2 10 18 6 28-2z" fill="#f6a9cc" /><path d="M0 4C14-10 30-6 28 6c-2 10-18 6-28-2z" fill="#f6a9cc" /><path d="M-24 0c8-6 16-2 22 4" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2.4" strokeLinecap="round" /><circle cx="0" cy="3" r="6" fill="url(#g-pearl)" /><circle cx="-2" cy="1" r="2" fill="#fff" /></g>}
      {mood === "sleep" ? (
        <g stroke="#3a2a73" strokeWidth="4" fill="none" strokeLinecap="round"><path d="M72 112q12 10 24 0" /><path d="M132 112q12 10 24 0" /><path d="M70 108l-5-4M158 108l5-4" strokeWidth="3" /></g>
      ) : (
        <g className="blink" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <ellipse cx="86" cy="112" rx="19" ry="21" fill="#fff" opacity=".94" /><ellipse cx="146" cy="112" rx="19" ry="21" fill="#fff" opacity=".94" />
          <ellipse cx="88" cy="114" rx="15" ry="17" fill="url(#g-eye)" /><ellipse cx="148" cy="114" rx="15" ry="17" fill="url(#g-eye)" />
          <ellipse cx="88" cy="119" rx="9" ry="7" fill="#7b68d4" opacity=".55" /><ellipse cx="148" cy="119" rx="9" ry="7" fill="#7b68d4" opacity=".55" />
          <circle cx="82" cy="107" r="6" fill="#fff" /><circle cx="142" cy="107" r="6" fill="#fff" /><circle cx="94" cy="121" r="2.8" fill="#fff" opacity=".9" /><circle cx="154" cy="121" r="2.8" fill="#fff" opacity=".9" />
          <path d="M68 100q18-16 38-2M128 100q18-16 38-2" fill="none" stroke="#6b49a8" strokeOpacity=".4" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      <ellipse cx="62" cy="132" rx="14" ry="8.5" fill="url(#g-blush)" /><ellipse cx="170" cy="132" rx="14" ry="8.5" fill="url(#g-blush)" />
      {mood === "cheer" ? <g><path d="M106 134q10 20 22 0z" fill="#8a3f78" /><path d="M112 146q4-4 10 0" stroke="#ff8fbc" strokeWidth="3.4" fill="none" strokeLinecap="round" /></g> : <path d="M106 136q10 9 20 0" stroke="#4a2f86" strokeWidth="3.6" fill="none" strokeLinecap="round" />}
    </svg>
  );
}

/* ---------- TURTLE (side view, swimming) ---------- */
const HEX: Pt[][] = (() => {
  const out: Pt[][] = [], R = 21;
  const hex = (cx: number, cy: number, r: number): Pt[] => Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i + Math.PI / 6; return [f1(cx + r * Math.cos(a)), f1(cy + r * Math.sin(a) * 0.86)] as Pt; });
  [[128, 58], [128, 92]].forEach(([x, y]) => out.push(hex(x, y, R)));
  [[96, 40], [160, 40], [90, 76], [166, 76]].forEach(([x, y]) => out.push(hex(x, y, R - 1)));
  [[58, 58], [198, 58], [58, 92], [198, 92]].forEach(([x, y]) => out.push(hex(x, y, R - 3)));
  return out;
})();
export function Turtle({ className, style }: P) {
  return (
    <svg viewBox="0 0 280 180" className={className} style={style} aria-hidden>
      <ellipse cx="130" cy="172" rx="86" ry="6" fill="#2a4f7a" opacity=".16" filter="url(#f-blur2)" />
      {/* far flippers (darker) */}
      <g className="flip-far" style={{ transformBox: "fill-box", transformOrigin: "0% 0%" }}><path d={taper([[150, 108], [170, 134], [192, 152]], 22, 10)} fill="url(#g-turtleskin2)" /></g>
      <g className="flip-far2" style={{ transformBox: "fill-box", transformOrigin: "100% 0%" }}><path d={taper([[88, 112], [68, 134], [48, 146]], 20, 9)} fill="url(#g-turtleskin2)" /></g>
      <path d={taper([[40, 100], [24, 108], [10, 106]], 14, 3)} fill="url(#g-turtleskin2)" />
      {/* neck + head */}
      <path d={taper([[200, 92], [226, 82], [244, 70]], 34, 30)} fill="url(#g-turtleskin)" />
      <ellipse cx="248" cy="68" rx="29" ry="26" fill="url(#g-turtleskin)" />
      <ellipse cx="244" cy="54" rx="16" ry="7" fill="#fff" opacity=".35" transform="rotate(-18 244 54)" />
      <ellipse cx="256" cy="76" rx="15" ry="10" fill="#d9f0c8" opacity=".6" />
      <circle cx="257" cy="62" r="8" fill="#fff" /><circle cx="259" cy="63" r="6.2" fill="url(#g-eye)" /><circle cx="256.5" cy="60.5" r="2.4" fill="#fff" /><circle cx="261" cy="65" r="1.2" fill="#fff" opacity=".9" />
      <path d="M249 53q8-6 15-2" fill="none" stroke="#5e9a66" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="240" cy="78" rx="8" ry="5" fill="url(#g-blush)" />
      <path d="M262 80q7 6 14 0" stroke="#4b6b66" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      {/* shell */}
      <path d="M26 100C26 44 76 12 134 12s98 32 98 88c0 18-42 30-98 30S26 118 26 100z" fill="url(#g-turtle)" />
      <clipPath id="turtleclip"><path d="M26 100C26 44 76 12 134 12s98 32 98 88c0 18-42 30-98 30S26 118 26 100z" /></clipPath>
      <g clipPath="url(#turtleclip)">
        {HEX.map((h, i) => (
          <g key={i}><polygon points={h.map((p) => p.join(",")).join(" ")} fill="url(#g-scute)" stroke="#b27f4f" strokeOpacity=".55" strokeWidth="3.2" strokeLinejoin="round" />
            <polygon points={h.map((p) => `${f1(p[0] * 0.66 + 128 * 0.34 * 0 + (h[0][0] + h[3][0]) / 2 * 0.34)},${f1(p[1] * 0.66 + (h[0][1] + h[3][1]) / 2 * 0.34)}`).join(" ")} fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2" strokeLinejoin="round" /></g>
        ))}
        <path d="M26 100C26 44 76 12 134 12" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="6" strokeLinecap="round" transform="translate(5 5)" />
        <ellipse cx="134" cy="132" rx="110" ry="26" fill="#a2683a" opacity=".38" filter="url(#f-soft)" />
      </g>
      <path d="M26 104c12 14 52 22 108 22s96-8 98-22c-6 22-48 32-98 32S32 126 26 104z" fill="#fdf0c9" />
      <path d="M26 100C26 44 76 12 134 12s98 32 98 88" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" />
      <ellipse cx="84" cy="30" rx="30" ry="9" fill="url(#g-gloss)" transform="rotate(-18 84 30)" />
      {/* near flippers */}
      <g className="flip-a" style={{ transformBox: "fill-box", transformOrigin: "0% 0%" }}>
        <path d={taper([[168, 114], [194, 138], [222, 152]], 30, 12)} fill="url(#g-turtleskin)" /><path d={taper([[168, 114], [194, 138], [222, 152]], 12, 5, -7)} fill="#fff" opacity=".4" />
      </g>
      <g className="flip-b" style={{ transformBox: "fill-box", transformOrigin: "100% 0%" }}>
        <path d={taper([[84, 118], [62, 140], [38, 150]], 28, 11)} fill="url(#g-turtleskin)" /><path d={taper([[84, 118], [62, 140], [38, 150]], 11, 5, -6)} fill="#fff" opacity=".4" />
      </g>
    </svg>
  );
}

/* ---------- SEAHORSE ---------- */
export function Seahorse({ className, style }: P) {
  const spine: Pt[] = [[70, 40], [58, 70], [66, 108], [70, 142], [56, 176], [58, 206], [78, 214], [88, 200], [78, 190]];
  const ridges = spline(spine, 2).filter((_, i) => i % 3 === 1 && i > 3 && i < 26);
  return (
    <svg viewBox="0 0 130 230" className={className} style={style} aria-hidden>
      <ellipse cx="68" cy="224" rx="36" ry="4" fill="#4b3a8f" opacity=".16" />
      <path d={taper([[86, 70], [100, 84], [104, 106], [96, 124]], 8, 22)} fill="#f6c5db" opacity=".9" className="tailw" style={{ transformBox: "fill-box", transformOrigin: "0% 50%" }} />
      <path d={taper(spine, 40, 8)} fill="url(#g-horse)" />
      <path d={taper(spine, 14, 3, -10)} fill="#fff" opacity=".38" />
      <path d={taper(spine, 30, 5, 12)} fill="#6a5bc0" opacity=".16" />
      {ridges.map(([x, y], i) => <path key={i} d={`M${f1(x - 15)} ${f1(y + 2)}q15 7 ${30 - i}  0`} stroke="#fff" strokeOpacity=".55" strokeWidth="3" fill="none" strokeLinecap="round" />)}
      <path d={taper([[52, 40], [36, 40], [14, 50]], 18, 12)} fill="url(#g-horse)" />
      <ellipse cx="12" cy="50" rx="7" ry="6" fill="#d9c8f7" />
      <path d="M62 14l5-12 7 11 9-8-3 16z" fill="#f6a9cc" />
      <circle cx="56" cy="38" r="7" fill="#fff" /><circle cx="56.6" cy="38.6" r="5.4" fill="url(#g-eye)" /><circle cx="54.4" cy="36.2" r="2" fill="#fff" />
      <ellipse cx="46" cy="52" rx="7" ry="4.6" fill="url(#g-blush)" />
      <path d="M30 56q5 4 10 0" stroke="#4a2f86" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- JELLYFISH ---------- */
export function Jellyfish({ className, style, glow = true }: P & { glow?: boolean }) {
  const tents: Pt[][] = [[22, 40, 58, 74, 92, 114].map((x, i) => [[x, 98], [x - 6 + (i % 2) * 12, 140], [x + 4 - (i % 3) * 5, 180], [x - 3, 226]] as Pt[])].flat();
  return (
    <svg viewBox="0 0 140 240" className={className} style={style} aria-hidden>
      {glow && <ellipse cx="70" cy="62" rx="56" ry="46" fill="#ffb4e0" opacity=".5" filter="url(#f-glow)" />}
      {tents.map((t, i) => <path key={i} className="tent" style={{ animationDelay: `${-i * 0.45}s`, transformBox: "fill-box", transformOrigin: "50% 0%" }} d={taper(t, i % 2 ? 6 : 8, 1)} fill="url(#g-tent)" />)}
      {[34, 62, 86, 106].map((x, i) => <path key={i} className="tent" style={{ animationDelay: `${-i * 0.6}s`, transformBox: "fill-box", transformOrigin: "50% 0%" }} d={`M${x} 96q-10 16 0 30t0 28q-6 8 2 14`} fill="none" stroke="#ffc0e4" strokeOpacity=".6" strokeWidth="7" strokeLinecap="round" />)}
      <path d="M8 96C6 42 34 6 70 6s64 36 62 90c-12-8-24 6-38 4-10-2-14-8-24-8s-14 6-24 8c-14 2-26-12-38-4z" fill="url(#g-bell)" />
      <path d="M8 96C6 42 34 6 70 6s64 36 62 90" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="2.2" />
      <g stroke="#fff" strokeOpacity=".32" strokeWidth="2" fill="none">{[-48, -30, -14, 0, 14, 30, 48].map((dx, i) => <path key={i} d={`M70 98C${70 + dx * 0.6} 70 ${70 + dx} 40 ${70 + dx * 1.15} 14`} />)}</g>
      <g fill="#ffa8d8" opacity=".6">{[[54, 58], [86, 58], [70, 48], [70, 70]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="9" ry="14" />)}</g>
      <path d="M20 84C20 46 40 16 70 14" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="48" cy="30" rx="20" ry="9" fill="url(#g-gloss)" transform="rotate(-26 48 30)" />
      <circle cx="54" cy="74" r="4.6" fill="#4a2f86" /><circle cx="52.6" cy="72.4" r="1.6" fill="#fff" /><circle cx="86" cy="74" r="4.6" fill="#4a2f86" /><circle cx="84.6" cy="72.4" r="1.6" fill="#fff" />
      <ellipse cx="44" cy="82" rx="7" ry="4.4" fill="url(#g-blush)" /><ellipse cx="96" cy="82" rx="7" ry="4.4" fill="url(#g-blush)" />
      <path d="M64 82q6 5 12 0" stroke="#4a2f86" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Fish({ className, style, a = "#ffb48f", b = "#fff" }: P & { a?: string; b?: string }) {
  return (
    <svg viewBox="0 0 130 80" className={className} style={style} aria-hidden>
      <path d="M92 40l34-26c4 14 4 38 0 52z" fill={a} opacity=".85" className="tailw" style={{ transformBox: "fill-box", transformOrigin: "0% 50%" }} />
      <path d={taper([[52, 14], [66, 2], [80, 12]], 10, 4)} fill={a} opacity=".8" />
      <ellipse cx="54" cy="40" rx="46" ry="30" fill={a} />
      <ellipse cx="54" cy="52" rx="42" ry="20" fill="#fff" opacity=".22" />
      <path d="M42 12q-6 28 0 56M64 11q-5 29 0 58" stroke={b} strokeWidth="9" fill="none" opacity=".92" />
      <ellipse cx="38" cy="22" rx="18" ry="6" fill="#fff" opacity=".4" transform="rotate(-8 38 22)" />
      <circle cx="24" cy="34" r="7" fill="#fff" /><circle cx="25" cy="35" r="5.4" fill="url(#g-eye)" /><circle cx="23" cy="32.6" r="1.8" fill="#fff" />
      <path d={taper([[56, 52], [64, 62], [72, 62]], 12, 5)} fill={a} />
    </svg>
  );
}

/* ---------- CORAL (organic, recursive, tapered) ---------- */
function branch(r: () => number, x: number, y: number, ang: number, len: number, w: number, depth: number, out: { d: string; tip: Pt; w: number; hi: string }[]) {
  const bend = (r() - 0.5) * 0.7;
  const mid: Pt = [x + Math.cos(ang + bend * 0.5) * len * 0.5, y + Math.sin(ang + bend * 0.5) * len * 0.5];
  const end: Pt = [x + Math.cos(ang + bend) * len, y + Math.sin(ang + bend) * len];
  out.push({ d: taper([[x, y], mid, end], w, w * 0.62), tip: end, w: w * 0.62, hi: taper([[x, y], mid, end], w * 0.34, w * 0.2, -w * 0.2) });
  if (depth > 0) {
    const kids = depth > 2 ? 2 : 2 + (r() > 0.55 ? 1 : 0);
    for (let k = 0; k < kids; k++) branch(r, end[0], end[1], ang + (k - (kids - 1) / 2) * (0.62 + r() * 0.3), len * (0.66 + r() * 0.1), w * 0.66, depth - 1, out);
  }
}
export function Coral({ className, style, c = "#f2a6c8", c2 = "#e07fae", seed = 3 }: P & { c?: string; c2?: string; seed?: number }) {
  const r = rng(seed * 31 + 7), out: { d: string; tip: Pt; w: number; hi: string }[] = [];
  const trunks = 3;
  for (let t = 0; t < trunks; t++) branch(r, 100 + (t - 1) * 26, 252, -Math.PI / 2 + (t - 1) * 0.34 + (r() - 0.5) * 0.2, 62 + r() * 18, 22 - t * 2, 3, out);
  return (
    <svg viewBox="0 0 220 260" className={className} style={style} aria-hidden>
      <defs><linearGradient id={`cg-${seed}-${c}`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={c2} /><stop offset=".6" stopColor={c} /><stop offset="1" stopColor="#fff" stopOpacity=".3" /></linearGradient></defs>
      <ellipse cx="108" cy="254" rx="76" ry="7" fill="#3a2a73" opacity=".2" filter="url(#f-blur2)" />
      {out.map((b, i) => <path key={i} d={b.d} fill={`url(#cg-${seed}-${c})`} />)}
      {out.map((b, i) => <path key={`h${i}`} d={b.hi} fill="#fff" opacity=".32" />)}
      {out.filter((b) => b.w < 11).map((b, i) => <g key={`p${i}`}><circle cx={f1(b.tip[0])} cy={f1(b.tip[1])} r={f1(b.w * 0.62)} fill="#fff" opacity=".9" /><circle cx={f1(b.tip[0])} cy={f1(b.tip[1])} r={f1(b.w * 0.62 + 3)} fill="#fff" opacity=".28" /></g>)}
      <ellipse cx="100" cy="250" rx="52" ry="10" fill={c2} /><ellipse cx="96" cy="247" rx="40" ry="5" fill="#fff" opacity=".3" />
    </svg>
  );
}
export function SeaFan({ className, style, c = "#f6a9cc" }: P & { c?: string }) {
  return (
    <svg viewBox="0 0 200 240" className={className} style={style} aria-hidden>
      <path d={taper([[100, 236], [100, 190]], 12, 8)} fill={c} />
      <g fill="none" stroke={c} strokeLinecap="round" strokeOpacity=".9">
        {Array.from({ length: 15 }, (_, i) => { const a = -Math.PI + 0.35 + (i / 14) * (Math.PI - 0.7), x = 100 + Math.cos(a) * 92, y = 192 + Math.sin(a) * 160; return <path key={i} d={`M100 192Q${f1(100 + Math.cos(a) * 52 + Math.sin(i) * 9)} ${f1(192 + Math.sin(a) * 86)} ${f1(x)} ${f1(y)}`} strokeWidth={3.2} />; })}
        {[0.34, 0.52, 0.7, 0.88].map((k, j) => <path key={j} d={`M${f1(100 - 86 * k)} ${f1(192 - 150 * k * 0.55)}Q100 ${f1(192 - 176 * k)} ${f1(100 + 86 * k)} ${f1(192 - 150 * k * 0.55)}`} strokeWidth="1.8" strokeOpacity=".7" />)}
      </g>
      <path d="M100 192C46 190 12 120 24 70c40-14 156-14 152 0 12 50-22 120-76 122z" fill={c} opacity=".16" />
      <path d="M100 192C70 150 56 100 60 62" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
export function TubeCoral({ className, style, c = "#cbb7ef", c2 = "#a98ad8" }: P & { c?: string; c2?: string }) {
  const tubes = [[40, 70, 62], [78, 40, 100], [116, 80, 74], [150, 54, 94], [182, 96, 54]];
  return (
    <svg viewBox="0 0 220 200" className={className} style={style} aria-hidden>
      <ellipse cx="112" cy="194" rx="92" ry="8" fill="#3a2a73" opacity=".2" filter="url(#f-blur2)" />
      <defs><linearGradient id={`tb-${c}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={c2} /><stop offset=".4" stopColor={c} /><stop offset=".7" stopColor="#fff" stopOpacity=".95" /><stop offset="1" stopColor={c2} /></linearGradient></defs>
      {tubes.map(([x, top, w], i) => <g key={i}><path d={`M${x - w / 4} 192V${top + 8}a${w / 4} ${w / 6} 0 0 1 ${w / 2} 0V192z`} fill={`url(#tb-${c})`} /><ellipse cx={x} cy={top + 8} rx={w / 4} ry={w / 6} fill={c2} /><ellipse cx={x} cy={top + 10} rx={w / 6} ry={w / 11} fill="#3b2a6e" opacity=".55" /><ellipse cx={x - w / 10} cy={top + 5} rx={w / 14} ry="2.6" fill="#fff" opacity=".6" /></g>)}
    </svg>
  );
}

export function Seaweed({ className, style, c = "#9ed8b8" }: P & { c?: string }) {
  const blade = (x: number, h: number, w: number, k: number) => taper([[x, 220], [x + 12 * k, 220 - h * 0.35], [x - 10 * k, 220 - h * 0.65], [x + 8 * k, 220 - h]], w, 3);
  return (
    <svg viewBox="0 0 90 230" className={className} style={style} aria-hidden>
      <g className="sway" style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        <path d={blade(34, 214, 16, 1)} fill={c} /><path d={blade(34, 214, 6, 1)} fill="#fff" opacity=".35" transform="translate(-3 0)" />
        <path d={blade(56, 160, 13, -1)} fill={c} opacity=".85" /><path d={blade(18, 130, 11, -1)} fill={c} opacity=".75" />
      </g>
    </svg>
  );
}

export function Starfish({ className, style }: P) {
  const arms = Array.from({ length: 5 }, (_, i) => { const a = (Math.PI * 2 * i) / 5 - Math.PI / 2; return [[60, 60], [60 + Math.cos(a) * 26, 60 + Math.sin(a) * 26], [60 + Math.cos(a) * 54, 60 + Math.sin(a) * 54]] as Pt[]; });
  return (
    <svg viewBox="0 0 120 120" className={className} style={style} aria-hidden>
      <ellipse cx="62" cy="108" rx="46" ry="6" fill="#4b3a8f" opacity=".16" />
      {arms.map((a, i) => <path key={i} d={taper(a, 30, 8)} fill="url(#g-star)" />)}
      <circle cx="60" cy="60" r="20" fill="url(#g-star)" />
      {arms.map((a, i) => <path key={`h${i}`} d={taper(a, 10, 3, -5)} fill="#fff" opacity=".4" />)}
      {arms.map((a, i) => spline(a, 3).filter((_, k) => k % 2 === 0 && k > 1).map(([x, y], k) => <circle key={`${i}-${k}`} cx={f1(x)} cy={f1(y)} r={f1(Math.max(1, 3 - k * 0.3))} fill="#fff" opacity=".7" />))}
    </svg>
  );
}

/* ---------- SCALLOP SHELL (mother-of-pearl) ---------- */
export function Shell({ className, style, tone = "pearl", glow = false, pearl = false, fill }: P & { tone?: "pearl" | "blue" | "pink"; glow?: boolean; pearl?: boolean; fill?: string }) {
  const n = 11, cx = 120, cy = 196, R = 158;
  const a0 = Math.PI + 0.16, a1 = 2 * Math.PI - 0.16, step = (a1 - a0) / n;
  const g1 = tone === "blue" ? "g-shellblue" : tone === "pink" ? "g-shellpink" : "g-shellrib";
  const g2 = tone === "blue" ? "g-shellblue2" : tone === "pink" ? "g-shellpink2" : "g-shellrib2";
  const pt = (a: number, r: number) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as Pt;
  return (
    <svg viewBox="-6 22 252 196" className={className} style={style} aria-hidden>
      {glow && <ellipse cx="120" cy="120" rx="110" ry="80" fill={tone === "blue" ? "#bfe5f3" : "#ffe3f1"} opacity=".8" filter="url(#f-glow)" className="glow-pulse" />}
      <ellipse cx="124" cy="212" rx="96" ry="7" fill="#3a2a73" opacity=".22" filter="url(#f-blur2)" />
      {Array.from({ length: n }, (_, i) => {
        const s = a0 + i * step, e = s + step, m = (s + e) / 2;
        const [x1, y1] = pt(s, R), [x2, y2] = pt(e, R), [qx, qy] = pt(m, R + 17);
        return <path key={i} d={`M${cx} ${cy}L${f1(x1)} ${f1(y1)}Q${f1(qx)} ${f1(qy)} ${f1(x2)} ${f1(y2)}Z`} fill={fill ? fill : `url(#${i % 2 ? g2 : g1})`} stroke="#c9a3d6" strokeOpacity=".55" strokeWidth="1.6" strokeLinejoin="round" />;
      })}
      {Array.from({ length: n }, (_, i) => { const m = a0 + (i + 0.5) * step, [x, y] = pt(m, R * 0.86), [x0, y0] = pt(m, 40); return <path key={`l${i}`} d={`M${f1(x0)} ${f1(y0)}L${f1(x)} ${f1(y)}`} stroke="#fff" strokeOpacity=".6" strokeWidth="2.6" strokeLinecap="round" />; })}
      {[62, 96, 128].map((rr, j) => <path key={j} d={`M${f1(pt(a0 + 0.05, rr)[0])} ${f1(pt(a0 + 0.05, rr)[1])}A${rr} ${rr} 0 0 1 ${f1(pt(a1 - 0.05, rr)[0])} ${f1(pt(a1 - 0.05, rr)[1])}`} fill="none" stroke="#b78bd0" strokeOpacity=".2" strokeWidth="2" />)}
      <path d={`M${f1(pt(a0, R)[0])} ${f1(pt(a0, R)[1])}${Array.from({ length: n }, (_, i) => { const s = a0 + i * step, e = s + step, [qx, qy] = pt((s + e) / 2, R + 17), [x2, y2] = pt(e, R); return `Q${f1(qx)} ${f1(qy)} ${f1(x2)} ${f1(y2)}`; }).join("")}`} fill="none" stroke="#fff" strokeOpacity=".95" strokeWidth="3.4" strokeLinejoin="round" />
      <path d="M78 198c4-20 16-30 42-30s38 10 42 30l8 16H70z" fill="url(#g-hinge)" stroke="#c9a3d6" strokeOpacity=".6" strokeWidth="1.6" />
      <path d="M88 200c4-12 14-18 32-18" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="2.6" strokeLinecap="round" />
      <ellipse cx="82" cy="104" rx="30" ry="11" fill="#fff" opacity=".5" transform="rotate(-38 82 104)" />
      {pearl && <g><circle cx="120" cy="190" r="14" fill="url(#g-pearl)" /><ellipse cx="115" cy="184" rx="5" ry="3" fill="#fff" opacity=".9" transform="rotate(-30 115 184)" /></g>}
    </svg>
  );
}

/* Seabed trio used for scene corners */
export function Rock({ className, style, c = "#c5b3e2" }: P & { c?: string }) {
  return (
    <svg viewBox="0 0 220 120" className={className} style={style} aria-hidden>
      <ellipse cx="110" cy="112" rx="104" ry="8" fill="#3a2a73" opacity=".22" filter="url(#f-blur2)" />
      <path d="M8 108C10 60 44 24 96 30c36-14 82 8 100 44 10 18 18 34 14 38z" fill={c} />
      <path d="M8 108C10 60 44 24 96 30" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="5" strokeLinecap="round" />
      <path d="M120 112c24-10 60-14 90 0z" fill="#3a2a73" opacity=".18" />
      <ellipse cx="80" cy="44" rx="28" ry="8" fill="#fff" opacity=".3" transform="rotate(-14 80 44)" />
    </svg>
  );
}

/* 2D balloon fallback (only used when WebGL is unavailable) */
const BALLOONS = ["#BFE5F3", "#F6C5DB", "#CBB7EF", "#E4F7EE", "#FFF1DB", "#9fd9c8", "#a9cdf0"];
export function BalloonArch({ className, style, seed = 1, rows = 3 }: P & { seed?: number; rows?: number; mint?: boolean }) {
  const r = rng(seed); const out: React.ReactElement[] = [];
  for (let row = 0; row < rows; row++) {
    const rad = 430 - row * 34; const count = 28 - row * 3;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1); const a = Math.PI * (1 - t);
      const x = +(500 + rad * Math.cos(a) + (r() - 0.5) * 10).toFixed(1), y = +(520 - rad * Math.sin(a) * 1.05 + (r() - 0.5) * 10).toFixed(1);
      const s = +(26 + r() * 12).toFixed(1);
      out.push(<g key={`${row}-${i}`}><circle cx={x} cy={y} r={s} fill={BALLOONS[Math.floor(r() * BALLOONS.length)]} /><circle cx={x} cy={y} r={s} fill="url(#g-balloon)" /></g>);
    }
  }
  return <svg viewBox="0 0 1000 800" className={className} style={style} aria-hidden>{out}</svg>;
}
