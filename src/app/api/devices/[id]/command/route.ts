import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createCommand,
  getDeviceForUser,
  setLostMode,
} from "@/lib/locard";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED = new Set(["ring", "locate", "lost_on", "lost_off"]);

export async function POST(request: Request, { params }: Ctx) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const device = getDeviceForUser(id, user.id);
  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const type = String(body?.type ?? "");

  if (!ALLOWED.has(type)) {
    return NextResponse.json({ error: "Perintah tidak dikenal." }, { status: 400 });
  }

  if (type === "lost_on" || type === "lost_off") {
    setLostMode(device, type === "lost_on");
    return NextResponse.json({
      ok: true,
      command: { type, status: "acked" },
    });
  }

  const command = createCommand(device, type);
  return NextResponse.json({ ok: true, command });
}
