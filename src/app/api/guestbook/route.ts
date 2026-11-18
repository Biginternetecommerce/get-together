import { NextResponse } from "next/server";
import { addWish, approvedWishes } from "@/lib/store";
import { clean, ipOf, looksLikeBot, rateLimited } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  try { return NextResponse.json({ wishes: await approvedWishes() }); }
  catch { return NextResponse.json({ wishes: [] }); }
}

export async function POST(req: Request) {
  let b: any;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (rateLimited("wish:" + ipOf(req), 3, 10 * 60_000)) return NextResponse.json({ error: "Too many attempts - please try again shortly." }, { status: 429 });
  if (looksLikeBot(b)) return NextResponse.json({ ok: true });
  const name = clean(b.name, 60), message = clean(b.message, 400);
  if (!name || message.length < 2) return NextResponse.json({ error: "Please add your name and a little wish." }, { status: 422 });
  if (/https?:\/\/|www\./i.test(message)) return NextResponse.json({ error: "Links are not allowed in wishes." }, { status: 422 });
  try { await addWish({ name, message }); } catch { return NextResponse.json({ error: "Could not save - please try again." }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
