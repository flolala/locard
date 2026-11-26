import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getLiveSnapshot } from "@/lib/live";
import { isLiveRangeKey } from "@/lib/track-shared";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rangeParam = new URL(request.url).searchParams.get("range") ?? "today";
  const range = isLiveRangeKey(rangeParam) ? rangeParam : "today";

  const snapshot = await getLiveSnapshot(range);
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "no-store" },
  });
}
