"use client";
import { useEffect, useRef, useState } from "react";
import { invitation as cfg } from "@/config/invitation";
import { ArtDefs, Bubble, Pearl, Shell } from "./Art";
import Rsvp from "./Rsvp";

type Stage = "cover" | "playing" | "open";
const iv = cfg.invite;

const P = "#6a4aa8";
const Ico = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);
const ICON = {
  cal: "M7 2v3M17 2v3M3 8h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM8 12h2M12 12h2M16 12h.01M8 16h2M12 16h2",
  clock: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  pin: "M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
};

const Flourish = () => (
  <svg className="iv-flourish" viewBox="0 0 400 30" aria-hidden>
    <path d="M10 18C70 8 120 22 170 17c14-2 22-6 30-12 8 6 16 10 30 12 50 5 100-9 160 1" fill="none" stroke="#8a64c4" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M200 26c-14-8-22-14-22-22a11 11 0 0 1 22-1 11 11 0 0 1 22 1c0 8-8 14-22 22z" fill="none" stroke="#8a64c4" strokeWidth="1.6" strokeLinejoin="round" transform="translate(0 -3) scale(1 .78) translate(0 5)" />
  </svg>
);

const Crown = () => (
  <svg className="iv-crown" viewBox="0 0 120 70" aria-hidden>
    <defs><linearGradient id="crw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff1b8" /><stop offset=".5" stopColor="#e9c46a" /><stop offset="1" stopColor="#c9962f" /></linearGradient></defs>
    <path d="M12 58 6 18l28 20 26-30 26 30 28-20-6 40z" fill="url(#crw)" stroke="#b8862a" strokeWidth="2" strokeLinejoin="round" />
    <rect x="12" y="56" width="96" height="9" rx="4" fill="url(#crw)" stroke="#b8862a" strokeWidth="2" />
    {[[6, 16], [60, 5], [114, 16]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill="#fff" stroke="#c9a3d6" strokeWidth="1.5" />)}
    <circle cx="60" cy="46" r="5" fill="#d8c3f2" stroke="#b8862a" strokeWidth="1.5" />
  </svg>
);

const SHELLS: { name: string; fill: string }[] = [
  { name: "Pastel pink", fill: "#f8c6dc" }, { name: "Blue", fill: "#bcdcf6" }, { name: "Green", fill: "#c4e8cf" },
  { name: "Yellow", fill: "#fbe3a3" }, { name: "Lavender", fill: "#d4c2f2" }, { name: "White", fill: "#f4f1fb" },
];

export default function Invite() {
  const [stage, setStage] = useState<Stage>("cover");
  const [noVideo, setNoVideo] = useState(false);
  const [ready, setReady] = useState(false); // intro video buffered - so it plays without pausing
  const v = useRef<HTMLVideoElement>(null), lp = useRef<HTMLVideoElement>(null), a = useRef<HTMLAudioElement>(null);

  // desktop / landscape screens get the 16:9 video and a button-driven slide to RSVP instead of scrolling
  const [wide, setWide] = useState<boolean | null>(null);
  const [panel, setPanel] = useState(0);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px) and (min-aspect-ratio: 1/1)");
    const on = () => setWide(mq.matches);
    on(); mq.addEventListener("change", on); return () => mq.removeEventListener("change", on);
  }, []);
  const media = wide ? iv.desktop : iv;
  useEffect(() => { document.body.classList.toggle("locked", stage !== "open" || !!wide); return () => document.body.classList.remove("locked"); }, [stage, wide]);
  useEffect(() => {
    if (!wide) return;
    const k = (e: KeyboardEvent) => { if (e.key === "ArrowRight") setPanel((p) => Math.min(2, p + 1)); if (e.key === "ArrowLeft") setPanel((p) => Math.max(0, p - 1)); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [wide]);

  useEffect(() => { const t = setTimeout(() => setReady(true), 7000); return () => clearTimeout(t); }, []); // never keep anyone waiting longer than this
  useEffect(() => { setReady(false); const el = v.current; if (el && el.readyState >= 4) setReady(true); }, [wide]);

  // stop the music when the guest leaves the page / locks the phone / switches app; resume when they come back.
  // Phones and in-app browsers (WhatsApp etc.) differ in which event they fire, so listen to all of them + a heartbeat.
  useEffect(() => {
    const au = a.current;
    if (!au || stage === "cover") return;
    const away = () => document.hidden || document.visibilityState !== "visible";
    const stop = () => { au.pause(); lp.current?.pause(); };
    const go = () => { if (away()) return; au.play().catch(() => {}); if (stage === "open") lp.current?.play().catch(() => {}); };
    const sync = () => (away() ? stop() : go());
    const beat = setInterval(() => { if (away() && !au.paused) stop(); }, 400);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pagehide", stop);
    window.addEventListener("blur", stop);
    document.addEventListener("freeze", stop);
    window.addEventListener("pageshow", go);
    window.addEventListener("focus", go);
    sync();
    return () => {
      clearInterval(beat);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pagehide", stop);
      window.removeEventListener("blur", stop);
      document.removeEventListener("freeze", stop);
      window.removeEventListener("pageshow", go);
      window.removeEventListener("focus", go);
    };
  }, [stage]);

  // mobile scroll hint: shown on the right edge until the guest starts scrolling
  // "Scroll" on the invitation, "Location" while on the RSVP section, hidden elsewhere
  const [hint, setHint] = useState<"Scroll" | "Location" | null>("Scroll");
  useEffect(() => {
    if (stage !== "open" || wide) return;
    const on = () => {
      const vh = window.innerHeight;
      const top = (id: string) => document.getElementById(id)?.getBoundingClientRect().top ?? Infinity;
      if (top("location") < vh * 0.6) return setHint(null);
      if (top("rsvp") < vh * 0.5) return setHint("Location");
      setHint(window.scrollY > 60 ? null : "Scroll");
    };
    on(); window.addEventListener("scroll", on, { passive: true }); return () => window.removeEventListener("scroll", on);
  }, [stage, wide]);

  function finish() { setStage("open"); window.scrollTo(0, 0); lp.current?.play().catch(() => {}); } // reef keeps moving behind the card

  async function start() {
    const el = v.current, au = a.current;
    if (au) { au.muted = false; au.currentTime = 0; au.play().catch(() => {}); } // music starts ON with the tap (phones require a gesture)
    if (!el || noVideo) return finish();
    setStage("playing");
    el.muted = true; el.currentTime = 0;
    try { await el.play(); } catch { finish(); }
  }

  return (
    <div className={`iv stage-${stage}${wide ? " wide" : ""} panel-${panel}`}>
      <ArtDefs />
      <div className="iv-sea" />
      {wide !== null && <>
        <video
          key={`i${wide}`} ref={v} className={`iv-video${noVideo ? " nov" : ""}`} playsInline muted preload="auto" poster={media.poster} aria-hidden
          onEnded={finish} onCanPlayThrough={() => setReady(true)} onError={() => { setNoVideo(true); setReady(true); }}
        >
          <source src={media.video} type="video/mp4" />
        </video>
        <video key={`l${wide}`} ref={lp} className="iv-video iv-loop" playsInline muted loop preload="auto" src={media.loop} aria-hidden />
      </>}
      <audio ref={a} src={iv.music} loop preload="auto" />

      {/* tap to open - a tap is required so the phone allows the music to play */}
      <div className="iv-cover" aria-hidden={stage !== "cover"}>
        <p className="iv-open-line">{cfg.copy.envelopeLine}</p>
        <button className="iv-open" onClick={start} disabled={!ready} tabIndex={stage === "cover" ? 0 : -1}>
          <span className="iv-open-ring" />
          <span className="iv-open-txt">{!ready ? "Loading…" : wide ? "Click to open" : "Tap to open"}</span>
          <small>{noVideo ? "Aurora’s invitation" : "🔊 turn on your sound"}</small>
        </button>
      </div>

      {wide && stage === "open" && <>
        {panel > 0 && <button className="iv-nav prev" onClick={() => setPanel(panel - 1)} aria-label="Previous"><b>‹</b><span>{panel === 1 ? "Invitation" : "RSVP"}</span></button>}
        {panel < 2 && <button className={`iv-nav next${panel === 0 ? " big" : ""}`} onClick={() => setPanel(panel + 1)} aria-label="Next"><span>{panel === 0 ? "RSVP" : "Location"}</span><b>›</b></button>}
      </>}

      {stage === "open" && !wide && <div className={`iv-scrollhint${hint ? "" : " gone"}`} aria-hidden><span>{hint ?? "Scroll"}</span><i /></div>}

      <main className="iv-main" aria-hidden={stage !== "open"}>
       <div className="iv-track">
        {/* ===== INVITATION (mirrors the invitation card) ===== */}
        <div className="iv-panel">
        <section className="iv-sec" aria-label="Invitation">
          <div className="iv-deco" aria-hidden>
            <Shell tone="pink" className="d-shell-bl" />
            <Shell tone="blue" className="d-shell-br" />
            <Bubble className="d-b1 bob" /><Bubble className="d-b2 bob" /><Bubble className="d-b3 bob" /><Bubble className="d-b4 bob" />
          </div>

          <div className="iv-crest" aria-hidden><Crown /><Shell tone="pink" pearl className="iv-crest-shell" /></div>

          <article className="iv-card">
            <p className="iv-kicker iv-in" style={{ ["--i" as string]: 0 }}>{iv.kicker}</p>
            <p className="iv-celebrating iv-in" style={{ ["--i" as string]: 1 }}>{iv.celebrating}</p>
            <h1 className="iv-name iv-in" style={{ ["--i" as string]: 1 }}>{cfg.child.firstName}</h1>
            <Flourish />
            <p className="iv-sub iv-in" style={{ ["--i" as string]: 2 }}>{iv.subtitle}</p>

            <h2 className="iv-head iv-in" style={{ ["--i" as string]: 2 }}>{iv.headline}</h2>
            <p className="iv-body iv-in" style={{ ["--i" as string]: 3 }}>{iv.body}</p>

            <div className="iv-when iv-in" style={{ ["--i" as string]: 4 }}>
              <div className="iv-date"><Ico d={ICON.cal} /><p><span>{iv.dateLine1}</span><small>{iv.dateLine2}</small></p></div>
              <i className="iv-vr" />
              <div className="iv-time"><Ico d={ICON.clock} /><p>{iv.time}</p></div>
            </div>

            <div className="iv-where iv-in" style={{ ["--i" as string]: 5 }}>
              <Ico d={ICON.pin} /><p><span>{iv.venueLine1}</span><small>{iv.venueLine2}</small></p>
            </div>

            <div className="iv-hr"><i /><Shell tone="pink" /><i /></div>

            <h2 className="iv-dress iv-in" style={{ ["--i" as string]: 6 }}>{iv.dressTitle}</h2>
            <p className="iv-colors">{iv.dressColors}</p>
            <div className="iv-shells" role="list" aria-label="Dress colours">
              {SHELLS.map((s, i) => <span key={s.name} className="iv-shellwrap">{i > 0 && <i className="iv-pearl" />}<Shell fill={s.fill} className="iv-sw" /></span>)}
            </div>

            <p className="iv-wish iv-in" style={{ ["--i" as string]: 7 }}>{iv.wish}</p>
            <p className="iv-wait iv-in" style={{ ["--i" as string]: 7 }}>{iv.wait}</p>
            <Flourish />
            <p className="iv-with iv-in" style={{ ["--i" as string]: 8 }}><span>{iv.withLove}</span><b>{iv.signoff}</b></p>
          </article>
          {cfg.rsvp.enabled && !wide && <div className="iv-in iv-rsvp-wrap" style={{ ["--i" as string]: 9 }}><a className="iv-rsvp-big" href="#rsvp" onClick={(e) => { e.preventDefault(); document.querySelector("#rsvp")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}><span>RSVP</span><small>Tap to reply ↓</small></a></div>}
          <Pearl className="d-pearl-l" /><Pearl className="d-pearl-r" />
        </section>
        </div>

        {/* ===== RSVP ===== */}
        {cfg.rsvp.enabled && (
          <div className="iv-panel">
          <section id="rsvp" className="iv-rsvp" aria-label="RSVP">
            <div style={{ position: "relative", zIndex: 3 }}><Rsvp firstName={cfg.child.firstName} /></div>
          </section>
          </div>
        )}

        {/* ===== LOCATION + CONTACT ===== */}
        <div className="iv-panel">
        <section id="location" className="iv-loc" aria-label="Location and contact">
          <div className="iv-loc-card">
            <Shell tone="blue" pearl className="iv-loc-crest" />
            <p className="eyebrow dark">Find us</p>
            <h2 className="h-display sm">Location &amp; Contact</h2>
            <div className="iv-loc-block">
              <Ico d={ICON.pin} />
              <div><b>{iv.venueLine1}</b><span>{iv.venueLine2}</span></div>
            </div>
            <a className="cta" href={cfg.event.mapsUrl} target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
            <i className="iv-loc-hr" />
            <p className="iv-loc-sub">For any assistance, please call</p>
            {cfg.contacts.map((c) => (
              <div className="iv-contact" key={c.name}>
                <div><b>{c.name}</b><span>+91 {c.phone.slice(0, 5)} {c.phone.slice(5)}</span></div>
                <a className="cta ghost" href={`tel:+91${c.phone}`} aria-label={`Call ${c.name}`}>Call</a>
              </div>
            ))}
          </div>
        </section>
        </div>
       </div>
      </main>
    </div>
  );
}
