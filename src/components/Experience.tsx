"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { invitation as cfg } from "@/config/invitation";
import { ArtDefs, BalloonArch, Bubble, Coral, Fish, Jellyfish, Octopus, Pearl, Rock, SeaFan, Seahorse, Seaweed, Shell, Sparkle, Starfish, TubeCoral, Turtle, rng } from "./Art";
import { Caustics, Motes, ReefLayer, Shafts, useCausticTexture } from "./Scenery";
import { DressArt, Swatch } from "./Dress";
import Envelope from "./Envelope";
import Rsvp from "./Rsvp";
import Lazy3D from "./Lazy3D";
import Guestbook from "./Guestbook";
import { chime, setMuted, startAmbient } from "@/lib/sound";

const StageProps3D = dynamic(() => import("./StageProps3D"), { ssr: false });
const Meet3D = dynamic(() => import("./Meet3D"), { ssr: false });
const Thanks3D = dynamic(() => import("./Thanks3D"), { ssr: false });
const InviteShell3D = dynamic(() => import("./InviteShell3D"), { ssr: false });
const DressAccents3D = dynamic(() => import("./DressAccents3D"), { ssr: false });
const Dive3D = dynamic(() => import("./Dive3D"), { ssr: false });
const Balloons3D = dynamic(() => import("./Balloons3D"), { ssr: false });
gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0);

const ev = cfg.event;
const ambient = (() => { const r = rng(7); return Array.from({ length: 7 }, () => ({ l: r() * 100, s: 14 + r() * 34, d: 16 + r() * 16, de: -r() * 20, dx: (r() - 0.5) * 100 })); })();

function icsFile() {
  if (!ev.startIso) return false;
  const start = new Date(ev.startIso), end = new Date(start.getTime() + ev.durationHours * 3600_000);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/[,;]/g, (m) => "\\" + m);
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Aurora//Invitation//EN", "BEGIN:VEVENT", `UID:aurora-${f(start)}@aurorafayebritto.com`,
    `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`, `SUMMARY:${esc(ev.title)}`, `LOCATION:${esc(`${ev.venue}, ${ev.address}`)}`,
    `DESCRIPTION:${esc(cfg.copy.inviteBody)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
  a.download = "aurora-sea-of-blessings.ics"; a.click();
  return true;
}

/** Break the configured date into calendar-leaf parts; falls back to the raw text if no ISO date is set. */
function dateParts() {
  if (ev.startIso) { const d = new Date(ev.startIso); if (!isNaN(+d)) return { wd: d.toLocaleDateString("en-US", { weekday: "long" }), day: String(d.getDate()), mo: d.toLocaleDateString("en-US", { month: "long" }), yr: String(d.getFullYear()) }; }
  return { wd: "", day: "", mo: ev.dateText, yr: "" };
}

const ICON = { cal: "M7 2v3M17 2v3M3 8h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z", clock: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", pin: "M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" };
const Ico = ({ d }: { d: string }) => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6a4aa8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;

function PhotoFrame({ p, label, className }: { p?: { src: string; alt: string; pos?: string }; label: string; className?: string }) {
  return (
    <figure className={`pframe ${className || ""}`}>
      <div className="pframe-in">
        {p ? <img src={p.src} alt={p.alt} loading="eager" decoding="async" style={{ objectPosition: p.pos || "50% 50%" }} /> : (
          <div className="pframe-ph"><Shell tone="pink" pearl style={{ width: 84 }} /><strong>{label}</strong><small>Temporary preview artwork. Add a photo in <code>invitation.ts</code>.</small></div>
        )}
        <i className="pframe-glass" />
      </div>
      <svg className="pframe-beads" viewBox="0 0 100 125" preserveAspectRatio="none" aria-hidden>
        {Array.from({ length: 34 }, (_, i) => { const a = (i / 34) * Math.PI * 2; return <circle key={i} cx={+(50 + 48.4 * Math.cos(a)).toFixed(2)} cy={+(62.5 + 60.6 * Math.sin(a)).toFixed(2)} r="2.5" fill="url(#g-pearl)" />; })}
      </svg>
    </figure>
  );
}


const ARCH_TINTS = [["#fff", "#f6c5db", "#e08fb8"], ["#fff", "#bfe5f3", "#7fb9e6"], ["#fff", "#dccdf6", "#a98ad8"], ["#fff", "#cdf2e4", "#86d3b8"], ["#fff", "#ffe9c9", "#e6b98a"]];
function PearlArch({ i }: { i: number }) {
  const [a, b, c] = ARCH_TINTS[i % ARCH_TINTS.length];
  const beads: { x: number; y: number; r: number }[] = [];
  const r = rng(i * 17 + 5);
  [[430, 640, 26], [392, 596, 20], [468, 684, 20]].forEach(([rx, ry, sz], row) => {
    const n = 40 - row * 4;
    for (let k = 0; k <= n; k++) { const t = (k / n) * Math.PI; beads.push({ x: +(500 + Math.cos(t) * rx).toFixed(1), y: +(760 - Math.sin(t) * ry).toFixed(1), r: +(sz * (0.8 + r() * 0.4)).toFixed(1) }); }
  });
  const gid = `pa-${i}`;
  return (
    <div className="fb-arch" style={{ ["--s" as string]: 0.28 + i * 0.12, zIndex: i }}>
      <svg viewBox="0 0 1000 800" aria-hidden>
        <defs><radialGradient id={gid} cx="35%" cy="30%" r="80%"><stop offset="0" stopColor={a} /><stop offset=".45" stopColor={b} /><stop offset="1" stopColor={c} /></radialGradient></defs>
        <path d="M70 760A430 640 0 0 1 930 760" fill="none" stroke={b} strokeOpacity=".35" strokeWidth="26" />
        {beads.map((p, k) => <g key={k}><circle cx={p.x} cy={p.y} r={p.r} fill={`url(#${gid})`} /><ellipse cx={p.x - p.r * 0.3} cy={p.y - p.r * 0.35} rx={p.r * 0.3} ry={p.r * 0.2} fill="#fff" opacity=".85" /></g>)}
      </svg>
    </div>
  );
}

export default function Experience() {
  const [intro, setIntro] = useState(true);
  const [muted, setMutedState] = useState(false);
  const [toast, setToast] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const meetS = useRef({ open: 0 }), diveP = useRef(0), tunnelP = useRef(0), stageP = useRef(1);
  useCausticTexture();
  useEffect(() => { if (process.env.NODE_ENV !== "production") Object.assign(window, { __gsap: gsap, __ST: ScrollTrigger }); }, []);

  useEffect(() => { document.body.classList.toggle("locked", intro); if (intro) window.scrollTo(0, 0); }, [intro]);

  useEffect(() => {
    if (intro) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      const st = (trigger: string, extra: ScrollTrigger.Vars = {}) => ({ trigger, start: "top top", end: "bottom bottom", scrub: 0.8, ...extra });

      if (reduce) {
        stageP.current = 1; meetS.current.open = 1;
        gsap.set([".st-kicker", ".st-tag", ".st-name", ".st-shellwrap", ".st-plat", ".st-pal > *"], { clearProps: "all" });
        gsap.set(".name-stroke", { fillOpacity: 1, strokeDasharray: 0 });
        gsap.set(".tunnel-copy", { opacity: 1 });
        return;
      }

      const safe = (fn: () => void) => { try { fn(); } catch (e) { console.error("scene animation failed", e); } };
      /* ===== SCENE 02 - the dive: layered parallax + swimming turtle ===== */
      gsap.timeline().from(".dv-title .ln", { y: 36, opacity: 0, filter: "blur(12px)", duration: 1.5, ease: "power3.out", stagger: 0.28, delay: 0.25 })
        .from(".dv-cue", { opacity: 0, duration: 1 }, "-=0.4");
      safe(() => {
      const dive = gsap.timeline({ scrollTrigger: st(".dive-track", { onUpdate: (t) => { diveP.current = t.progress; } }) });
      dive.to(".dv-title", { yPercent: -40, opacity: 0, ease: "power1.in", duration: 0.3 }, 0.04)
        .to(".dv-cue", { opacity: 0, duration: 0.08 }, 0)
        .fromTo(".dv-sub", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.18, ease: "power2.out" }, 0.34)
        .to(".dv-sub", { opacity: 0, y: -30, duration: 0.14 }, 0.74)
        .fromTo(".dv-bloom", { opacity: 0 }, { opacity: 1, ease: "power1.in", duration: 0.16 }, 0.84);

      });

      /* ===== SCENE 03 - tunnel: scroll = camera travel ===== */
      safe(() => {
      // scroll progress drives the real-3D camera that flies through the balloon arches
      const tun = gsap.timeline({ scrollTrigger: st(".tunnel-track", { scrub: 0.6, onUpdate: (s) => { tunnelP.current = s.progress; } }) });
      tun.fromTo(".tn-bloomin", { opacity: 1 }, { opacity: 0, duration: 0.04, ease: "none" }, 0)
        .fromTo(".tunnel-copy", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.08 }, 0.04)
        .to(".tunnel-copy", { opacity: 0, y: -20, duration: 0.1 }, 0.3)
        .fromTo(".tunnel-flash", { opacity: 0 }, { opacity: 1, ease: "power2.in", duration: 0.06 }, 0.94);

      });

      /* ===== SCENE 04 - celebration stage: slow, reversible reveal ===== */
      safe(() => {
      const nm = document.querySelector<SVGTextElement>(".name-stroke");
      const len = (nm?.getComputedTextLength?.() || 900) * 1.4;
      let burst = false;
      const stg = gsap.timeline({ scrollTrigger: st(".stage-track", { scrub: 1, onUpdate: (s) => {
        stageP.current = Math.min(1, s.progress / 0.62);
        if (s.progress > 0.7 && !burst) { burst = true; pearlBurst(); chime(); } else if (s.progress < 0.4) burst = false;
      } }) });
      stg.fromTo(".st-bloom", { opacity: 1 }, { opacity: 0, ease: "none", duration: 0.03 }, 0)
        .fromTo(".st-dim", { opacity: 0.78 }, { opacity: 0, ease: "none", duration: 0.5 }, 0.05)
        .fromTo(".st-halo", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, ease: "power2.out", duration: 0.4 }, 0.1)
        .fromTo(".st-plat", { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, ease: "power2.out", duration: 0.25 }, 0.12)
        .fromTo(".st-shellwrap", { scale: 0.55, yPercent: 24, opacity: 0 }, { scale: 1, yPercent: 0, opacity: 1, ease: "power3.out", duration: 0.28 }, 0.3)
        .fromTo(".st-kicker", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.08 }, 0.5)
        .fromTo(".name-stroke", { strokeDasharray: len, strokeDashoffset: len, fillOpacity: 0 }, { strokeDashoffset: 0, ease: "none", duration: 0.22 }, 0.54)
        .to(".name-stroke", { fillOpacity: 1, duration: 0.1 }, 0.74)
        .fromTo(".st-tag", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.1 }, 0.78)
        .fromTo(".st-j", { yPercent: -120, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.04, duration: 0.3, ease: "power2.out" }, 0.3);

      });

      /* ===== generic reveals (play once, clean) ===== */
      gsap.utils.toArray<HTMLElement>(".rise").forEach((el) => {
        gsap.from(el, { y: 36, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      });

      /* ===== SCENE 05 - shell opens to show the portrait ===== */
      gsap.timeline({ scrollTrigger: { trigger: ".meet-stage", start: "top 70%", toggleActions: "play none none reverse" } })
        .fromTo(meetS.current, { open: 0 }, { open: 1, duration: 1.6, ease: "none" }, 0)
        .from(".pframe-main", { scale: 0.7, opacity: 0, y: 40, duration: 1.1, ease: "power3.out" }, 0.4)
        .from(".pframe-s", { scale: 0.5, opacity: 0, y: 50, stagger: 0.18, duration: 1, ease: "back.out(1.6)" }, 0.9);

      /* ===== SCENE 06 - invitation panel ===== */
      gsap.timeline({ scrollTrigger: { trigger: ".invite", start: "top 65%", once: true } })
        .from(".inv-panel", { y: 60, opacity: 0, scale: 0.96, duration: 1.1, ease: "power3.out" })
        .from(".inv-glow", { scale: 0.6, opacity: 0, duration: 1.6, ease: "power2.out" }, 0)
        .from(".info-tile", { y: 26, opacity: 0, stagger: 0.14, duration: 0.8 }, 0.5);

      /* ===== SCENE 07 ===== */
      gsap.timeline({ scrollTrigger: { trigger: ".dress", start: "top 65%", once: true } })
        .from(".dress-art", { y: 50, opacity: 0, rotate: -3, duration: 1.2, ease: "power3.out" })
        .from(".swatch", { y: 30, opacity: 0, scale: 0.8, stagger: 0.1, duration: 0.7, ease: "back.out(1.6)" }, 0.5);

      /* ===== SCENE 10 - golden hour farewell ===== */
      gsap.timeline({ scrollTrigger: { trigger: ".thanks", start: "top 55%", once: true } })
        .from(".ty-word", { y: 34, opacity: 0, filter: "blur(10px)", stagger: 0.22, duration: 1.2, ease: "power3.out" }, 0.3)
        .from(".ty-btns", { opacity: 0, y: 20, duration: 0.8 }, 1.6);

      /* parallax for scene-local floaters */
      gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
        gsap.to(el, { y: () => -parseFloat(el.dataset.speed!) * window.innerHeight * 0.3, ease: "none", scrollTrigger: { trigger: el.closest(".scene"), start: "top bottom", end: "bottom top", scrub: true } });
      });
    }, root);
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => ctx.revert();
  }, [intro]);

  function pearlBurst() {
    const host = document.querySelector(".st-title"); if (!host) return;
    for (let i = 0; i < 26; i++) {
      const d = document.createElement("div"); d.className = "pearl-burst";
      const s = 8 + Math.random() * 14;
      d.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;background:radial-gradient(circle at 30% 28%,#fff,#efe2fb 65%,#d9c8f0)`;
      host.appendChild(d);
      gsap.to(d, { x: (Math.random() - 0.5) * 460, y: (Math.random() - 0.7) * 300, opacity: 0, duration: 1.6 + Math.random() * 1.2, ease: "power2.out", onComplete: () => d.remove() });
    }
  }

  function showToast(m: string) { setToast(m); setTimeout(() => setToast(""), 3500); }
  const toRsvp = () => document.querySelector("#rsvp")?.scrollIntoView({ behavior: "smooth", block: "center" });
  const directions = () => {
    if (!ev.mapsQuery) return showToast("Directions will be available once the venue is confirmed.");
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.mapsQuery)}`, "_blank", "noopener");
  };
  const calendar = () => { if (!icsFile()) showToast("Add to Calendar will be available once the date and time are confirmed."); };
  const exploreAgain = () => { window.scrollTo({ top: 0 }); setIntro(true); };
  const toggleMute = () => { const m = !muted; setMutedState(m); setMuted(m); if (!m) startAmbient(); };

  const dp = dateParts();
  const [t1, t2] = ev.timeText.split(/\s*[-–—]\s*/);
  const photos = cfg.meet.photos;
  const [tyA, tyB] = (() => { const m = cfg.copy.thankYou.match(/^(thank you)\s+(.*)$/i); return m ? [m[1], m[2]] : ["", cfg.copy.thankYou]; })();

  return (
    <div ref={root}>
      <ArtDefs />
      <div className="ambient-bubbles" aria-hidden>
        {ambient.map((b, i) => <div key={i} className="b" style={{ left: `${b.l}%`, width: b.s, animationDuration: `${b.d}s`, animationDelay: `${b.de}s`, ["--dx" as string]: `${b.dx}px` }} />)}
      </div>

      {intro && <Envelope onDone={() => setIntro(false)} />}
      <button className="sound" onClick={toggleMute} aria-label={muted ? "Unmute music" : "Mute music"} aria-pressed={muted}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B2F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" />{muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a9 9 0 0 1 0 12" />}</svg>
      </button>
      {toast && <div role="status" className="toast">{toast}</div>}

      <main aria-hidden={intro}>
        {/* ===== SCENE 02: WELCOME - the dive ===== */}
        <section className="dive-track" aria-label="Welcome to Aurora's World">
          <div className="dive-stick scene">
            <div className="dv-sky" />
            <Lazy3D fallback={<><Shafts color="255,255,255" seed={5} count={4} className="dv-shafts" /><div className="dv-layer dv-far"><ReefLayer seed={21} top="#6fcbec" bottom="#4fb0e2" height={300} detail={1.5} className="reef-svg" /></div><div className="dv-layer dv-mid"><ReefLayer seed={33} top="#4aa8e0" bottom="#2f86cc" height={280} detail={1.7} className="reef-svg" /><Coral className="abs" c="#f6c5db" c2="#e898bd" seed={7} style={{ left: "30%", bottom: "-3%", width: "clamp(90px,15vw,200px)", opacity: 0.8 }} /><TubeCoral className="abs" c="#cbb7ef" c2="#a98ad8" style={{ left: "58%", bottom: "-3%", width: "clamp(110px,18vw,250px)", opacity: 0.85 }} /></div><div className="abs" style={{ right: "8%", top: "40%", width: "clamp(70px,11vw,150px)" }}><Jellyfish className="bob" /></div><div className="abs" style={{ left: "14%", top: "34%", width: "clamp(40px,6vw,80px)", opacity: 0.7 }}><Jellyfish className="bob" /></div><div className="dv-turtle" style={{ left: "56%", top: "50%" }}><div className="swim"><Turtle /></div></div><div className="dv-layer dv-fore"><Rock className="abs" c="#c5b3e2" style={{ left: "-4%", bottom: "-2%", width: "clamp(220px,34vw,480px)" }} /><Octopus className="abs" style={{ left: "2%", bottom: "3%", width: "clamp(150px,22vw,320px)" }} /><Coral className="abs" c="#f2a6c8" c2="#e07fae" seed={2} style={{ left: "-5%", bottom: "-4%", width: "clamp(160px,24vw,340px)", zIndex: 2 }} /><SeaFan className="abs" c="#f6a9cc" style={{ left: "29%", bottom: "-2%", width: "clamp(80px,11vw,160px)" }} /><Seaweed className="abs" style={{ left: "23%", bottom: "-1%", width: "clamp(36px,5vw,70px)" }} /><Seahorse className="abs bob" style={{ right: "22%", bottom: "8%", width: "clamp(46px,6vw,90px)" }} /><Coral className="abs" c="#cbb7ef" c2="#a98ad8" seed={9} style={{ right: "-6%", bottom: "-4%", width: "clamp(190px,29vw,420px)", zIndex: 2 }} /><Starfish className="abs" style={{ right: "9%", bottom: "1%", width: "clamp(40px,5.5vw,80px)", zIndex: 3 }} /></div></>}><Dive3D progress={diveP} /></Lazy3D>
            <div className="dv-title center-col">
              <p className="ln eyebrow">Welcome to</p>
              <h1 className="ln script hero-name">Aurora&apos;s World</h1>
              <p className="ln lede">A little princess, a lot of ocean magic.</p>
              <div className="dv-cue" aria-hidden><span>Scroll to dive</span><svg width="22" height="34" viewBox="0 0 26 40" className="bob"><rect x="2" y="2" width="22" height="36" rx="11" fill="none" stroke="#3a2a85" strokeWidth="2.5" /><circle cx="13" cy="12" r="3.4" fill="#3a2a85" /></svg></div>
            </div>
            <div className="dv-sub center-col"><p className="script">where every bubble<br />carries a blessing</p></div>
            <div className="dv-bloom" />
          </div>
        </section>

        {/* ===== SCENE 03: THE PEARL GATEWAY ===== */}
        <section className="tunnel-track" aria-label="The pearl gateway">
          <div className="tunnel-stick">
            <div className="tn-bg" />
            <Lazy3D fallback={<><div className="gw-floor" />{[0, 1, 2, 3, 4].map((i) => <PearlArch key={i} i={i} />)}</>}><Balloons3D mode="tunnel" progress={tunnelP} style={{ zIndex: 2 }} fallback={<><div className="gw-floor" />{[0, 1, 2, 3, 4].map((i) => <PearlArch key={i} i={i} />)}</>} /></Lazy3D>
            <Motes count={24} seed={77} color="255,255,255" />
            <div className="tn-vignette" />
            <div className="tunnel-copy center-col"><p className="eyebrow">Step inside</p><p className="script">Through the pearl gateway...</p></div>
            <div className="tn-bloomin" /><div className="tunnel-flash" />
          </div>
        </section>

        {/* ===== SCENE 04: A SEA OF BLESSINGS - the stage ===== */}
        <section className="stage-track" aria-label="A Sea of Blessings for Aurora">
          <div className="stage-stick scene">
            <div className="st-bg" />
            <div className="st-halo" />
            <Lazy3D fallback={<BalloonArch className="abs" style={{ left: "5%", top: "0", width: "90%" }} seed={42} rows={4} />}><Balloons3D mode="stage" progress={stageP} style={{ zIndex: 2 }} fallback={<BalloonArch className="abs" style={{ left: "5%", top: "0", width: "90%" }} seed={42} rows={4} />} /></Lazy3D>
            <Shafts color="255,226,246" seed={8} count={4} className="st-shafts" />
            <div className="st-reef l"><ReefLayer seed={61} top="#8a78d6" bottom="#5a4fb5" height={300} detail={1.4} className="reef-svg" /></div>
            <div className="st-reef r"><ReefLayer seed={63} top="#9a82dc" bottom="#6a55b8" height={300} detail={1.4} className="reef-svg" /></div>
            <div className="st-j sj1"><Jellyfish className="bob" /></div><div className="st-j sj2"><Jellyfish className="bob" /></div><div className="st-j sj3"><Jellyfish className="bob" /></div>
            <Motes count={26} seed={12} color="255,236,250" />
            <div className="st-plat">
              <svg viewBox="0 0 1600 220" preserveAspectRatio="none" aria-hidden>
                <defs><linearGradient id="pl-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset=".5" stopColor="#f3e6fb" /><stop offset="1" stopColor="#cdb4ec" /></linearGradient><linearGradient id="pl-refl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".6" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient></defs>
                <path d={`M0 70Q400 20 800 20T1600 70V220H0z`} fill="url(#pl-top)" />
                <path d={`M0 70Q400 20 800 20T1600 70`} fill="none" stroke="#fff" strokeWidth="5" />
                <path d={`M0 120${Array.from({ length: 20 }, () => "q40 34 80 0").join("")}V220H0z`} fill="#bfa3e6" opacity=".55" />
                <ellipse cx="800" cy="60" rx="520" ry="22" fill="url(#pl-refl)" />
              </svg>
            </div>
            <div className="st-shellwrap">
              <Shell glow pearl={false} className="st-shell" />
              <div className="st-title">
                <p className="st-kicker eyebrow dark">{cfg.copy.revealKicker}</p>
                <svg className="st-name" viewBox="0 0 600 200" role="img" aria-label={cfg.child.firstName}>
                  <defs><linearGradient id="name-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7d3fc4" /><stop offset=".5" stopColor="#c2509a" /><stop offset="1" stopColor="#b57a2c" /></linearGradient></defs>
                  <text className="name-stroke" x="300" y="150" textAnchor="middle" fontSize="176" fill="url(#name-grad)" stroke="#4a2386" strokeWidth="1.5" strokeLinecap="round" paintOrder="stroke" style={{ filter: "drop-shadow(0 2px 0 rgba(255,255,255,.9)) drop-shadow(0 6px 14px rgba(150,80,200,.35))", fontFamily: "var(--font-script), cursive" }}>{cfg.child.firstName}</text>
                </svg>
                <p className="st-tag">{cfg.copy.revealTagline}</p>
              </div>
            </div>
            <Lazy3D fallback={<><Coral className="abs" c="#f2a6c8" c2="#e07fae" seed={2} style={{ left: "-2%", bottom: "6%", width: "clamp(140px,22vw,320px)", zIndex: 5 }} /><TubeCoral className="abs" c="#bfe5f3" c2="#8fc4e6" style={{ left: "13%", bottom: "6%", width: "clamp(100px,16vw,230px)", zIndex: 4 }} /><Coral className="abs" c="#cbb7ef" c2="#a98ad8" seed={9} style={{ right: "-3%", bottom: "6%", width: "clamp(150px,24vw,340px)", zIndex: 5 }} /><Shell tone="blue" glow className="abs" style={{ right: "26%", bottom: "5%", width: "clamp(70px,10vw,150px)", zIndex: 6 }} /><Shell tone="pink" className="abs" style={{ left: "27%", bottom: "5%", width: "clamp(60px,8.5vw,130px)", zIndex: 6 }} /><div className="st-oct"><Octopus mood="cheer" className="st-oct-svg" /></div><div className="st-turtle"><div className="swim"><Turtle /></div></div></>}><StageProps3D progress={stageP} /></Lazy3D>
            <div className="st-dim" /><div className="st-bloom" />
          </div>
        </section>

        {/* ===== SCENE 05: MEET AURORA ===== */}
        {cfg.meet.photosEnabled && (
          <section className="scene meet" aria-label="Meet Aurora">
            <div className="meet-bg" />
            <Shafts color="255,255,255" seed={14} count={4} className="meet-shafts" />
            <Caustics opacity={0.2} size={380} className="meet-caustics" />
            <Motes count={18} seed={31} />
            <div className="center-col rise" style={{ position: "relative", zIndex: 3 }}>
              <p className="eyebrow dark">Say hello to</p>
              <h2 className="h-display">{cfg.copy.meetTitle}</h2>
            </div>
            <div className="meet-stage">
              <div className="meet-pearlshell">
                <Lazy3D fallback={<><Shell tone="pearl" glow className="shell-back" /><Shell tone="blue" className="lid" /><Shell tone="pink" pearl className="shell-front" /></>}><Meet3D state={meetS} /></Lazy3D>
                <PhotoFrame p={photos[0]} label="Aurora's photo" className="pframe-main" />
              </div>
              <PhotoFrame p={photos[1]} label="Family photo" className="pframe-s s1" />
              <PhotoFrame p={photos[2]} label="Family photo" className="pframe-s s2" />
              <Bubble className="abs bob" style={{ left: "6%", top: "14%", width: 46, opacity: 0.8 }} /><Bubble className="abs bob" style={{ right: "7%", top: "62%", width: 34, opacity: 0.8, animationDelay: "-2s" }} />
            </div>
            <div className="glass-card rise meet-card">
              <Pearl className="abs" style={{ width: 26, left: "50%", top: -13, marginLeft: -13 }} />
              <p>{cfg.meet.familyMessage}</p>
              <Octopus mood="smile" className="abs meet-oct" />
            </div>
          </section>
        )}

        {/* ===== SCENE 06: THE INVITATION ===== */}
        <section className="scene invite" aria-label="Invitation details">
          <div className="inv-bg" />
          <Shafts color="255,235,250" seed={22} count={4} className="inv-shafts" />
          <Motes count={16} seed={6} color="255,240,250" />
          <div className="inv-wrap">
            <Lazy3D fallback={<Shell glow tone="pink" className="inv-glow" />}><InviteShell3D /></Lazy3D>
            <div className="inv-panel">
              <Shell tone="pearl" pearl className="inv-crest" />
              <i className="cp c1" /><i className="cp c2" /><i className="cp c3" /><i className="cp c4" />
              <h2 className="script inv-title">{cfg.copy.inviteTitle}</h2>
              <p className="inv-body">{cfg.copy.inviteBody}</p>
              <div className="info-grid">
                <div className="info-tile">
                  <span className="medal"><Ico d={ICON.cal} /></span><span className="tile-label">Date</span>
                  {dp.day ? <><b className="big-num">{dp.day}</b><span className="tile-main">{dp.mo} {dp.yr}</span><span className="tile-sub">{dp.wd}</span></> : <span className="tile-main">{dp.mo}</span>}
                </div>
                <div className="info-tile">
                  <span className="medal"><Ico d={ICON.clock} /></span><span className="tile-label">Time</span>
                  <b className="big-num sm">{t1}</b>{t2 && <span className="tile-sub">until {t2}</span>}
                </div>
                <div className="info-tile">
                  <span className="medal"><Ico d={ICON.pin} /></span><span className="tile-label">Venue</span>
                  <span className="tile-main strong">{ev.venue}</span><span className="tile-sub">{ev.address}</span>
                </div>
              </div>
              <div className="inv-actions">
                <button className="cta ghost" onClick={directions} aria-disabled={!ev.mapsQuery}>Get Directions</button>
                <button className="cta ghost" onClick={calendar} aria-disabled={!ev.startIso}>Add to Calendar</button>
                {cfg.rsvp.enabled && <button className="cta" onClick={toRsvp}>Confirm Your Presence</button>}
              </div>
            </div>
          </div>
        </section>

        {/* ===== SCENE 07: DRESS CODE ===== */}
        {cfg.dressCode.enabled && (
          <section className="scene dress" aria-label="Dress code">
            <div className="dress-bg" />
            <Caustics opacity={0.2} size={360} className="dress-caustics" />
            <Motes count={14} seed={44} />
            <div className="dress-grid">
              <div className="dress-stage">
                <div className="dress-halo" />
                <DressArt className="dress-art" />
                <Lazy3D fallback={<><Shell tone="blue" glow className="abs ds1" style={{ left: "-4%", bottom: "2%", width: "28%" }} /><Shell tone="pink" className="abs ds2" style={{ right: "-2%", bottom: "0", width: "22%" }} /><Pearl className="abs bob" style={{ left: "10%", top: "18%", width: 22 }} /><Sparkle className="abs bob" style={{ right: "6%", top: "10%", width: 22 }} /></>}><DressAccents3D /></Lazy3D>
              </div>
              <div className="dress-copy">
                <p className="eyebrow dark">The dress code</p>
                <h2 className="h-display">{cfg.dressCode.title}</h2>
                <p className="dress-sub">{cfg.dressCode.subtitle}</p>
                <div className="swatches">
                  <Swatch color="#cfe9fa" deep="#8fc0e8" name="Baby blue" /><Swatch color="#fbd3e4" deep="#eaa1c3" name="Blush pink" /><Swatch color="#dccdf6" deep="#b19be2" name="Lavender" /><Swatch color="#cdf0e1" deep="#8fd3bd" name="Seafoam" /><Swatch color="#fff4e2" deep="#e9d1a6" name="Pearl cream" />
                </div>
                {cfg.dressCode.optional && <span className="optional-pill">Optional, just for fun!</span>}
              </div>
            </div>
          </section>
        )}

        {/* ===== SCENE 08: RSVP ===== */}
        {cfg.rsvp.enabled && (
          <section id="rsvp" className="scene rsvp-scene" aria-label="RSVP">
            <div className="rsvp-bg" />
            <Caustics opacity={0.2} size={400} className="rsvp-caustics" />
            <Motes count={16} seed={51} color="255,240,250" />
            <TubeCoral className="abs rv-deco" c="#f6c5db" c2="#e898bd" style={{ left: "-4%", bottom: "-1%", width: "clamp(140px,24vw,320px)" }} />
            <Coral className="abs rv-deco" c="#cbb7ef" c2="#a98ad8" seed={4} style={{ right: "-3%", bottom: "-2%", width: "clamp(130px,22vw,300px)" }} />
            <div className="rise" style={{ position: "relative", zIndex: 3 }}><Rsvp firstName={cfg.child.firstName} /></div>
          </section>
        )}

        {/* ===== SCENE 09: GUESTBOOK ===== */}
        {cfg.guestbook.enabled && (
          <section className="scene guest" aria-label="Guestbook">
            <div className="guest-bg" />
            <Caustics opacity={0.2} size={420} className="guest-caustics" />
            <Motes count={16} seed={71} />
            <Seaweed className="abs g-deco" style={{ left: "3%", bottom: "0", width: "clamp(46px,7vw,100px)" }} /><Seaweed className="abs g-deco" c="#b7e6cc" style={{ right: "3%", bottom: "0", width: "clamp(40px,6vw,90px)" }} />
            <div className="center-col rise" style={{ position: "relative", zIndex: 3 }}>
              <p className="eyebrow">Leave a wish</p>
              <h2 className="h-display light">A Little Message for Aurora</h2>
              <p className="guest-sub">Leave a wish and we&apos;ll keep it in a pearl.</p>
            </div>
            <Guestbook />
          </section>
        )}

        {/* ===== SCENE 10: THANK YOU - golden hour ===== */}
        <section className="scene thanks" aria-label="Thank you">
          <div className="ty-bg" />
          <Lazy3D fallback={<><ReefLayer seed={81} top="#f3b3c6" bottom="#e79fbd" height={260} className="reef-svg ty-reef1" /><ReefLayer seed={83} top="#c9a4de" bottom="#a98ad2" height={240} detail={1.3} className="reef-svg ty-reef2" /><div className="ty-oct"><Rock className="abs" c="#e9b6cf" style={{ left: "-12%", bottom: "-8%", width: "150%" }} /><Octopus mood="cheer" className="ty-oct-svg" /></div><Coral className="abs" c="#f6a9c4" c2="#e47fa8" seed={2} style={{ left: "-5%", bottom: "-2%", width: "clamp(150px,22vw,320px)", zIndex: 5 }} /><Coral className="abs" c="#ffd0b0" c2="#f0a27e" seed={6} style={{ right: "-4%", bottom: "-3%", width: "clamp(160px,24vw,340px)", zIndex: 5 }} /><div className="sandfloor" /></>}><Thanks3D /></Lazy3D>
          <div className="ty-copy center-col">
            <p className="eyebrow dark">With all our love</p>
            {tyA && <h2 className="ty-word script ty-big">{tyA}</h2>}
            <p className="ty-word ty-rest">{tyB}</p>
            <div className="ty-btns" style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 26 }}>
              <button className="cta" onClick={exploreAgain}>Explore Again</button>
              {cfg.memoriesUrl && <a className="cta ghost" href={cfg.memoriesUrl} target="_blank" rel="noopener noreferrer">See the memories</a>}
            </div>
          </div>
          </section>
      </main>
    </div>
  );
}
