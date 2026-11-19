import { NextResponse } from "next/server";
import { sheetEnabled } from "@/lib/sheet";
import { storageMode } from "@/lib/store";

// Safe self-check for deployments: shows only whether things are configured / reachable (never any values).
export const dynamic = "force-dynamic";

async function pingScript(): Promise<string> {
  if (!sheetEnabled()) return "MISSING - set GOOGLE_SCRIPT_URL and GOOGLE_SCRIPT_SECRET, then redeploy";
  try {
    // 1) plain GET: proves the URL + public access work, and tells us whether the script is the latest version (old ones would treat a POST ping as a real RSVP)
    const g = await fetch(process.env.GOOGLE_SCRIPT_URL!, { redirect: "follow", signal: AbortSignal.timeout(15000) });
    const gt = await g.text(); let gj: any = null; try { gj = JSON.parse(gt); } catch { /* not JSON */ }
    if (!gj?.ok) return /<html|<!doctype/i.test(gt) ? `script answered with a web page (status ${g.status}) - deployment access must be 'Anyone', and the URL must end with /exec` : `script not answering correctly (status ${g.status})`;
    if (gj.v !== 2) return "script is the OLD version - paste the latest Code.gs (with your real SECRET) and Deploy > Manage deployments > New version";
    // 2) POST ping: checks the secret only - writes nothing, sends no email
    const res = await fetch(process.env.GOOGLE_SCRIPT_URL!, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, redirect: "follow", signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ secret: process.env.GOOGLE_SCRIPT_SECRET, action: "ping" }), // writes nothing, sends no email
    });
    const text = await res.text();
    let j: any = null; try { j = JSON.parse(text); } catch { /* not JSON */ }
    if (j?.ok && j.pong) return "OK - script reachable and secret matches";
    if (j?.error === "unauthorized") return "SECRET MISMATCH - GOOGLE_SCRIPT_SECRET differs from SECRET in the Apps Script";
    if (j?.ok) return "script reachable but it is the OLD version - paste the latest Code.gs and Deploy > Manage deployments > New version";
    if (/<html|<!doctype/i.test(text)) return `script answered with a web page (status ${res.status}) - deployment access must be 'Anyone', and the URL must end with /exec`;
    return `script error (status ${res.status})${j?.error ? ": " + String(j.error).slice(0, 120) : ""}`;
  } catch (e: any) { return "script NOT reachable from the server: " + String(e?.message || e).slice(0, 120); }
}

export async function GET() {
  return NextResponse.json({
    googleSheetAndEmail: await pingScript(),
    database: storageMode === "supabase" ? "supabase" : "local file (not saved on Vercel-style hosting)",
    admin: process.env.ADMIN_PASSWORD ? "configured" : "MISSING - set ADMIN_PASSWORD",
  });
}
