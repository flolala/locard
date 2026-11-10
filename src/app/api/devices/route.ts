import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createDevice, deviceSummary, listDevices } from "@/lib/locard";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const devices = await listDevices(user.id);
  return NextResponse.json({
    devices: await Promise.all(devices.map(deviceSummary)),
  });
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  if (name.length < 2) {
    return NextResponse.json(
      { error: "Nama perangkat minimal 2 karakter." },
      { status: 400 },
    );
  }

  const device = await createDevice(user.id, {
    name,
    kind: typeof body?.kind === "string" ? body.kind : undefined,
    provider: typeof body?.provider === "string" ? body.provider : undefined,
    color: typeof body?.color === "string" ? body.color : undefined,
    contactName: typeof body?.contactName === "string" ? body.contactName : undefined,
    contactPhone:
      typeof body?.contactPhone === "string" ? body.contactPhone : undefined,
  });

  return NextResponse.json({ device: await deviceSummary(device) }, { status: 201 });
}
