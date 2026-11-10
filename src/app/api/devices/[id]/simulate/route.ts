import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { jitter } from "@/lib/geo";
import { deviceSummary, getDeviceForUser, recordLocation } from "@/lib/locard";

type Ctx = { params: Promise<{ id: string }> };

const FALLBACK = { lat: -6.2088, lng: 106.8456 }; // Jakarta

/**
 * Development helper: advances the simulated position of a mock device so the
 * whole pipeline (map, history, geofence alerts) can be demonstrated live.
 */
export async function POST(_request: Request, { params }: Ctx) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const device = getDeviceForUser(id, user.id);
  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const base =
    device.last_lat != null && device.last_lng != null
      ? { lat: device.last_lat, lng: device.last_lng }
      : FALLBACK;

  const steps = 1 + Math.floor(Math.random() * 3);
  let point = base;

  for (let i = 0; i < steps; i++) {
    point = jitter(point, 60 + Math.random() * 220);
    recordLocation(
      { ...device, last_lat: null, last_lng: null } as typeof device,
      {
        ...point,
        accuracy: 8 + Math.random() * 35,
        battery:
          device.last_battery != null
            ? Math.max(3, device.last_battery - 1)
            : 74,
        source: "mock",
        recorded_at: new Date(Date.now() + i * 1000).toISOString(),
      },
    );
  }

  const fresh = getDeviceForUser(id, user.id)!;
  return NextResponse.json({ ok: true, device: deviceSummary(fresh) });
}
