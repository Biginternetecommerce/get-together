import { NextResponse } from "next/server";
import { moderate } from "@/lib/store";
import { isAdmin } from "@/lib/guard";

export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, action } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || !["approve", "remove"].includes(action)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  await moderate(id, action);
  return NextResponse.json({ ok: true });
}
