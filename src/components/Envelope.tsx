"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { invitation } from "@/config/invitation";
import { Bubble, Coral, Pearl, Rock, SeaFan, Seaweed, Shell, Sparkle, Starfish, TubeCoral } from "./Art";
import { Caustics, Motes, ReefLayer, Shafts } from "./Scenery";
import { chime, startAmbient } from "@/lib/sound";
import Envelope3D, { newEnvState } from "./Envelope3D";

/** Scene 01 - the luxury envelope on a lit seabed. Timeline: nudge -> seal releases -> 3D flap opens ->
 *  card rises -> bubbles -> camera pushes in -> bubble transition dissolves into the ocean. */
export default function Envelope({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const st = useRef(newEnvState());
  const has3d = useRef(true);
  const ok3d = useRef((ok: boolean) => { has3d.current = ok; }).current;

  useEffect(() => { if (process.env.NODE_ENV !== "production") Object.assign(window, { __env: st.current }); }, []);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".env-wrap", { y: -7, rotate: -0.6, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.to(".env-shadow", { scaleX: 0.94, opacity: 0.5, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.to(".sea-bub", { y: -34, duration: 4.4, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 0.5 });
      gsap.to(".env-seal", { scale: 1.06, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
    }, root);
    return () => ctx.revert();
  }, []);

  function finish() { gsap.to(root.current, { opacity: 0, duration: 0.9, ease: "power1.inOut", onComplete: onDone }); }

  function open() {
    if (busy) return;
    setBusy(true); startAmbient(); chime();
    const r = root.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { finish(); return; }
    gsap.killTweensOf([".env-wrap", ".env-shadow", ".env-seal"]);
    const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    tl.to(".intro-copy", { opacity: 0, y: -24, duration: 0.5 }, 0)
      .to(".env-wrap", { scale: 1.06, y: 8, rotate: 0, duration: 0.8 }, 0)
      .to(".env-seal", { scale: 1.22, rotate: -10, duration: 0.3, ease: "back.out(3)" }, 0.5)
      .to(".env-seal", { y: 90, x: 20, opacity: 0, rotate: 36, duration: 0.7, ease: "power2.in" }, 0.85)
      .to(".env-flap", { rotateX: -180, duration: 1.05 }, 0.95)
      .set(".env-flap", { zIndex: 0 }, 1.45)
      .to(".env-card", { yPercent: -64, duration: 1.1, ease: "power3.out" }, 1.65)
      .to(".env-card", { boxShadow: "0 0 90px 28px rgba(255,255,255,.95)", duration: 0.8 }, 1.7)
      .add(() => { chime([1046.5, 1318.5, 1568]); burst(r); }, 1.8)
      .add(() => { if (!has3d.current) gsap.to(".stage", { scale: 3.1, yPercent: 16, duration: 1.5, ease: "power3.in" }); }, 2.45)
      .to(st.current, { seal: 1, duration: 1.1, ease: "none" }, 0.6)
      .to(st.current, { flap: 1, duration: 1.4, ease: "none" }, 1.05)
      .to(st.current, { glow: 1, duration: 0.9, ease: "power1.out" }, 1.7)
      .to(st.current, { card: 1, duration: 1.3, ease: "none" }, 1.9)
      .to(st.current, { zoom: 1, duration: 1.5, ease: "none" }, 2.7)
      .to(".intro-bg", { opacity: 0.25, duration: 1 }, 2.5);
    const fills = r.querySelectorAll<HTMLElement>(".fillbubble");
    tl.fromTo(fills, { scale: 0, opacity: 0 }, { scale: () => 4 + Math.random() * 6, opacity: 1, duration: 1.1, stagger: 0.04, ease: "power2.out" }, 2.9)
      .to(r, { backgroundColor: "rgba(95,205,232,1)", duration: 0.6 }, 3.6)
      .add(finish, 4.2);
  }

  function burst(r: HTMLElement) {
    const holder = r.querySelector(".burst")!;
    for (let i = 0; i < 30; i++) {
      const el = document.createElement("div"), s = 14 + Math.random() * 40;
      el.style.cssText = `position:absolute;left:50%;top:48%;width:${s}px;height:${s}px;border-radius:50%;background:radial-gradient(circle at 32% 28%,#fff 0,rgba(255,255,255,.1) 38%,rgba(191,229,243,.3) 70%,rgba(246,197,219,.75));border:1px solid rgba(255,255,255,.75);box-shadow:inset -3px -4px 8px rgba(160,200,255,.35);will-change:transform`;
      holder.appendChild(el);
      gsap.to(el, { x: (Math.random() - 0.5) * window.innerWidth * 0.7, y: -(180 + Math.random() * window.innerHeight * 0.55), scale: 0.6 + Math.random() * 0.8, opacity: 0, duration: 1.8 + Math.random() * 1.3, ease: "power1.out", delay: Math.random() * 0.4, onComplete: () => el.remove() });
    }
  }

  const fillSpots = [[8, 20], [30, 80], [55, 14], [78, 70], [92, 30], [15, 55], [48, 48], [70, 38], [38, 28], [85, 90], [5, 85], [60, 85]];
  const pearlsL = [0.12, 0.24, 0.36, 0.48].map((k) => [k * 300, k * 215 * 1.0] as const);

  return (
    <div ref={root} className="intro" role="dialog" aria-label="Aurora's invitation">
      <div className="intro-bg">
        <div className="sea" />
        <Shafts color="255,255,255" seed={3} count={5} className="intro-shafts" />
        <ReefLayer seed={11} top="#9fe0ee" bottom="#8fd0e6" height={240} className="intro-reef r1" />
        <ReefLayer seed={14} top="#b8cdf2" bottom="#a8c0ec" height={220} className="intro-reef r2" />
        <div className="sand" />
        <Caustics opacity={0.4} size={300} className="intro-caustics" />
        <Motes count={18} seed={2} />
        {[[8, 18, 36], [22, 8, 22], [74, 14, 30], [90, 24, 20], [60, 6, 16], [40, 20, 14]].map(([l, t, s], i) => (
          <Bubble key={i} className="sea-bub" style={{ position: "absolute", left: `${l}%`, top: `${t}%`, width: s, opacity: 0.7 }} />
        ))}
        {/* seabed dressing: foreground depth */}
        <Rock className="abs" c="#cfc0ea" style={{ left: "-6%", bottom: "-1%", width: "34vmin", zIndex: 2 }} />
        <SeaFan className="abs" c="#f6a9cc" style={{ left: "1%", bottom: "9%", width: "20vmin", opacity: 0.95 }} />
        <Coral className="abs" c="#f2a6c8" c2="#e07fae" seed={2} style={{ left: "-3%", bottom: "4%", width: "34vmin", zIndex: 3 }} />
        <TubeCoral className="abs" c="#cbb7ef" c2="#a98ad8" style={{ right: "-5%", bottom: "5%", width: "42vmin", zIndex: 3 }} />
        <Coral className="abs" c="#bfe5f3" c2="#8fc4e6" seed={5} style={{ right: "17%", bottom: "-3%", width: "22vmin", zIndex: 3 }} />
        <Seaweed className="abs" style={{ left: "13%", bottom: "2%", width: "9vmin", zIndex: 3 }} />
        <Seaweed className="abs" c="#b7e6cc" style={{ right: "6%", bottom: "2%", width: "8vmin", zIndex: 4 }} />
        <Shell className="abs" tone="pink" glow style={{ left: "9%", bottom: "2.5%", width: "17vmin", zIndex: 4 }} />
        <Starfish className="abs" style={{ right: "26%", bottom: "3%", width: "12vmin", transform: "rotate(14deg)", zIndex: 4 }} />
        <Pearl className="abs" style={{ left: "31%", bottom: "5%", width: "4.4vmin", zIndex: 4 }} />
        <Pearl className="abs" style={{ right: "36%", bottom: "7%", width: "3.2vmin", zIndex: 4 }} />
        <Pearl className="abs" style={{ left: "27%", bottom: "2%", width: "3vmin", zIndex: 4 }} />
        <Pearl className="abs" style={{ right: "12%", bottom: "11%", width: "3.6vmin", zIndex: 4 }} />
      </div>

      <div className="stage">
        <Envelope3D state={st} onReady={ok3d} fallback={<div className="env-wrap">
          <div className="env-shadow" />
          {/* BACK + inner liner */}
          <svg className="env-layer env-back" viewBox="0 0 600 400" aria-hidden>
            <defs>
              <linearGradient id="e-body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#bfe0fa" /><stop offset=".5" stopColor="#9ccaf2" /><stop offset="1" stopColor="#86b8ea" /></linearGradient>
              <linearGradient id="e-liner" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f9d3e6" /><stop offset="1" stopColor="#e3cdf6" /></linearGradient>
              <pattern id="e-linerpat" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(8)"><circle cx="13" cy="13" r="3.2" fill="#fff" opacity=".75" /><path d="M0 0l13 13M26 0L13 13" stroke="#fff" strokeOpacity=".25" strokeWidth="1" /></pattern>
            </defs>
            <rect width="600" height="400" rx="14" fill="url(#e-body)" />
            <rect width="600" height="400" rx="14" fill="url(#e-liner)" opacity=".0" />
            <rect x="0" y="0" width="600" height="400" rx="14" fill="#fff" opacity=".1" />
            <path d="M14 0h572a14 14 0 0 1 14 14v8L300 244 0 22v-8A14 14 0 0 1 14 0z" fill="url(#e-liner)" />
            <path d="M14 0h572a14 14 0 0 1 14 14v8L300 244 0 22v-8A14 14 0 0 1 14 0z" fill="url(#e-linerpat)" />
            <path d="M0 22L300 244 600 22" fill="none" stroke="#a889c9" strokeOpacity=".3" strokeWidth="6" />
          </svg>

          {/* INVITATION CARD */}
          <div className="env-card">
            <div className="card-frame">
              <i className="cp c1" /><i className="cp c2" /><i className="cp c3" /><i className="cp c4" />
              <Shell tone="pink" pearl style={{ width: "13%", display: "block", margin: "0 auto" }} />
              <div className="script card-title">You&apos;re Invited</div>
              <div className="card-sub">{invitation.copy.revealKicker}</div>
              <div className="script card-name">{invitation.child.firstName}</div>
              <div className="card-rule"><Sparkle style={{ width: 11 }} /></div>
            </div>
          </div>

          {/* FRONT PANELS: embossed paper */}
          <svg className="env-layer env-front" viewBox="0 0 600 400" aria-hidden>
            <defs>
              <linearGradient id="e-l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d3e8fb" /><stop offset="1" stopColor="#9fcbf3" /></linearGradient>
              <linearGradient id="e-r" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d3e8fb" /><stop offset="1" stopColor="#9fcbf3" /></linearGradient>
              <linearGradient id="e-b" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#86b8ea" /><stop offset=".6" stopColor="#b4d6f6" /><stop offset="1" stopColor="#d2e7fb" /></linearGradient>
              <pattern id="e-scales" width="30" height="18" patternUnits="userSpaceOnUse"><path d="M0 18a15 15 0 0 1 30 0M-15 9a15 15 0 0 1 30 0M15 9a15 15 0 0 1 30 0" fill="none" stroke="#fff" strokeWidth="1.6" /></pattern>
              <clipPath id="e-clipL"><path d="M0 0L312 218 0 400z" /></clipPath><clipPath id="e-clipR"><path d="M600 0L288 218 600 400z" /></clipPath><clipPath id="e-clipB"><path d="M0 400L300 196 600 400z" /></clipPath>
            </defs>
            <path d="M0 0L312 218 0 400z" fill="url(#e-l)" /><path d="M600 0L288 218 600 400z" fill="url(#e-r)" /><path d="M0 400L300 196 600 400z" fill="url(#e-b)" />
            <g clipPath="url(#e-clipB)"><rect width="600" height="400" fill="url(#e-scales)" filter="url(#f-emboss)" opacity=".9" /></g>
            <g clipPath="url(#e-clipL)" opacity=".85"><rect width="600" height="400" fill="url(#e-scales)" filter="url(#f-emboss)" opacity=".55" /></g>
            <g clipPath="url(#e-clipR)" opacity=".85"><rect width="600" height="400" fill="url(#e-scales)" filter="url(#f-emboss)" opacity=".55" /></g>
            {/* embossed coral sprigs in the lower corners */}
            <g filter="url(#f-emboss)" fill="none" stroke="#e4f1fc" strokeWidth="5" strokeLinecap="round">
              <path d="M44 372c0-30 4-52-6-78M44 336c-14-8-22-22-22-40M44 316c10-6 18-16 20-30" /><path d="M556 372c0-30-4-52 6-78M556 336c14-8 22-22 22-40M556 316c-10-6-18-16-20-30" />
            </g>
            <path d="M0 400L300 196 600 400" fill="none" stroke="#fff" strokeOpacity=".9" strokeWidth="2.4" />
            <path d="M0 0L312 218M600 0L288 218" fill="none" stroke="#6d98cc" strokeOpacity=".3" strokeWidth="3" />
            <path d="M0 400L312 218M600 400L288 218" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.6" />
            {pearlsL.map(([x, y], i) => [x, 600 - x].map((xx, k) => <g key={`${i}${k}`} transform={`translate(${xx} ${400 - y * 0.0 - (i * 8 + 0)}) `} />))}
            {Array.from({ length: 9 }, (_, i) => { const t = (i + 1) / 10, x = 300 * t, y = 196 + 204 * t; return <g key={i}><circle cx={f(x)} cy={f(y)} r="7.5" fill="url(#g-pearl)" /><circle cx={f(600 - x)} cy={f(y)} r="7.5" fill="url(#g-pearl)" /></g>; })}
            <rect width="600" height="400" rx="14" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" />
            <rect width="600" height="400" rx="14" filter="url(#f-grain)" opacity=".5" fill="#fff" />
          </svg>

          {/* FLAP (two faces for the 3D turn) */}
          <div className="env-flap">
            <svg className="face" viewBox="0 0 600 244" aria-hidden>
              <defs>
                <linearGradient id="e-flap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d5e9fc" /><stop offset=".7" stopColor="#a8d0f5" /><stop offset="1" stopColor="#92c0ee" /></linearGradient>
                <clipPath id="e-flapclip"><path d="M14 0h572a14 14 0 0 1 14 14v8L300 244 0 22v-8A14 14 0 0 1 14 0z" /></clipPath>
              </defs>
              <path d="M14 0h572a14 14 0 0 1 14 14v8L300 244 0 22v-8A14 14 0 0 1 14 0z" fill="url(#e-flap)" />
              <g clipPath="url(#e-flapclip)"><rect width="600" height="244" fill="url(#e-scales)" filter="url(#f-emboss)" opacity=".6" /></g>
              <path d="M0 22L300 244 600 22" fill="none" stroke="#fff" strokeWidth="2.6" strokeOpacity=".95" />
              <path d="M24 10L300 218 576 10" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="1.6" strokeDasharray="2 7" strokeLinecap="round" />
              <path d="M0 22L300 244 600 22" fill="none" stroke="#6d98cc" strokeOpacity=".35" strokeWidth="6" transform="translate(0 3)" />
            </svg>
            <svg className="face back" viewBox="0 0 600 244" aria-hidden>
              <path d="M14 0h572a14 14 0 0 1 14 14v8L300 244 0 22v-8A14 14 0 0 1 14 0z" fill="url(#e-liner)" /><path d="M14 0h572a14 14 0 0 1 14 14v8L300 244 0 22v-8A14 14 0 0 1 14 0z" fill="url(#e-linerpat)" />
            </svg>
          </div>
          <div className="env-seal"><Shell tone="pink" pearl glow style={{ width: "100%" }} /></div>
        </div>} />
      </div>

      <div className="burst" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 7 }} />
      {fillSpots.map(([l, t], i) => (
        <Bubble key={i} className="fillbubble" style={{ left: `${l}%`, top: `${t}%`, width: 90, marginLeft: -45, marginTop: -45, opacity: 0, zIndex: 9, pointerEvents: "none" }} />
      ))}

      <div className="intro-copy">
        <p>{invitation.copy.envelopeLine}</p>
        <button className="cta" onClick={open} disabled={busy}>{invitation.copy.envelopeCta}</button>
      </div>
      <button className="skip" onClick={() => { startAmbient(); onDone(); }}>Skip intro</button>
    </div>
  );
}
const f = (n: number) => +n.toFixed(1);
