"use client";
import { useCallback, useEffect, useState } from "react";

type Data = { rsvps: any[]; guestbook: any[]; storageMode: string };

export default function Admin() {
  const [data, setData] = useState<Data | null>(null);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const load = useCallback(async () => {
    const r = await fetch("/api/admin/data");
    if (r.ok) setData(await r.json()); else setData(null);
  }, []);
  useEffect(() => { load(); }, [load]);
  async function login(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const r = await fetch("/api/admin/login", { method: "POST", body: JSON.stringify({ password: pw }) });
    if (r.ok) load(); else setErr((await r.json()).error);
  }
  async function act(id: string, action: string) {
    await fetch("/api/admin/moderate", { method: "POST", body: JSON.stringify({ id, action }) });
    load();
  }
  const box = "rounded-2xl bg-white/80 p-4 shadow";
  if (!data) return (
    <main className="min-h-screen grid place-items-center bg-gradient-to-b from-baby to-lav p-6">
      <form onSubmit={login} className={box + " w-full max-w-sm space-y-3"}>
        <h1 className="font-script text-4xl text-orchid">Family admin</h1>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" className="w-full rounded-xl border p-3" autoFocus />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="w-full rounded-xl bg-orchid p-3 text-white">Sign in</button>
      </form>
    </main>
  );
  const yes = data.rsvps.filter((r) => r.attending);
  return (
    <main className="min-h-screen bg-gradient-to-b from-baby to-mint p-4 md:p-8 text-ocean font-serif">
      <h1 className="font-script text-5xl text-orchid">Aurora - private dashboard</h1>
      <p className="text-sm opacity-70">Storage: {data.storageMode}{data.storageMode === "local-file" && " (local testing only - connect Supabase for production)"}</p>
      <section className="mt-6 grid gap-3 md:grid-cols-3">
        <div className={box}><b className="text-3xl">{yes.reduce((s, r) => s + r.guests, 0)}</b><br />guests attending ({yes.length} replies)</div>
        <div className={box}><b className="text-3xl">{data.rsvps.length - yes.length}</b><br />declined</div>
        <div className={box}><b className="text-3xl">{data.guestbook.filter((w) => !w.approved).length}</b><br />wishes awaiting approval</div>
      </section>
      <h2 className="mt-8 text-2xl">RSVPs</h2>
      <div className="mt-2 space-y-2">
        {data.rsvps.map((r) => (
          <div key={r.id} className={box}><b>{r.name}</b> - {r.attending ? `Yes (${r.guests})` : "No"} <span className="text-xs opacity-60">{new Date(r.created_at).toLocaleString()}</span>{r.phone && <span className="text-sm"> · {r.phone}</span>}{r.guest_names?.length > 0 && <p className="text-sm">With: {r.guest_names.join(", ")}</p>}{r.message && <p className="italic">{r.message}</p>}</div>
        ))}
        {!data.rsvps.length && <p className="opacity-60">No RSVPs yet.</p>}
      </div>
      <h2 className="mt-8 text-2xl">Guestbook moderation</h2>
      <div className="mt-2 space-y-2">
        {data.guestbook.map((w) => (
          <div key={w.id} className={box + " flex items-start justify-between gap-3"}>
            <div><b>{w.name}</b> <span className="text-xs">{w.approved ? "public" : "pending"}</span><p>{w.message}</p></div>
            <div className="flex shrink-0 gap-2">
              {!w.approved && <button onClick={() => act(w.id, "approve")} className="rounded-lg bg-mint px-3 py-1">Approve</button>}
              <button onClick={() => act(w.id, "remove")} className="rounded-lg bg-blush px-3 py-1">Remove</button>
            </div>
          </div>
        ))}
        {!data.guestbook.length && <p className="opacity-60">No wishes yet.</p>}
      </div>
    </main>
  );
}
