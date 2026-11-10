import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDeviceForUser, upsertGeofence } from "@/lib/locard";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const device = await getDeviceForUser(id, user.id);
  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  const radius = Number(body?.radius_m);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Koordinat zona tidak valid." }, { status: 400 });
  }

  if (!Number.isFinite(radius) || radius < 25 || radius > 20000) {
    return NextResponse.json(
      { error: "Radius harus antara 25 m dan 20.000 m." },
      { status: 400 },
    );
  }

  const fence = await upsertGeofence(device, {
    name: typeof body?.name === "string" ? body.name.slice(0, 60) : undefined,
    lat,
    lng,
    radius_m: radius,
  });

  return NextResponse.json({ geofence: fence });
}
