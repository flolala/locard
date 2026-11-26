import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { trackEvent } from "@/lib/events";
import { isTrackEventType } from "@/lib/track-shared";

/** Abaikan bot/crawler agar statistik tidak tercemar. */
const BOT_PATTERN =
  /bot|crawl|spider|slurp|bingpreview|headless|lighthouse|pagespeed|curl|wget|python-requests|facebookexternalhit|slackbot|telegrambot|^whatsapp\//i;

function clip(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function sanitizeMeta(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>).slice(0, 8)) {
    if (typeof value === "string") out[key] = value.slice(0, 120);
    else if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    else if (typeof value === "boolean") out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : null;
}

function countryOf(request: Request): string | null {
  const header = request.headers.get("cf-ipcountry");
  if (header) return header;
  try {
    const cf = getCloudflareContext().cf as { country?: string } | undefined;
    return cf?.country ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const userAgent = request.headers.get("user-agent") ?? "";
    if (BOT_PATTERN.test(userAgent)) {
      return new NextResponse(null, { status: 204 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const type = String(body.type ?? "");
    if (!isTrackEventType(type)) {
      return new NextResponse(null, { status: 204 });
    }

    // Event pembayaran hanya boleh ditulis server (route /api/orders).
    if (type === "order_created" || type === "order_status") {
      return new NextResponse(null, { status: 204 });
    }

    // Tolak kiriman dari origin lain (spam lintas situs).
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        if (new URL(origin).host !== host) {
          return new NextResponse(null, { status: 204 });
        }
      } catch {
        return new NextResponse(null, { status: 204 });
      }
    }

    const path = clip(body.path, 300);
    if (path && (path.startsWith("/admin") || path.startsWith("/api"))) {
      return new NextResponse(null, { status: 204 });
    }

    await trackEvent({
      type,
      path,
      label: clip(body.label, 160),
      sessionId: clip(body.session, 64),
      visitorId: clip(body.visitor, 64),
      country: countryOf(request),
      referrer: clip(body.referrer, 300),
      meta: sanitizeMeta(body.meta),
    });
  } catch {
    // Tracking tidak boleh menampilkan error ke pengunjung.
  }

  return new NextResponse(null, { status: 204 });
}
