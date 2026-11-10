import "server-only";

import { first, nowIso, run, uid } from "./db";
import { hashPassword } from "./auth";
import { createDevice, recordLocation, upsertGeofence, addAlert } from "./locard";
import { jitter } from "./geo";

const DEMO_EMAIL = "demo@locard.id";
const DEMO_PASSWORD = "locard123";

let seeding: Promise<void> | null = null;

function shouldSeed() {
  return process.env.NODE_ENV !== "production" || process.env.LOCARD_SEED === "1";
}

/**
 * Creates a demo account with realistic history so the dashboard can be
 * explored without any hardware. Enabled in development, or in production
 * when LOCARD_SEED=1 is set.
 */
export function ensureDemoSeed(): Promise<void> {
  if (!shouldSeed()) return Promise.resolve();
  if (!seeding) seeding = seedOnce().catch(() => undefined);
  return seeding;
}

async function seedOnce() {
  const count = await first<{ n: number }>("SELECT COUNT(*) AS n FROM users");
  if ((count?.n ?? 0) > 0) return;

  const userId = uid();
  await run(
    "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
    [userId, DEMO_EMAIL, "Demo Locard", await hashPassword(DEMO_PASSWORD), nowIso()],
  );

  const holder = await createDevice(userId, {
    name: "Card Holder Kulit",
    kind: "cardholder",
    provider: "mock",
    color: "gold",
    contactName: "Demo Locard",
    contactPhone: "+62 812-0000-0000",
  });

  const bag = await createDevice(userId, {
    name: "Tas Kamera",
    kind: "bag",
    provider: "webhook",
    color: "ink",
    contactName: "Demo Locard",
    contactPhone: "+62 812-0000-0000",
  });

  await upsertGeofence(holder, {
    name: "Kantor",
    lat: -6.2246,
    lng: 106.8093,
    radius_m: 180,
  });

  // 28 historical pings wandering around Jakarta over the last two days.
  let point = { lat: -6.2226, lng: 106.8087 };
  for (let i = 0; i < 28; i++) {
    point = jitter(point, 90 + Math.random() * 120);
    await recordLocation(holder, {
      ...point,
      accuracy: 12 + Math.random() * 30,
      battery: Math.max(8, 88 - i * 2),
      source: "mock",
      recorded_at: new Date(Date.now() - (28 - i) * 95 * 60_000).toISOString(),
    });
  }

  // The bag was left far away from the office -> geofence exit + lost mode.
  await recordLocation(bag, {
    lat: -6.2411,
    lng: 106.7991,
    accuracy: 24,
    battery: 15,
    source: "webhook",
  });
  await recordLocation(bag, {
    lat: -6.2402,
    lng: 106.7986,
    accuracy: 31,
    battery: 14,
    source: "webhook",
  });

  await addAlert({
    deviceId: bag.id,
    type: "geofence_exit",
    title: "Tas Kamera keluar dari zona aman",
    body: "Terakhir terlihat 1,9 km dari titik jangkar.",
    lat: -6.2411,
    lng: 106.7991,
  });

  await run("UPDATE devices SET lost_mode = 1 WHERE id = ?", [bag.id]);
}

export const DEMO_CREDENTIALS = {
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
};
