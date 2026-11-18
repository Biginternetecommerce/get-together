import { NextResponse } from "next/server";
import { adminEnabled, checkPassword, ipOf, makeToken, rateLimited } from "@/lib/guard";

export async function POST(req: Request) {
  if (!adminEnabled()) return NextResponse.json({ error: "Admin is not configured (set ADMIN_PASSWORD)." }, { status: 503 });
  if (rateLimited("login:" + ipOf(req), 8, 15 * 60_000)) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!checkPassword(String(password ?? ""))) return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("aurora_admin", makeToken(), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 8 * 3600 });
  return res;
}
