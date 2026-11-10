import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.LOCARD_DB ?? path.join(dataDir, "locard.db");

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  kind           TEXT NOT NULL DEFAULT 'cardholder',
  provider       TEXT NOT NULL DEFAULT 'mock',
  color          TEXT NOT NULL DEFAULT 'gold',
  api_key        TEXT NOT NULL UNIQUE,
  share_slug     TEXT NOT NULL UNIQUE,
  lost_mode      INTEGER NOT NULL DEFAULT 0,
  lost_message   TEXT,
  contact_name   TEXT,
  contact_phone  TEXT,
  created_at     TEXT NOT NULL,
  last_seen_at   TEXT,
  last_lat       REAL,
  last_lng       REAL,
  last_accuracy  REAL,
  last_battery   INTEGER,
  last_source    TEXT
);

CREATE TABLE IF NOT EXISTS locations (
  id          TEXT PRIMARY KEY,
  device_id   TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  lat         REAL NOT NULL,
  lng         REAL NOT NULL,
  accuracy    REAL,
  battery     INTEGER,
  source      TEXT NOT NULL DEFAULT 'webhook',
  recorded_at TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_locations_device ON locations(device_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS geofences (
  id         TEXT PRIMARY KEY,
  device_id  TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  lat        REAL NOT NULL,
  lng        REAL NOT NULL,
  radius_m   REAL NOT NULL,
  active     INTEGER NOT NULL DEFAULT 1,
  last_inside INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id         TEXT PRIMARY KEY,
  device_id  TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  lat        REAL,
  lng        REAL,
  created_at TEXT NOT NULL,
  read_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_alerts_device ON alerts(device_id, created_at DESC);

CREATE TABLE IF NOT EXISTS commands (
  id          TEXT PRIMARY KEY,
  device_id   TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TEXT NOT NULL,
  delivered_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_commands_device ON commands(device_id, created_at DESC);
`;

declare global {
  var __locardDb: DatabaseSync | undefined;
}

function createDb(): DatabaseSync {
  const db = new DatabaseSync(dbPath);
  db.exec(SCHEMA);
  return db;
}

export const db: DatabaseSync = globalThis.__locardDb ?? createDb();
if (process.env.NODE_ENV !== "production") {
  globalThis.__locardDb = db;
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
