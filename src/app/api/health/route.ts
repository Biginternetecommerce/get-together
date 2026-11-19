import { NextResponse } from "next/server";
import { sheetEnabled } from "@/lib/sheet";
import { storageMode } from "@/lib/store";

// Safe self-check for deployments: shows only whether things are configured (never any values).
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({
    googleSheetAndEmail: sheetEnabled() ? "configured" : "MISSING - set GOOGLE_SCRIPT_URL and GOOGLE_SCRIPT_SECRET, then redeploy",
    database: storageMode === "supabase" ? "supabase" : "local file (not saved on Vercel-style hosting)",
    admin: process.env.ADMIN_PASSWORD ? "configured" : "MISSING - set ADMIN_PASSWORD",
  });
}
