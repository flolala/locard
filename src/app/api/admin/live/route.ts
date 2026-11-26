import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getLiveSnapshot } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await getLiveSnapshot();
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "no-store" },
  });
}
