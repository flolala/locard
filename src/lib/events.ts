import "server-only";

import { nowIso, run, uid } from "./db";
import type { TrackEventType } from "./track-shared";

function clip(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function safeMeta(meta: Record<string, unknown> | null | undefined): string | null {
  if (!meta) return null;
  try {
    const json = JSON.stringify(meta);
    return json.length > 800 ? json.slice(0, 800) : json;
  } catch {
    return null;
  }
}

/** Simpan satu event analytics. Kegagalan tracking tidak boleh memutus alur utama. */
export async function trackEvent(input: {
  type: TrackEventType;
  path?: string | null;
  label?: string | null;
  sessionId?: string | null;
  visitorId?: string | null;
  country?: string | null;
  referrer?: string | null;
  meta?: Record<string, unknown> | null;
}): Promise<void> {
  await run(
    `INSERT INTO events
       (id, type, path, label, session_id, visitor_id, country, referrer, meta, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      uid(),
      input.type,
      clip(input.path, 300),
      clip(input.label, 160),
      clip(input.sessionId, 64),
      clip(input.visitorId, 64),
      clip(input.country, 8),
      clip(input.referrer, 300),
      safeMeta(input.meta),
      nowIso(),
    ],
  );
}
