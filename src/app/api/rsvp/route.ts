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
  const phone = clean(b.phone, 20), digits = phone.replace(/\D/g, "");
  const guestNames: string[] = attending && Array.isArray(b.guestNames) ? b.guestNames.slice(0, 9).map((n: unknown) => clean(n, 80)) : [];
  if (!name) return NextResponse.json({ error: "Please tell us your name." }, { status: 422 });
  if (attending && !(guests >= 1 && guests <= 10)) return NextResponse.json({ error: "Guests must be between 1 and 10." }, { status: 422 });
  if (phone && (digits.length < 7 || digits.length > 15)) return NextResponse.json({ error: "That phone number doesn't look right." }, { status: 422 });
  if (attending && digits.length < 7) return NextResponse.json({ error: "Please add a phone / WhatsApp number." }, { status: 422 });
  if (attending && (guestNames.length !== guests - 1 || guestNames.some((n) => !n))) return NextResponse.json({ error: "Please add the name of every guest." }, { status: 422 });
  try { await addRsvp({ name, attending, guests, phone: phone || null, guest_names: guestNames, message: message || null }); }
  catch { return NextResponse.json({ error: "Could not save - please try again." }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
