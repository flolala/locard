import "server-only";

import {
  all,
  first,
  run,
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

export async function createDevice(
  userId: string,
  input: {
    name: string;
    kind?: string;
    provider?: string;
    color?: string;
    contactName?: string;
    contactPhone?: string;
  },
): Promise<DeviceRow> {
  const id = uid();
  await run(
    `INSERT INTO devices
      (id, user_id, name, kind, provider, color, api_key, share_slug,
       lost_mode, lost_message, contact_name, contact_phone, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
    [
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
    ],
  );

  return (await getDeviceById(id))!;
}

export function listDevices(userId: string): Promise<DeviceRow[]> {
  return all<DeviceRow>(
    "SELECT * FROM devices WHERE user_id = ? ORDER BY created_at ASC",
    [userId],
  );
}

export function getDeviceById(id: string): Promise<DeviceRow | undefined> {
  return first<DeviceRow>("SELECT * FROM devices WHERE id = ?", [id]);
}

export function getDeviceForUser(
  id: string,
  userId: string,
): Promise<DeviceRow | undefined> {
  return first<DeviceRow>("SELECT * FROM devices WHERE id = ? AND user_id = ?", [
    id,
    userId,
  ]);
}

export function getDeviceByApiKey(key: string): Promise<DeviceRow | undefined> {
  return first<DeviceRow>("SELECT * FROM devices WHERE api_key = ?", [key]);
}

export function getDeviceBySlug(slug: string): Promise<DeviceRow | undefined> {
  return first<DeviceRow>("SELECT * FROM devices WHERE share_slug = ?", [slug]);
}

export function locationsFor(deviceId: string, limit = 200): Promise<LocationRow[]> {
  return all<LocationRow>(
    "SELECT * FROM locations WHERE device_id = ? ORDER BY recorded_at DESC LIMIT ?",
    [deviceId, limit],
  );
}

export function alertsFor(deviceId: string, limit = 30): Promise<AlertRow[]> {
  return all<AlertRow>(
    "SELECT * FROM alerts WHERE device_id = ? ORDER BY created_at DESC LIMIT ?",
    [deviceId, limit],
  );
}

export function recentAlertsForUser(userId: string, limit = 20): Promise<AlertRow[]> {
  return all<AlertRow>(
    `SELECT a.* FROM alerts a
     JOIN devices d ON d.id = a.device_id
     WHERE d.user_id = ?
     ORDER BY a.created_at DESC LIMIT ?`,
    [userId, limit],
  );
}

export function commandsFor(deviceId: string, limit = 20): Promise<CommandRow[]> {
  return all<CommandRow>(
    "SELECT * FROM commands WHERE device_id = ? ORDER BY created_at DESC LIMIT ?",
    [deviceId, limit],
  );
}

export function geofencesFor(deviceId: string): Promise<GeofenceRow[]> {
  return all<GeofenceRow>(
    "SELECT * FROM geofences WHERE device_id = ? ORDER BY created_at ASC",
    [deviceId],
  );
}

export async function addAlert(input: {
  deviceId: string;
  type: string;
  title: string;
  body?: string;
  lat?: number;
  lng?: number;
}) {
  await run(
    "INSERT INTO alerts (id, device_id, type, title, body, lat, lng, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      uid(),
      input.deviceId,
      input.type,
      input.title,
      input.body ?? null,
      input.lat ?? null,
      input.lng ?? null,
      nowIso(),
    ],
  );
}

export async function hasRecentAlert(
  deviceId: string,
  type: string,
  withinMinutes: number,
) {
  const cutoff = new Date(Date.now() - withinMinutes * 60_000).toISOString();
  const row = await first<{ n: number }>(
    "SELECT COUNT(*) AS n FROM alerts WHERE device_id = ? AND type = ? AND created_at >= ?",
    [deviceId, type, cutoff],
  );
  return (row?.n ?? 0) > 0;
}

/**
 * Stores a position, refreshes the device's "last seen" snapshot and
 * evaluates geofences / battery thresholds.
 */
export async function recordLocation(device: DeviceRow, payload: IngestPayload) {
  const recordedAt = payload.recorded_at ?? nowIso();

  await run(
    `INSERT INTO locations (id, device_id, lat, lng, accuracy, battery, source, recorded_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      uid(),
      device.id,
      payload.lat,
      payload.lng,
      payload.accuracy ?? null,
      payload.battery ?? null,
      payload.source ?? "webhook",
      recordedAt,
      nowIso(),
    ],
  );

  await run(
    `UPDATE devices SET last_lat = ?, last_lng = ?, last_accuracy = ?, last_battery = ?,
       last_seen_at = ?, last_source = ? WHERE id = ?`,
    [
      payload.lat,
      payload.lng,
      payload.accuracy ?? null,
      payload.battery ?? null,
      recordedAt,
      payload.source ?? "webhook",
      device.id,
    ],
  );

  const fences = await geofencesFor(device.id);
  for (const fence of fences) {
    if (!fence.active) continue;
    const dist = distanceMeters(
      { lat: payload.lat, lng: payload.lng },
      { lat: fence.lat, lng: fence.lng },
    );
    const inside = dist <= fence.radius_m ? 1 : 0;

    if (fence.last_inside === 1 && inside === 0) {
      await addAlert({
        deviceId: device.id,
        type: "geofence_exit",
        title: `${device.name} keluar dari zona "${fence.name}"`,
        body: `Posisi terakhir ${Math.round(dist)} m dari pusat zona.`,
        lat: payload.lat,
        lng: payload.lng,
      });
    } else if (fence.last_inside === 0 && inside === 1) {
      await addAlert({
        deviceId: device.id,
        type: "geofence_enter",
        title: `${device.name} kembali ke zona "${fence.name}"`,
        body: "Perangkat terdeteksi masuk kembali ke area aman.",
        lat: payload.lat,
        lng: payload.lng,
      });
    }

    await run("UPDATE geofences SET last_inside = ? WHERE id = ?", [inside, fence.id]);
  }

  if (
    payload.battery !== undefined &&
    payload.battery <= 20 &&
    !(await hasRecentAlert(device.id, "low_battery", 360))
  ) {
    await addAlert({
      deviceId: device.id,
      type: "low_battery",
      title: `Baterai ${device.name} lemah`,
      body: `Sisa ${payload.battery}%. Segera ganti atau isi daya.`,
    });
  }
}

export async function createCommand(
  device: DeviceRow,
  type: string,
): Promise<CommandRow> {
  const id = uid();
  const createdAt = nowIso();

  await run(
    "INSERT INTO commands (id, device_id, type, status, created_at) VALUES (?, ?, ?, 'pending', ?)",
    [id, device.id, type, createdAt],
  );

  if (type === "ring") {
    await addAlert({
      deviceId: device.id,
      type: "ring",
      title: `Alarm dibunyikan di ${device.name}`,
      body: "Perintah dikirim. Dengarkan bunyi di sekitar Anda.",
    });
  }

  return (await first<CommandRow>("SELECT * FROM commands WHERE id = ?", [id]))!;
}

export async function setLostMode(device: DeviceRow, enabled: boolean) {
  await run("UPDATE devices SET lost_mode = ? WHERE id = ?", [
    enabled ? 1 : 0,
    device.id,
  ]);
  await addAlert({
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

export async function upsertGeofence(
  device: DeviceRow,
  input: { name?: string; lat: number; lng: number; radius_m: number },
): Promise<GeofenceRow> {
  const existing = (await geofencesFor(device.id))[0];
  if (existing) {
    await run(
      "UPDATE geofences SET name = ?, lat = ?, lng = ?, radius_m = ?, active = 1, last_inside = NULL WHERE id = ?",
      [input.name ?? existing.name, input.lat, input.lng, input.radius_m, existing.id],
    );
    return (await geofencesFor(device.id))[0];
  }

  const id = uid();
  await run(
    "INSERT INTO geofences (id, device_id, name, lat, lng, radius_m, active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
    [
      id,
      device.id,
      input.name ?? "Zona aman",
      input.lat,
      input.lng,
      input.radius_m,
      nowIso(),
    ],
  );
  return (await geofencesFor(device.id))[0];
}

export async function deviceSummary(device: DeviceRow) {
  const fence = (await geofencesFor(device.id))[0] ?? null;
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

export type DeviceSummary = Awaited<ReturnType<typeof deviceSummary>>;
