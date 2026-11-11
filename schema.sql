-- LOCARD schema (Cloudflare D1 / SQLite)

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
  id          TEXT PRIMARY KEY,
  device_id   TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  lat         REAL NOT NULL,
  lng         REAL NOT NULL,
  radius_m    REAL NOT NULL,
  active      INTEGER NOT NULL DEFAULT 1,
  last_inside INTEGER,
  created_at  TEXT NOT NULL
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
  id           TEXT PRIMARY KEY,
  device_id    TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  created_at   TEXT NOT NULL,
  delivered_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_commands_device ON commands(device_id, created_at DESC);

CREATE TABLE IF NOT EXISTS orders (
  id          TEXT PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  whatsapp    TEXT NOT NULL,
  email       TEXT NOT NULL,
  product     TEXT NOT NULL,
  qty         INTEGER NOT NULL DEFAULT 1,
  unit_price  INTEGER NOT NULL,
  dp_amount   INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'awaiting_confirmation',
  proof_key   TEXT,
  proof_type  TEXT,
  proof_size  INTEGER,
  note        TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
