import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Minimal D1 typings so the app does not need a separate workers-types build
 * step. Keep in sync with Cloudflare's D1 API.
 */
type D1Result<T> = { results?: T[]; success: boolean };
type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<{ success: boolean }>;
};
export type D1Database = {
  prepare(query: string): D1Statement;
  batch<T = unknown>(statements: D1Statement[]): Promise<D1Result<T>[]>;
};

export function db(): D1Database {
  const env = getCloudflareContext().env as unknown as { DB?: D1Database };
  if (!env.DB) {
    throw new Error(
      "Binding D1 'DB' tidak ditemukan. Jalankan lewat wrangler atau next dev dengan initOpenNextCloudflareForDev().",
    );
  }
  return env.DB;
}

export async function all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await db().prepare(sql).bind(...params).all<T>();
  return (result.results ?? []) as T[];
}

export async function first<T>(
  sql: string,
  params: unknown[] = [],
): Promise<T | undefined> {
  const row = await db().prepare(sql).bind(...params).first<T>();
  return row ?? undefined;
}

export async function run(sql: string, params: unknown[] = []) {
  return db().prepare(sql).bind(...params).run();
}

export const nowIso = () => new Date().toISOString();
export const uid = () => crypto.randomUUID();

export type DeviceRow = {
  id: string;
  user_id: string;
  name: string;
  kind: string;
  provider: string;
  color: string;
  api_key: string;
  share_slug: string;
  lost_mode: number;
  lost_message: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  created_at: string;
  last_seen_at: string | null;
  last_lat: number | null;
  last_lng: number | null;
  last_accuracy: number | null;
  last_battery: number | null;
  last_source: string | null;
};

export type LocationRow = {
  id: string;
  device_id: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  battery: number | null;
  source: string;
  recorded_at: string;
  created_at: string;
};

export type AlertRow = {
  id: string;
  device_id: string;
  type: string;
  title: string;
  body: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  read_at: string | null;
};

export type CommandRow = {
  id: string;
  device_id: string;
  type: string;
  status: string;
  created_at: string;
  delivered_at: string | null;
};

export type GeofenceRow = {
  id: string;
  device_id: string;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  active: number;
  last_inside: number | null;
  created_at: string;
};
