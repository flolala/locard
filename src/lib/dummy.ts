import "server-only";

import { isOrderStatus, type OrderRow, type OrderStats } from "./orders";
import type { LiveEvent, LiveSnapshot } from "./track-shared";

/**
 * ============================================================
 * DATA DUMMY (overlay) — TIDAK ditulis ke database.
 * ============================================================
 * Angka di bawah DITAMBAHKAN ke data asli saat ditampilkan di dashboard
 * admin (/admin dan /admin/live). Data asli di D1 tetap murni.
 *
 * Nilai dummy deterministik (seeded per tanggal/menit), jadi tidak
 * "lompat-lompat" setiap kali dashboard refresh.
 *
 * Cara mencabut (revoke):
 *   1. Cepat   : ubah `DUMMY.enabled` menjadi `false`.
 *   2. Permanen: hapus file ini + baris bertanda `// DUMMY` di
 *                src/lib/live.ts dan src/app/admin/page.tsx.
 *
 * Export CSV (/api/admin/orders/export) sengaja TIDAK memakai dummy.
 */
export const DUMMY = {
  enabled: true,

  /** Rata-rata tambahan per hari (bervariasi ±spread). */
  perDay: {
    pageviews: 270,
    visitors: 130,
    clicks: 9,
    orders: 0,
  },
  /** Variasi harian, 0.35 = ±35%. */
  spread: 0.35,
  /** Berapa hari ke belakang pesanan dummy dibuat (untuk halaman /admin). */
  historyDays: 45,
  /** Tambahan "online sekarang" (5 menit terakhir). */
  online: { sessions: 4, pageviews: 7 },

  /** Distribusi halaman & sumber trafik dummy. */
  pages: [
    { path: "/", share: 0.64 },
    { path: "/preorder", share: 0.36 },
  ],
  sources: [
    { source: "Langsung", share: 0.42 },
    { source: "instagram.com", share: 0.31 },
    { source: "google.com", share: 0.15 },
    { source: "tiktok.com", share: 0.12 },
  ],
  names: [
    "Rizky Pratama", "Dewi Lestari", "Andi Saputra", "Siti Rahmawati",
    "Budi Santoso", "Nadia Putri", "Fajar Nugroho", "Ayu Wulandari",
    "Kevin Halim", "Intan Permata", "Dimas Aditya", "Maya Anggraini",
    "Yoga Firmansyah", "Citra Kirana", "Reza Mahendra", "Putri Ramadhani",
    "Arif Hidayat", "Larasati Dewi", "Hendra Wijaya", "Salsabila Azzahra",
  ],
  unitPrice: 299_000,
  dpPerUnit: 50_000,
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Angka acak 0..1 yang selalu sama untuk seed yang sama. */
function rand(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h += h << 13;
  h ^= h >>> 7;
  h += h << 3;
  h ^= h >>> 17;
  h += h << 5;
  return (h >>> 0) / 4294967296;
}

function vary(base: number, seed: string) {
  const s = DUMMY.spread;
  return Math.max(0, Math.round(base * (1 - s + 2 * s * rand(seed))));
}

function bernoulli(trials: number, p: number, seed: string) {
  let n = 0;
  for (let i = 0; i < trials; i += 1) if (rand(`${seed}:${i}`) < p) n += 1;
  return n;
}

function wibDayKey(ms: number) {
  return new Date(ms + JAKARTA_OFFSET_MS).toISOString().slice(0, 10);
}

/** 00:00 WIB untuk kunci tanggal "YYYY-MM-DD", dalam ms UTC. */
function wibDayStartMs(key: string) {
  return Date.parse(`${key}T00:00:00.000Z`) - JAKARTA_OFFSET_MS;
}

function splitByShare<T extends { share: number }>(items: T[], total: number) {
  return items.map((item) => ({ item, value: Math.round(total * item.share) }));
}

// ------------------------------------------------------------
// Generator
// ------------------------------------------------------------

type DayDummy = {
  pageviews: number;
  visitors: number;
  clicks: number;
  clickers: number;
  preorderVisitors: number;
  qrisOpens: number;
  proofUploads: number;
};

/** Dummy trafik untuk satu hari WIB. Hari ini diskalakan sesuai jam berjalan. */
function dayTraffic(key: string, now: number): DayDummy {
  const start = wibDayStartMs(key);
  const fraction = Math.min(1, Math.max(0, (now - start) / DAY));
  const p = DUMMY.perDay;
  const pageviews = Math.round(vary(p.pageviews, `${key}:pv`) * fraction);
  const visitors = Math.min(pageviews, Math.round(vary(p.visitors, `${key}:vi`) * fraction));
  const clicks = Math.round(vary(p.clicks, `${key}:cl`) * fraction);
  const clickers = Math.round(clicks * 0.8);
  return {
    pageviews,
    visitors,
    clicks,
    clickers,
    preorderVisitors: Math.max(clickers, Math.round(visitors * 0.32)),
    qrisOpens: Math.round(clicks * 0.55),
    proofUploads: 0, // diisi dari jumlah order
  };
}

/** Semua pesanan dummy dalam `days` hari terakhir (hanya yang <= now). */
function dummyOrders(now: number, days = DUMMY.historyDays): OrderRow[] {
  const todayStart = wibDayStartMs(wibDayKey(now));
  const rows: OrderRow[] = [];

  for (let d = days - 1; d >= 0; d -= 1) {
    const dayStart = todayStart - d * DAY;
    const key = wibDayKey(dayStart);
    const count = vary(DUMMY.perDay.orders, `${key}:or`);

    for (let j = 0; j < count; j += 1) {
      const seed = `${key}:o${j}`;
      // Jam 08:00–23:00 WIB
      const at = dayStart + 8 * 60 * MINUTE + Math.floor(rand(`${seed}:t`) * 15 * 60) * MINUTE;
      if (at > now) continue;

      const name = DUMMY.names[Math.floor(rand(`${seed}:n`) * DUMMY.names.length)];
      const qty = rand(`${seed}:q`) < 0.15 ? 2 : 1;
      const ageDays = (now - at) / DAY;
      const r = rand(`${seed}:s`);
      const status =
        ageDays < 1.5
          ? "awaiting_confirmation"
          : r < 0.07
            ? "cancelled"
            : ageDays > 10 && r > 0.45
              ? "completed"
              : "confirmed";
      const code =
        "LCD-" +
        Array.from({ length: 6 }, (_, k) =>
          CODE_ALPHABET[Math.floor(rand(`${seed}:c${k}`) * CODE_ALPHABET.length)],
        ).join("");
      const digits = String(Math.floor(rand(`${seed}:w`) * 1e9)).padStart(9, "0");

      rows.push({
        id: `dummy-${key}-${j}`,
        code,
        name,
        whatsapp: `62812${digits}`,
        email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@gmail.com`,
        product: "locard",
        qty,
        unit_price: DUMMY.unitPrice,
        dp_amount: DUMMY.dpPerUnit * qty,
        status,
        proof_key: null,
        proof_type: null,
        proof_size: null,
        note: null,
        created_at: new Date(at).toISOString(),
      });
    }
  }

  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Dummy trafik per menit (dipakai untuk grafik 30 menit & feed). */
function minuteTraffic(minuteIso: string) {
  const perMinPv = DUMMY.perDay.pageviews / 1440;
  const perMinCl = DUMMY.perDay.clicks / 1440;
  return {
    pageviews: bernoulli(6, perMinPv / 6, `${minuteIso}:pv`),
    clicks: bernoulli(2, perMinCl / 2, `${minuteIso}:cl`),
  };
}

// ------------------------------------------------------------
// Overlay: /admin/live
// ------------------------------------------------------------

export function withDummyLive(snap: LiveSnapshot, now = Date.now()): LiveSnapshot {
  if (!DUMMY.enabled) return snap;

  const orders = dummyOrders(now, Math.max(DUMMY.historyDays, snap.range.days));
  const inRange = orders.filter((o) => o.created_at >= snap.range.start);
  const ordersByDay = new Map<string, OrderRow[]>();
  for (const o of inRange) {
    const key = wibDayKey(Date.parse(o.created_at));
    ordersByDay.set(key, [...(ordersByDay.get(key) ?? []), o]);
  }
  const dpOf = (list: OrderRow[]) =>
    list.reduce((sum, o) => sum + (o.status === "cancelled" ? 0 : o.dp_amount), 0);

  // Harian
  const add: DayDummy & { orders: number; dp: number } = {
    pageviews: 0, visitors: 0, clicks: 0, clickers: 0, preorderVisitors: 0,
    qrisOpens: 0, proofUploads: 0, orders: 0, dp: 0,
  };
  const daily = snap.daily.map((row) => {
    const t = dayTraffic(row.key, now);
    const dayOrders = ordersByDay.get(row.key) ?? [];
    add.pageviews += t.pageviews;
    add.visitors += t.visitors;
    add.clicks += t.clicks;
    add.clickers += t.clickers;
    add.preorderVisitors += t.preorderVisitors;
    add.qrisOpens += t.qrisOpens;
    add.proofUploads += dayOrders.length;
    add.orders += dayOrders.length;
    add.dp += dpOf(dayOrders);
    return {
      ...row,
      pageviews: row.pageviews + t.pageviews,
      visitors: row.visitors + t.visitors,
      clicks: row.clicks + t.clicks,
      orders: row.orders + dayOrders.length,
      dp: row.dp + dpOf(dayOrders),
    };
  });

  const totals = {
    pageviews: snap.totals.pageviews + add.pageviews,
    visitors: snap.totals.visitors + add.visitors,
    clicks: snap.totals.clicks + add.clicks,
    clickers: snap.totals.clickers + add.clickers,
    preorderVisitors: snap.totals.preorderVisitors + add.preorderVisitors,
    qrisOpens: snap.totals.qrisOpens + add.qrisOpens,
    proofUploads: snap.totals.proofUploads + add.proofUploads,
    orders: snap.totals.orders + add.orders,
    dp: snap.totals.dp + add.dp,
  };

  // Grafik
  let series: LiveSnapshot["series"];
  const minuteIsos: string[] = [];
  if (snap.bucket === "minute") {
    series = snap.series.map((point, index) => {
      const iso = new Date(now - (snap.series.length - 1 - index) * MINUTE)
        .toISOString()
        .slice(0, 16);
      minuteIsos.push(iso);
      const m = minuteTraffic(iso);
      const ordersHere = inRange.filter((o) => o.created_at.slice(0, 16) === iso).length;
      return {
        ...point,
        pageviews: point.pageviews + m.pageviews,
        clicks: point.clicks + m.clicks,
        orders: point.orders + ordersHere,
      };
    });
  } else {
    series = daily.map((row) => ({
      label: row.label,
      pageviews: row.pageviews,
      clicks: row.clicks,
      orders: row.orders,
    }));
  }

  // Online sekarang
  const minuteSeed = new Date(now).toISOString().slice(0, 16);
  const online = {
    sessions: snap.online.sessions + vary(DUMMY.online.sessions, `${minuteSeed}:os`),
    pageviews: snap.online.pageviews + vary(DUMMY.online.pageviews, `${minuteSeed}:op`),
  };

  // Halaman & sumber teratas
  const pageMap = new Map(snap.topPages.map((p) => [p.path, p.views]));
  for (const { item, value } of splitByShare(DUMMY.pages, add.pageviews)) {
    pageMap.set(item.path, (pageMap.get(item.path) ?? 0) + value);
  }
  const sourceMap = new Map(snap.sources.map((s) => [s.source, s.views]));
  for (const { item, value } of splitByShare(DUMMY.sources, add.pageviews)) {
    sourceMap.set(item.source, (sourceMap.get(item.source) ?? 0) + value);
  }
  const topPages = [...pageMap]
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);
  const sources = [...sourceMap]
    .map(([source, views]) => ({ source, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  // Feed aktivitas (2 jam terakhir)
  const feedDummy: LiveEvent[] = [];
  for (let i = 0; i < 120; i += 1) {
    const at = now - i * MINUTE;
    const iso = new Date(at).toISOString().slice(0, 16);
    const m = minuteTraffic(iso);
    for (let k = 0; k < m.pageviews; k += 1) {
      const sec = Math.floor(rand(`${iso}:fs${k}`) * 60);
      feedDummy.push({
        id: `dummy-pv-${iso}-${k}`,
        type: "pageview",
        path: rand(`${iso}:fp${k}`) < DUMMY.pages[0].share ? DUMMY.pages[0].path : DUMMY.pages[1].path,
        label: null,
        country: "ID",
        meta: null,
        created_at: `${iso}:${String(sec).padStart(2, "0")}.000Z`,
      });
    }
    for (let k = 0; k < m.clicks; k += 1) {
      feedDummy.push({
        id: `dummy-cl-${iso}-${k}`,
        type: "cta_order",
        path: "/",
        label: null,
        country: "ID",
        meta: null,
        created_at: `${iso}:${String(30 + k).padStart(2, "0")}.000Z`,
      });
    }
  }
  for (const o of orders.filter((o) => Date.parse(o.created_at) > now - 120 * MINUTE)) {
    feedDummy.push({
      id: `dummy-order-${o.id}`,
      type: "order_created",
      path: "/preorder",
      label: o.code,
      country: "ID",
      meta: JSON.stringify({ code: o.code, dp: o.dp_amount }),
      created_at: o.created_at,
    });
  }
  const feed = [...snap.feed, ...feedDummy.filter((e) => Date.parse(e.created_at) <= now)]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 40);

  // Pembayaran terbaru
  const payments = [
    ...snap.payments,
    ...inRange.map((o) => ({
      code: o.code,
      name: o.name,
      qty: o.qty,
      dp: o.dp_amount,
      status: o.status,
      createdAt: o.created_at,
    })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12);

  return {
    ...snap,
    totals,
    online,
    series,
    daily,
    feed,
    funnel: [
      { key: "visit", label: "Kunjungan", value: totals.visitors },
      { key: "preorder", label: "Lihat pre-order", value: totals.preorderVisitors },
      { key: "click", label: "Klik Order", value: totals.clickers },
      { key: "order", label: "Pesanan masuk", value: totals.orders },
    ],
    topPages,
    sources,
    payments,
  };
}

// ------------------------------------------------------------
// Overlay: /admin (daftar pesanan)
// ------------------------------------------------------------

export function withDummyOrders(
  rows: OrderRow[],
  status?: string,
  limit = 200,
  now = Date.now(),
): OrderRow[] {
  if (!DUMMY.enabled) return rows;
  const filter = status && isOrderStatus(status) ? status : undefined;
  const extra = dummyOrders(now).filter((o) => !filter || o.status === filter);
  return [...rows, ...extra]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

export function withDummyOrderStats(stats: OrderStats, now = Date.now()): OrderStats {
  if (!DUMMY.enabled) return stats;
  const result = { ...stats };
  for (const o of dummyOrders(now)) {
    result.total += 1;
    if (o.status === "awaiting_confirmation") result.awaiting += 1;
    if (o.status === "confirmed") result.confirmed += 1;
    if (o.status === "completed") result.completed += 1;
    if (o.status === "cancelled") result.cancelled += 1;
    else result.dp += o.dp_amount;
  }
  return result;
}
