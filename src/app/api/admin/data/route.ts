import { NextResponse } from "next/server";
import { adminData, storageMode } from "@/lib/store";
import { isAdmin } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ...(await adminData()), storageMode });
}
