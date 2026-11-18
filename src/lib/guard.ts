import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// ---- anti-spam: in-memory sliding-window rate limit (per server instance) ----
const hits = new Map<string, number[]>();
export function rateLimited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) { hits.set(key, arr); return true; }
  arr.push(now); hits.set(key, arr); return false;
}
export function ipOf(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}
/** Honeypot `website` must be empty; the form must have been open >= 2.5s. */
export function looksLikeBot(body: any) {
  if (body?.website) return true;
  const t = Number(body?.openedAt);
  return !t || Date.now() - t < 2500;
}
export const clean = (s: unknown, max: number) =>
  String(s ?? "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

// ---- admin auth (password from env, signed httpOnly cookie) ----
const secret = () => process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("hex");
export const adminEnabled = () => !!process.env.ADMIN_PASSWORD;
export function checkPassword(p: string) {
  const a = Buffer.from(p), b = Buffer.from(process.env.ADMIN_PASSWORD || "");
  return a.length === b.length && timingSafeEqual(a, b);
}
export function makeToken() { const exp = String(Date.now() + 1000 * 60 * 60 * 8); return `${exp}.${sign(exp)}`; }
export function isAdmin() {
  if (!adminEnabled()) return false;
  const t = cookies().get("aurora_admin")?.value;
  if (!t) return false;
  const [exp, sig] = t.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = sign(exp);
  return sig.length === good.length && timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}
