import "server-only";

import { all, first } from "./db";
import type { LiveEvent, LiveSnapshot } from "./track-shared";

/** WIB (UTC+7) tanpa DST. */
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const MINUTE = 60 * 1000;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** Awal hari ini menurut WIB, dikembalikan sebagai ISO UTC untuk perbandingan string. */
export function jakartaDayStart(now = Date.now()): string {
  const shifted = new Date(now + JAKARTA_OFFSET_MS);
  return new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
    ) - JAKARTA_OFFSET_MS,
  ).toISOString();
}

function wibLabel(iso: string) {
  const date = new Date(iso);
  const shifted = new Date(date.getTime() + JAKARTA_OFFSET_MS);
  return `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
}

type TodayRow = {
  pageviews: number;
  visitors: number;
  clicks: number;
  clickers: number;
  preorder_visitors: number;
  qris_opens: number;
  proof_uploads: number;
};

type OrdersRow = { orders: number; dp: number };

type OnlineRow = { sessions: number; pageviews: number };

type SeriesRow = {
  bucket: string;
  pageviews: number;
  clicks: number;
  orders: number;
};

type PageRow = { path: string; views: number };
type SourceRow = { source: string; views: number };
type PaymentRow = {
  code: string;
  name: string;
  qty: number;
  dp: number;
  status: string;
  created_at: string;
};

export async function getLiveSnapshot(now = Date.now()): Promise<LiveSnapshot> {
  const nowIso = new Date(now).toISOString();
  const dayStart = jakartaDayStart(now);
  const fiveMinutesAgo = new Date(now - 5 * MINUTE).toISOString();
  const thirtyMinutesAgo = new Date(now - 30 * MINUTE).toISOString();

  const [todayRow, ordersRow, onlineRow, seriesRows, feed, topPages, sources, payments] =
    await Promise.all([
      first<TodayRow>(
        `SELECT
           COALESCE(SUM(CASE WHEN type = 'pageview' THEN 1 ELSE 0 END), 0) AS pageviews,
           COUNT(DISTINCT CASE WHEN type = 'pageview' THEN visitor_id END) AS visitors,
           COALESCE(SUM(CASE WHEN type = 'cta_order' THEN 1 ELSE 0 END), 0) AS clicks,
           COUNT(DISTINCT CASE WHEN type = 'cta_order' THEN visitor_id END) AS clickers,
           COUNT(DISTINCT CASE WHEN type = 'pageview' AND path LIKE '/preorder%'
             THEN visitor_id END) AS preorder_visitors,
           COALESCE(SUM(CASE WHEN type = 'qris_open' THEN 1 ELSE 0 END), 0) AS qris_opens,
           COALESCE(SUM(CASE WHEN type = 'proof_uploaded' THEN 1 ELSE 0 END), 0) AS proof_uploads
         FROM events
         WHERE created_at >= ?`,
        [dayStart],
      ),
      first<OrdersRow>(
        `SELECT
           COUNT(*) AS orders,
           COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN dp_amount ELSE 0 END), 0) AS dp
         FROM orders
         WHERE created_at >= ?`,
        [dayStart],
      ),
      first<OnlineRow>(
        `SELECT
           COUNT(DISTINCT session_id) AS sessions,
           COALESCE(SUM(CASE WHEN type = 'pageview' THEN 1 ELSE 0 END), 0) AS pageviews
         FROM events
         WHERE created_at >= ?`,
        [fiveMinutesAgo],
      ),
      all<SeriesRow>(
        `SELECT
           substr(created_at, 1, 16) AS bucket,
           COALESCE(SUM(CASE WHEN type = 'pageview' THEN 1 ELSE 0 END), 0) AS pageviews,
           COALESCE(SUM(CASE WHEN type = 'cta_order' THEN 1 ELSE 0 END), 0) AS clicks,
           COALESCE(SUM(CASE WHEN type = 'order_created' THEN 1 ELSE 0 END), 0) AS orders
         FROM events
         WHERE created_at >= ?
         GROUP BY bucket
         ORDER BY bucket`,
        [thirtyMinutesAgo],
      ),
      all<LiveEvent>(
        `SELECT id, type, path, label, country, meta, created_at
         FROM events
         ORDER BY created_at DESC
         LIMIT 40`,
      ),
      all<PageRow>(
        `SELECT path, COUNT(*) AS views
         FROM events
         WHERE type = 'pageview' AND created_at >= ? AND path IS NOT NULL
         GROUP BY path
         ORDER BY views DESC
         LIMIT 6`,
        [dayStart],
      ),
      all<SourceRow>(
        `SELECT COALESCE(NULLIF(referrer, ''), 'Langsung') AS source, COUNT(*) AS views
         FROM events
         WHERE type = 'pageview' AND created_at >= ?
         GROUP BY source
         ORDER BY views DESC
         LIMIT 6`,
        [dayStart],
      ),
      all<PaymentRow>(
        `SELECT code, name, qty, dp_amount AS dp, status, created_at
         FROM orders
         WHERE created_at >= ?
         ORDER BY created_at DESC
         LIMIT 8`,
        [dayStart],
      ),
    ]);

  const byBucket = new Map(seriesRows.map((row) => [row.bucket, row]));
  const series: LiveSnapshot["series"] = [];
  for (let i = 29; i >= 0; i -= 1) {
    const point = new Date(now - i * MINUTE);
    const bucket = point.toISOString().slice(0, 16);
    const row = byBucket.get(bucket);
    series.push({
      label: wibLabel(point.toISOString()),
      pageviews: Number(row?.pageviews ?? 0),
      clicks: Number(row?.clicks ?? 0),
      orders: Number(row?.orders ?? 0),
    });
  }

  const today = {
    pageviews: Number(todayRow?.pageviews ?? 0),
    visitors: Number(todayRow?.visitors ?? 0),
    clicks: Number(todayRow?.clicks ?? 0),
    clickers: Number(todayRow?.clickers ?? 0),
    preorderVisitors: Number(todayRow?.preorder_visitors ?? 0),
    qrisOpens: Number(todayRow?.qris_opens ?? 0),
    proofUploads: Number(todayRow?.proof_uploads ?? 0),
    orders: Number(ordersRow?.orders ?? 0),
    dp: Number(ordersRow?.dp ?? 0),
  };

  return {
    generatedAt: nowIso,
    today,
    online: {
      sessions: Number(onlineRow?.sessions ?? 0),
      pageviews: Number(onlineRow?.pageviews ?? 0),
    },
    series,
    feed,
    funnel: [
      { key: "visit", label: "Kunjungan", value: today.visitors },
      { key: "preorder", label: "Lihat pre-order", value: today.preorderVisitors },
      { key: "click", label: "Klik Order", value: today.clickers },
      { key: "order", label: "Pesanan masuk", value: today.orders },
    ],

    topPages,
    sources,
    payments: payments.map((row) => ({
      code: row.code,
      name: row.name,
      qty: Number(row.qty),
      dp: Number(row.dp),
      status: row.status,
      createdAt: row.created_at,
    })),
  };
}
