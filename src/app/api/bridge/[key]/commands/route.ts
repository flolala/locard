import { NextResponse } from "next/server";
import { nowIso, run } from "@/lib/db";
import { commandsFor, getDeviceByApiKey } from "@/lib/locard";

type Ctx = { params: Promise<{ key: string }> };

/** Bridge pulls the commands queued for its device. */
export async function GET(_request: Request, { params }: Ctx) {
  const { key } = await params;
  const device = await getDeviceByApiKey(key);
  if (!device) {
    return NextResponse.json({ error: "API key tidak dikenal." }, { status: 401 });
  }

  const recent = await commandsFor(device.id, 50);
  const pending = recent.filter((c) => c.status === "pending");

  for (const command of pending) {
    await run(
      "UPDATE commands SET status = 'delivered', delivered_at = ? WHERE id = ?",
      [nowIso(), command.id],
    );
  }

  return NextResponse.json({
    device: {
      id: device.id,
      name: device.name,
      lost_mode: Boolean(device.lost_mode),
    },
    commands: pending.map((c) => ({
      id: c.id,
      type: c.type,
      created_at: c.created_at,
    })),
  });
}

/** Bridge acknowledges that a command was executed. */
export async function POST(request: Request, { params }: Ctx) {
  const { key } = await params;
  const device = await getDeviceByApiKey(key);
  if (!device) {
    return NextResponse.json({ error: "API key tidak dikenal." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = String(body?.id ?? "");
  const status = body?.status === "failed" ? "failed" : "acked";

  await run("UPDATE commands SET status = ? WHERE id = ? AND device_id = ?", [
    status,
    id,
    device.id,
  ]);

  return NextResponse.json({ ok: true });
}
