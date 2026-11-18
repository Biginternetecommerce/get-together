import "server-only";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type Rsvp = { id: string; name: string; attending: boolean; guests: number; message: string | null; created_at: string };
export type Wish = { id: string; name: string; message: string; approved: boolean; created_at: string };

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
export const storageMode = sb ? "supabase" : "local-file";

// ---- local file fallback (development only; .data is git-ignored) ----
const FILE = path.join(process.cwd(), ".data", "store.json");
type Db = { rsvps: Rsvp[]; guestbook: Wish[] };
async function load(): Promise<Db> {
  try { return JSON.parse(await fs.readFile(FILE, "utf8")); } catch { return { rsvps: [], guestbook: [] }; }
}
async function save(db: Db) { await fs.mkdir(path.dirname(FILE), { recursive: true }); await fs.writeFile(FILE, JSON.stringify(db, null, 2)); }

export async function addRsvp(r: Omit<Rsvp, "id" | "created_at">) {
  if (sb) { const { error } = await sb.from("rsvps").insert(r); if (error) throw error; return; }
  const db = await load(); db.rsvps.unshift({ ...r, id: randomUUID(), created_at: new Date().toISOString() }); await save(db);
}
export async function addWish(w: { name: string; message: string }) {
  if (sb) { const { error } = await sb.from("guestbook").insert({ ...w, approved: false }); if (error) throw error; return; }
  const db = await load(); db.guestbook.unshift({ ...w, id: randomUUID(), approved: false, created_at: new Date().toISOString() }); await save(db);
}
export async function approvedWishes(): Promise<Pick<Wish, "id" | "name" | "message">[]> {
  if (sb) {
    const { data, error } = await sb.from("guestbook").select("id,name,message").eq("approved", true).order("created_at", { ascending: false }).limit(60);
    if (error) throw error; return data ?? [];
  }
  return (await load()).guestbook.filter((w) => w.approved).map(({ id, name, message }) => ({ id, name, message }));
}
export async function adminData() {
  if (sb) {
    const [a, b] = await Promise.all([
      sb.from("rsvps").select("*").order("created_at", { ascending: false }),
      sb.from("guestbook").select("*").order("created_at", { ascending: false }),
    ]);
    if (a.error) throw a.error;
    if (b.error) throw b.error;
    return { rsvps: a.data as Rsvp[], guestbook: b.data as Wish[] };
  }
  return load();
}
export async function moderate(id: string, action: "approve" | "remove") {
  if (sb) {
    const q = action === "approve" ? sb.from("guestbook").update({ approved: true }).eq("id", id) : sb.from("guestbook").delete().eq("id", id);
    const { error } = await q; if (error) throw error; return;
  }
  const db = await load();
  if (action === "approve") db.guestbook = db.guestbook.map((w) => (w.id === id ? { ...w, approved: true } : w));
  else db.guestbook = db.guestbook.filter((w) => w.id !== id);
  await save(db);
}
