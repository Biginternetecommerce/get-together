import { NextResponse } from "next/server";
import { addRsvp } from "@/lib/store";
import { clean, ipOf, looksLikeBot, rateLimited } from "@/lib/guard";

export async function POST(req: Request) {
  let b: any;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (rateLimited("rsvp:" + ipOf(req), 5, 10 * 60_000)) return NextResponse.json({ error: "Too many attempts - please try again shortly." }, { status: 429 });
  if (looksLikeBot(b)) return NextResponse.json({ ok: true }); // silently drop bots
  const name = clean(b.name, 80), message = clean(b.message, 500);
  const attending = b.attending === true;
  const guests = attending ? Math.floor(Number(b.guests)) : 0;
  if (!name) return NextResponse.json({ error: "Please tell us your name." }, { status: 422 });
  if (attending && !(guests >= 1 && guests <= 10)) return NextResponse.json({ error: "Guests must be between 1 and 10." }, { status: 422 });
  try { await addRsvp({ name, attending, guests, message: message || null }); }
  catch { return NextResponse.json({ error: "Could not save - please try again." }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
