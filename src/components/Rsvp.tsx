"use client";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Octopus, Pearl, Shell, Sparkle } from "./Art";
import { chime } from "@/lib/sound";
import ShellButton3D from "./ShellButton3D";
import Lazy3D from "./Lazy3D";

type Step = "choose" | "yes" | "no" | "doneYes" | "doneNo";

export default function Rsvp({ firstName }: { firstName: string }) {
  const [step, setStep] = useState<Step>("choose");
  const [name, setName] = useState("");
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [openedAt, setOpenedAt] = useState(0);
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);

  // smooth hand-off between the shell choice and each form state
  useLayoutEffect(() => {
    if (!body.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(body.current, { opacity: 0, y: 22, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out", clearProps: "transform" });
  }, [step]);

  function choose(s: "yes" | "no", el: HTMLElement) {
    setOpenedAt(Date.now());
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (s === "yes") chime();
    if (reduce) { setStep(s); return; }
    if (s === "yes") pearls(el);
    gsap.timeline({ onComplete: () => setStep(s) })
      .to(el, { scale: 1.12, duration: 0.2, ease: "back.out(3)" })
      .to(".rs-choices", { opacity: 0, y: -16, scale: 0.97, duration: 0.35, ease: "power2.in" }, 0.15);
  }

  function pearls(el: HTMLElement) {
    const host = box.current!, hr = host.getBoundingClientRect(), r = el.getBoundingClientRect();
    for (let i = 0; i < 16; i++) {
      const d = document.createElement("div"), s = 8 + Math.random() * 18;
      d.style.cssText = `position:absolute;left:${r.left - hr.left + r.width / 2}px;top:${r.top - hr.top + r.height / 3}px;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;z-index:5;
        background:${i % 3 ? "radial-gradient(circle at 30% 28%,#fff,#e9dcf7 70%)" : "radial-gradient(circle at 32% 28%,#fff,rgba(191,229,243,.3) 60%,rgba(246,197,219,.8))"}`;
      host.appendChild(d);
      gsap.to(d, { x: (Math.random() - 0.5) * 220, y: -80 - Math.random() * 160, opacity: 0, duration: 1.4 + Math.random(), ease: "power2.out", onComplete: () => d.remove() });
    }
  }

  async function submit(attending: boolean, e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setErr("");
    if (!name.trim()) { setErr("Please tell us your name."); return; }
    setSending(true);
    try {
      const r = await fetch("/api/rsvp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, attending, guests, message, website, openedAt }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Something went wrong. Please try again.");
      setStep(attending ? "doneYes" : "doneNo");
      if (attending) chime([1046.5, 1318.5, 1568, 2093]);
    } catch (x: any) { setErr(x.message); }
    finally { setSending(false); }
  }

  const first = name.trim().split(" ")[0];
  return (
    <div ref={box} className="rsvp-card">
      <Shell tone="pearl" pearl className="rsvp-crest" />
      <i className="cp c1" /><i className="cp c2" /><i className="cp c3" /><i className="cp c4" />
      <div ref={body} className="rsvp-body">
        {step === "choose" && (
          <div className="rs-choices">
            <p className="eyebrow dark">RSVP</p>
            <h2 className="h-display sm">Will You Join Us Under the Sea?</h2>
            <p className="rs-sub">Please let us know for {firstName}&apos;s celebration.</p>
            <div className="rs-row">
              <button className="rs-shell blue" onClick={(e) => choose("yes", e.currentTarget)} aria-label="Yes, I'll be there">
                <span className="rs-art"><Lazy3D fallback={<><Shell tone="blue" glow /></>}><ShellButton3D tone="blue" /></Lazy3D></span>
                <span className="rs-label">Yes, I&apos;ll be there!</span>
              </button>
              <button className="rs-shell pink" onClick={(e) => choose("no", e.currentTarget)} aria-label="Sorry, I can't make it">
                <span className="rs-art"><Lazy3D fallback={<Shell tone="pink" />}><ShellButton3D tone="pink" /></Lazy3D></span>
                <span className="rs-label">Sorry, I can&apos;t make it</span>
              </button>
            </div>
          </div>
        )}

        {(step === "yes" || step === "no") && (
          <form onSubmit={(e) => submit(step === "yes", e)} noValidate>
            <Octopus mood={step === "yes" ? "cheer" : "sleep"} className="rs-oct" />
            <h2 className="h-display sm">{step === "yes" ? "Yay! Tell us who's coming" : "We'll miss you"}</h2>
            <label className="lbl" htmlFor="rs-name">Your name</label>
            <input id="rs-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" placeholder="Your full name" />
            {step === "yes" && (
              <>
                <label className="lbl" htmlFor="rs-g">Number of guests (including you)</label>
                <div className="stepper">
                  <button type="button" className="cta ghost" onClick={() => setGuests((g) => Math.max(1, g - 1))} aria-label="Fewer guests">-</button>
                  <input id="rs-g" className="field" style={{ textAlign: "center" }} inputMode="numeric" value={guests} onChange={(e) => setGuests(Math.min(10, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)))} />
                  <button type="button" className="cta ghost" onClick={() => setGuests((g) => Math.min(10, g + 1))} aria-label="More guests">+</button>
                </div>
              </>
            )}
            <label className="lbl" htmlFor="rs-m">A message for the family (optional)</label>
            <textarea id="rs-m" className="field" rows={3} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={step === "yes" ? "Warm wishes, dietary needs..." : "A kind word for Aurora"} />
            <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />
            {err && <p role="alert" className="form-err">{err}</p>}
            <div className="form-actions">
              <button type="button" className="cta ghost" onClick={() => setStep("choose")}>Back</button>
              <button className="cta" disabled={sending}>{sending ? "Sending..." : step === "yes" ? "Confirm RSVP" : "Send reply"}</button>
            </div>
          </form>
        )}

        {step === "doneYes" && (
          <div>
            <Octopus mood="cheer" className="rs-oct big" />
            <h2 className="script done-script">Yay{first ? `, ${first}` : ""}!</h2>
            <p className="done-line">We can&apos;t wait to celebrate with you!</p>
            <p className="rs-sub">Your reply for {guests} {guests === 1 ? "guest" : "guests"} has been saved.</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>{[0, 1, 2].map((i) => <Pearl key={i} className="bob" style={{ width: 22, animationDelay: `${i * 0.4}s` }} />)}</div>
          </div>
        )}
        {step === "doneNo" && (
          <div>
            <Octopus mood="sleep" className="rs-oct big" />
            <h2 className="script done-script">Thank you{first ? `, ${first}` : ""}</h2>
            <p className="done-line">We&apos;re sorry you can&apos;t make it - you&apos;ll be in our hearts that day.</p>
          </div>
        )}
      </div>
    </div>
  );
}
