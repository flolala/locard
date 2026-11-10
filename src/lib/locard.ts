import "server-only";

import {
  db,
  nowIso,
  uid,
  type AlertRow,
  type CommandRow,
  type DeviceRow,
  type GeofenceRow,
  type LocationRow,
} from "./db";
import { distanceMeters } from "./geo";
import type { IngestPayload } from "./providers";

export { COLOR_HEX, DEVICE_COLORS, DEVICE_KINDS } from "./colors";
export type { DeviceColor } from "./colors";

const randomToken = (len: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map((n) => (n % 36).toString(36))
    .join("");

export function newApiKey() {
  return `lcd_${randomToken(28)}`;
}

export function newSlug() {
  return randomToken(10);
}

export function createDevice(
  userId: string,
  input: {
    name: string;
    kind?: string;
    provider?: string;
    color?: string;
    contactName?: string;
    contactPhone?: string;
  },
): DeviceRow {
  const id = uid();
  db.prepare(
    `INSERT INTO devices
      (id, user_id, name, kind, provider, color, api_key, share_slug,
       lost_mode, lost_message, contact_name, contact_phone, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
  ).run(
    id,
    userId,
    input.name.trim() || "Perangkat baru",
    input.kind ?? "cardholder",
    input.provider ?? "mock",
    input.color ?? "gold",
    newApiKey(),
    newSlug(),
    "Barang ini milik orang lain. Mohon hubungi pemilik lewat kontak di halaman ini.",
    input.contactName ?? null,
    input.contactPhone ?? null,
    nowIso(),
  );

  return getDeviceById(id)!;
}

export function listDevices(userId: string): DeviceRow[] {
  return db
    .prepare("SELECT * FROM devices WHERE user_id = ? ORDER BY created_at ASC")
    .all(userId) as unknown as DeviceRow[];
}

export function getDeviceById(id: string): DeviceRow | undefined {
  return db.prepare("SELECT * FROM devices WHERE id = ?").get(id) as
    | DeviceRow
    | undefined;
}

export function getDeviceForUser(id: string, userId: string): DeviceRow | undefined {
  return db.prepare("SELECT * FROM devices WHERE id = ? AND user_id = ?").get(id, userId) as
    | DeviceRow
    | undefined;
}

export function getDeviceByApiKey(key: string): DeviceRow | undefined {
  return db.prepare("SELECT * FROM devices WHERE api_key = ?").get(key) as
    | DeviceRow
    | undefined;
}

export function getDeviceBySlug(slug: string): DeviceRow | undefined {
  return db.prepare("SELECT * FROM devices WHERE share_slug = ?").get(slug) as
    | DeviceRow
    | undefined;
}

export function locationsFor(deviceId: string, limit = 200): LocationRow[] {
  return db
    .prepare(
      "SELECT * FROM locations WHERE device_id = ? ORDER BY recorded_at DESC LIMIT ?",
    )
    .all(deviceId, limit) as unknown as LocationRow[];
}

export function alertsFor(deviceId: string, limit = 30): AlertRow[] {
  return db
    .prepare("SELECT * FROM alerts WHERE device_id = ? ORDER BY created_at DESC LIMIT ?")
    .all(deviceId, limit) as unknown as AlertRow[];
}

export function recentAlertsForUser(userId: string, limit = 20): AlertRow[] {
  return db
    .prepare(
      `SELECT a.* FROM alerts a
       JOIN devices d ON d.id = a.device_id
       WHERE d.user_id = ?
       ORDER BY a.created_at DESC LIMIT ?`,
    )
    .all(userId, limit) as unknown as AlertRow[];
}

export function commandsFor(deviceId: string, limit = 20): CommandRow[] {
  return db
    .prepare("SELECT * FROM commands WHERE device_id = ? ORDER BY created_at DESC LIMIT ?")
    .all(deviceId, limit) as unknown as CommandRow[];
}

export function geofencesFor(deviceId: string): GeofenceRow[] {
  return db
    .prepare("SELECT * FROM geofences WHERE device_id = ? ORDER BY created_at ASC")
    .all(deviceId) as unknown as GeofenceRow[];
}

export function addAlert(input: {
  deviceId: string;
  type: string;
  title: string;
  body?: string;
  lat?: number;
  lng?: number;
}) {
  db.prepare(
    "INSERT INTO alerts (id, device_id, type, title, body, lat, lng, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    uid(),
    input.deviceId,
    input.type,
    input.title,
    input.body ?? null,
    input.lat ?? null,
    input.lng ?? null,
    nowIso(),
  );
}

export function hasRecentAlert(deviceId: string, type: string, withinMinutes: number) {
  const cutoff = new Date(Date.now() - withinMinutes * 60_000).toISOString();
  const row = db
    .prepare(
      "SELECT COUNT(*) AS n FROM alerts WHERE device_id = ? AND type = ? AND created_at >= ?",
    )
    .get(deviceId, type, cutoff) as { n: number };
  return row.n > 0;
}

/**
 * Stores a position, refreshes the device's "last seen" snapshot and
 * evaluates geofences / battery thresholds.
 */
export function recordLocation(device: DeviceRow, payload: IngestPayload) {
  const recordedAt = payload.recorded_at ?? nowIso();

  db.prepare(
    `INSERT INTO locations (id, device_id, lat, lng, accuracy, battery, source, recorded_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    uid(),
    device.id,
    payload.lat,
    payload.lng,
    payload.accuracy ?? null,
    payload.battery ?? null,
    payload.source ?? "webhook",
    recordedAt,
    nowIso(),
  );

  db.prepare(
    `UPDATE devices SET last_lat = ?, last_lng = ?, last_accuracy = ?, last_battery = ?,
       last_seen_at = ?, last_source = ? WHERE id = ?`,
  ).run(
    payload.lat,
    payload.lng,
    payload.accuracy ?? null,
    payload.battery ?? null,
    recordedAt,
    payload.source ?? "webhook",
    device.id,
  );

  for (const fence of geofencesFor(device.id)) {
    if (!fence.active) continue;
    const dist = distanceMeters(
      { lat: payload.lat, lng: payload.lng },
      { lat: fence.lat, lng: fence.lng },
    );
    const inside = dist <= fence.radius_m ? 1 : 0;

    if (fence.last_inside === 1 && inside === 0) {
      addAlert({
        deviceId: device.id,
        type: "geofence_exit",
        title: `${device.name} keluar dari zona "${fence.name}"`,
        body: `Posisi terakhir ${Math.round(dist)} m dari pusat zona.`,
        lat: payload.lat,
        lng: payload.lng,
      });
    } else if (fence.last_inside === 0 && inside === 1) {
      addAlert({
        deviceId: device.id,
        type: "geofence_enter",
        title: `${device.name} kembali ke zona "${fence.name}"`,
        body: "Perangkat terdeteksi masuk kembali ke area aman.",
        lat: payload.lat,
        lng: payload.lng,
      });
    }

    db.prepare("UPDATE geofences SET last_inside = ? WHERE id = ?").run(
      inside,
      fence.id,
    );
  }

  if (
    payload.battery !== undefined &&
    payload.battery <= 20 &&
    !hasRecentAlert(device.id, "low_battery", 360)
  ) {
    addAlert({
      deviceId: device.id,
      type: "low_battery",
      title: `Baterai ${device.name} lemah`,
      body: `Sisa ${payload.battery}%. Segera ganti atau isi daya.`,
    });
  }
}

export function createCommand(device: DeviceRow, type: string): CommandRow {
  const id = uid();
  const createdAt = nowIso();

  db.prepare(
    "INSERT INTO commands (id, device_id, type, status, created_at) VALUES (?, ?, ?, 'pending', ?)",
  ).run(id, device.id, type, createdAt);

  if (type === "ring") {
    addAlert({
      deviceId: device.id,
      type: "ring",
      title: `Alarm dibunyikan di ${device.name}`,
      body: "Perintah dikirim. Dengarkan bunyi di sekitar Anda.",
    });
  }

  return db.prepare("SELECT * FROM commands WHERE id = ?").get(id) as unknown as CommandRow;
}

export function setLostMode(device: DeviceRow, enabled: boolean) {
  db.prepare("UPDATE devices SET lost_mode = ? WHERE id = ?").run(
    enabled ? 1 : 0,
    device.id,
  );
  addAlert({
    deviceId: device.id,
    type: enabled ? "lost_mode_on" : "lost_mode_off",
    title: enabled
      ? `Mode hilang aktif untuk ${device.name}`
      : `Mode hilang dimatikan untuk ${device.name}`,
    body: enabled
      ? "Halaman publik aktif dan menampilkan kontak Anda bagi penemu."
      : "Halaman publik tidak lagi menampilkan kontak.",
  });
}

export function upsertGeofence(
  device: DeviceRow,
  input: { name?: string; lat: number; lng: number; radius_m: number },
): GeofenceRow {
  const existing = geofencesFor(device.id)[0];
  if (existing) {
    db.prepare(
      "UPDATE geofences SET name = ?, lat = ?, lng = ?, radius_m = ?, active = 1, last_inside = NULL WHERE id = ?",
    ).run(
      input.name ?? existing.name,
      input.lat,
      input.lng,
      input.radius_m,
      existing.id,
    );
    return geofencesFor(device.id)[0];
  }

  const id = uid();
  db.prepare(
    "INSERT INTO geofences (id, device_id, name, lat, lng, radius_m, active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
  ).run(
    id,
    device.id,
    input.name ?? "Zona aman",
    input.lat,
    input.lng,
    input.radius_m,
    nowIso(),
  );
  return geofencesFor(device.id)[0];
}

export function deviceSummary(device: DeviceRow) {
  const fence = geofencesFor(device.id)[0] ?? null;
  const distanceToFence =
    fence && device.last_lat != null && device.last_lng != null
      ? distanceMeters(
          { lat: device.last_lat, lng: device.last_lng },
          { lat: fence.lat, lng: fence.lng },
        )
      : null;

  return {
    ...device,
    geofence: fence,
    distanceToFence,
    lost_mode: Boolean(device.lost_mode),
  };
}

export type DeviceSummary = ReturnType<typeof deviceSummary>;
