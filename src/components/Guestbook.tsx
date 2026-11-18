"use client";
import { useEffect, useState } from "react";
import { Bubble, Pearl, Shell } from "./Art";

type Wish = { id: string; name: string; message: string };

export default function Guestbook() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [openedAt] = useState(() => Date.now());
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => { fetch("/api/guestbook").then((r) => r.json()).then((j) => setWishes(j.wishes || [])).catch(() => {}); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (sending) return; setErr(""); setSending(true);
    try {
      const r = await fetch("/api/guestbook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, message, website, openedAt }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Something went wrong.");
      setSent(true); setName(""); setMessage("");
    } catch (x: any) { setErr(x.message); } finally { setSending(false); }
  }

  return (
    <div style={{ position: "relative", zIndex: 3 }}>
      {wishes.length > 0 ? (
        <div className="snap" aria-label="Wishes for Aurora">
          {wishes.map((w) => (
            <article key={w.id} className="wish">
              <Pearl style={{ width: 24, margin: "0 auto 10px", display: "block" }} />
              <p>{w.message}</p>
              <p className="script wish-by">- {w.name}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="guest-empty">Be the first to leave a little wish for Aurora.</p>
      )}
      <form onSubmit={submit} className="gb-card" noValidate>
        <Shell tone="blue" className="gb-shell l" /><Shell tone="pink" className="gb-shell r" />
        <Bubble className="gb-bub b1" /><Bubble className="gb-bub b2" />
        {sent ? (
          <p className="done-line" style={{ margin: 0 }}>Thank you! Your wish will appear once the family has read it.</p>
        ) : (
          <>
            <label className="lbl" htmlFor="gb-n">Your name</label>
            <input id="gb-n" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            <label className="lbl" htmlFor="gb-m">Your wish for Aurora</label>
            <textarea id="gb-m" className="field" rows={4} maxLength={400} value={message} onChange={(e) => setMessage(e.target.value)} />
            <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />
            {err && <p role="alert" className="form-err">{err}</p>}
            <button className="cta" style={{ marginTop: 18 }} disabled={sending}>{sending ? "Sending..." : "Send my wish"}</button>
            <p className="fineprint">Wishes are shown publicly only after family approval.</p>
          </>
        )}
      </form>
    </div>
  );
}
