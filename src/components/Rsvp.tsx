"use client";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Octopus, Pearl, Shell, Sparkle } from "./Art";
import { chime } from "@/lib/sound";
import { invitation as cfg } from "@/config/invitation";
import ShellButton3D from "./ShellButton3D";
import Lazy3D from "./Lazy3D";

function addToCalendar() {
  const ev = cfg.event; if (!ev.startIso) return;
  const start = new Date(ev.startIso), end = new Date(start.getTime() + ev.durationHours * 3600_000);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (t: string) => t.replace(/[,;]/g, (m) => "\\" + m);
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Aurora//Invitation//EN", "BEGIN:VEVENT", `UID:aurora-${f(start)}@invite`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
    `SUMMARY:${esc(ev.title)}`, `LOCATION:${esc(`${ev.venue}, ${ev.address}`)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([body], { type: "text/calendar" })); a.download = "aurora-celebration.ics"; a.click();
}
const directions = () => window.open(cfg.event.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cfg.event.mapsQuery)}`, "_blank", "noopener");

type Step = "choose" | "yes" | "no" | "doneYes" | "doneNo";

export default function Rsvp({ firstName }: { firstName: string }) {
  const [step, setStep] = useState<Step>("choose");
  const [name, setName] = useState("");
  const [guests, setGuests] = useState(1);
  const [part, setPart] = useState(1); // "yes" form is split into 2 parts
  const [phone, setPhone] = useState("");
  const [names, setNames] = useState<string[]>([]); // names of guests 2..n
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
    setPart(1);
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
    const two = attending && part === 1; // part 1 of 2: validate details, then move on
    if (!name.trim()) { setErr("Please tell us your name."); return; }
    const digits = phone.replace(/\D/g, "");
    if (attending && digits.length < 7) { setErr("Please add a phone / WhatsApp number we can reach you on."); return; }
    if (phone.trim() && (digits.length < 7 || digits.length > 15)) { setErr("That phone number doesn't look right."); return; }
    if (two) { setPart(2); return; }
    const guestNames = attending ? Array.from({ length: guests - 1 }, (_, i) => (names[i] || "").trim()) : [];
    if (guestNames.some((n) => !n)) { setErr("Please add the name of every guest who is coming."); return; }
    setSending(true);
    try {
      const r = await fetch("/api/rsvp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, attending, guests, phone: phone.trim(), guestNames, message, website, openedAt }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Something went wrong. Please try again.");
      setStep(attending ? "doneYes" : "doneNo");
      if (attending) chime([1046.5, 1318.5, 1568, 2093]);
    } catch (x: any) { setErr(x.message); }
    finally { setSending(false); }
  }

  const p1 = step === "no" || part === 1, p2 = step === "no" || part === 2;
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
            <h3 className="rs-ask">Our Little Pearl Is Waiting for You!</h3>
            <p className="rs-story soft">Come celebrate {firstName} and make a splash of beautiful memories with us.</p>
            {cfg.rsvp.deadlineText && <p className="rs-deadline">{cfg.rsvp.deadlineText}</p>}
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
            {step === "yes" ? (
              <>
                <h2 className="h-display sm">Yay! Tell us who&apos;s coming</h2>
                <p className="rs-story">Every little pearl has a story.<br />Aurora&apos;s is filled with love. ♡</p>
                {cfg.rsvp.deadlineText && <p className="rs-deadline">{cfg.rsvp.deadlineText}</p>}
              </>
            ) : (
              <>
                <h2 className="h-display sm">Oh, we&apos;ll miss you! ♡</h2>
                <p className="rs-story">Every little pearl has a story. Aurora&apos;s is filled with love.</p>
                <p className="rs-story soft">We&apos;re sorry you won&apos;t be able to join us, but your love and blessings mean just as much to our little Aurora.</p>
                <h3 className="rs-ask">Would you like to leave Aurora a little wish?</h3>
                <p className="rs-story soft">A little prayer, a sweet message or a blessing for her to cherish.</p>
              </>
            )}
            {step === "yes" && <p className="rs-steps">Step {part} of 2 · {part === 1 ? "About you" : "Your guests"}</p>}
            {p1 && <>
            <label className="lbl" htmlFor="rs-name">{step === "yes" ? "Your full name" : "Your name"}</label>
            <input id="rs-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" placeholder="Your full name" />
            {step === "yes" && <>
            <label className="lbl" htmlFor="rs-ph">Phone / WhatsApp number</label>
            <input id="rs-ph" className="field" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d+\-\s()]/g, "").slice(0, 20))} placeholder="+91 98765 43210" />
            </>}
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
            </>}
            {p2 && <>
            {step === "yes" && (
              <>
                {guests > 1 && (
                  <fieldset className="rs-guests">
                    <legend className="lbl">Name of each guest coming with you</legend>
                    {Array.from({ length: guests - 1 }, (_, i) => (
                      <input key={i} className="field" aria-label={`Guest ${i + 2} name`} value={names[i] || ""} maxLength={80} placeholder={`Guest ${i + 2} full name`}
                        onChange={(e) => setNames((p) => { const n = [...p]; n[i] = e.target.value; return n; })} />
                    ))}
                  </fieldset>
                )}
              </>
            )}
            {step === "yes" && <p className="rs-note">A little note: If you prefer a vegetarian meal, kindly mention it in your RSVP message.</p>}
            <label className="lbl" htmlFor="rs-m">{step === "yes" ? "A message for the family" : "Your wish for Aurora"}</label>
            <textarea id="rs-m" className="field" rows={3} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={step === "yes" ? "A blessing or note for the family" : "A little prayer, a sweet message or a blessing…"} />
            </>}
            <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />
            {err && <p role="alert" className="form-err">{err}</p>}
            <div className="form-actions">
              <button type="button" className="cta ghost" onClick={() => { setErr(""); if (step === "yes" && part === 2) setPart(1); else setStep("choose"); }}>Back</button>
              <button className="cta" disabled={sending}>{sending ? "Sending..." : step === "yes" ? (part === 1 ? "Next" : "Confirm RSVP") : "Send reply"}</button>
            </div>
          </form>
        )}

        {step === "doneYes" && (
          <div>
            <Octopus mood="cheer" className="rs-oct big" />
            <h2 className="h-display sm done-h">You&apos;ve become part of Aurora&apos;s story!</h2>
            <p className="done-line">Thank you for sharing your love and blessings with our little pearl. We can&apos;t wait to see you!</p>
            <p className="rs-sub rs-saved">{guests} {guests === 1 ? "guest" : "guests"}{guests > 1 ? `: ${[name.trim(), ...names.slice(0, guests - 1).map((n) => n.trim())].join(", ")}` : ""}</p>
            <p className="rs-with">With love, <b>{cfg.invite.signoff}</b> ♡</p>
            <div className="rs-after">
              {cfg.event.startIso && <button type="button" className="cta ghost" onClick={addToCalendar}>Add to Calendar</button>}
              {(cfg.event.mapsUrl || cfg.event.mapsQuery) && <button type="button" className="cta ghost" onClick={directions}>Get Directions</button>}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>{[0, 1, 2].map((i) => <Pearl key={i} className="bob" style={{ width: 22, animationDelay: `${i * 0.4}s` }} />)}</div>
          </div>
        )}
        {step === "doneNo" && (
          <div>
            <Octopus mood="sleep" className="rs-oct big" />
            <h2 className="h-display sm done-h">Your love has reached our little pearl!</h2>
            <p className="done-line">Thank you for taking a moment to send Aurora your wishes. Even from afar, you&apos;re part of her beautiful story.</p>
            <p className="rs-with">With love, <b>{cfg.invite.signoff}</b> ♡</p>
          </div>
        )}
      </div>
    </div>
  );
}
