import "server-only";

export type SheetRsvp = { name: string; attending: boolean; guests: number; phone: string | null; guest_names: string[]; message: string | null };

export const sheetEnabled = () => !!process.env.GOOGLE_SCRIPT_URL && !!process.env.GOOGLE_SCRIPT_SECRET;

/** Sends one RSVP to the Google Apps Script web app (adds a Google Sheet row + emails the family). Throws on failure. */
export async function sendToSheet(r: SheetRsvp) {
  const res = await fetch(process.env.GOOGLE_SCRIPT_URL!, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // plain text: Apps Script rejects CORS-style JSON preflights
    body: JSON.stringify({ secret: process.env.GOOGLE_SCRIPT_SECRET, name: r.name, attending: r.attending, guests: r.guests, phone: r.phone, guestNames: r.guest_names, message: r.message }),
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });
  const j = await res.json().catch(() => null);
  if (!res.ok || !j?.ok) throw new Error("Sheet/email hook failed: " + (j?.error || res.status));
}
