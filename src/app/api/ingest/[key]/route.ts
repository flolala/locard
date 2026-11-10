import { NextResponse } from "next/server";
import { getDeviceByApiKey, recordLocation } from "@/lib/locard";
import { validateIngest } from "@/lib/providers";

type Ctx = { params: Promise<{ key: string }> };

/**
 * Public ingest endpoint used by any bridge (ESP32, phone app, gateway).
 * Auth is the per-device API key in the URL.
 */
export async function POST(request: Request, { params }: Ctx) {
  const { key } = await params;
  const device = getDeviceByApiKey(key);
  if (!device) {
    return NextResponse.json({ error: "API key tidak dikenal." }, { status: 401 });
  }

  let payload;
  try {
    payload = validateIngest(await request.json());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payload tidak valid.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  recordLocation(device, { ...payload, source: payload.source ?? "webhook" });

  return NextResponse.json({
    ok: true,
    device: device.name,
    received_at: new Date().toISOString(),
  });
}
