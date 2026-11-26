import "server-only";

import { all, first } from "./db";
import type {
  LiveDailyRow,
  LiveEvent,
  LiveRangeKey,
  LiveSnapshot,
} from "./track-shared";

/** WIB (UTC+7) tanpa DST. */
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

const RANGES: Record<LiveRangeKey, { days: number; label: string }> = {
  today: { days: 1, label: "hari ini" },
  "7d": { days: 7, label: "7 hari terakhir" },
  "30d": { days: 30, label: "30 hari terakhir" },
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

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

/** Kunci tanggal WIB ("YYYY-MM-DD") dari timestamp yang mewakili 00:00 WIB. */
function wibDayKey(ms: number) {
  const date = new Date(ms + JAKARTA_OFFSET_MS);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;
}

function dayLabel(key: string) {
  const [, month, day] = key.split("-").map(Number);
  return `${day} ${MONTHS[(month ?? 1) - 1]}`;
}

type TotalsRow = {
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

type DailyEventsRow = {
  day: string;
  pageviews: number;
  visitors: number;
  clicks: number;
};

type DailyOrdersRow = { day: string; orders: number; dp: number };

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

export async function getLiveSnapshot(
  rangeKey: LiveRangeKey = "today",
  now = Date.now(),
): Promise<LiveSnapshot> {
  const range = RANGES[rangeKey] ?? RANGES.today;
  const generatedAt = new Date(now).toISOString();
  const dayStart = jakartaDayStart(now);
  const start = new Date(
    Date.parse(dayStart) - (range.days - 1) * DAY,
  ).toISOString();
  const fiveMinutesAgo = new Date(now - 5 * MINUTE).toISOString();
  const thirtyMinutesAgo = new Date(now - 30 * MINUTE).toISOString();

  const [
    totalsRow,
    ordersRow,
    onlineRow,
    seriesRows,
    dailyEventRows,
    dailyOrderRows,
    feed,
    topPages,
    sources,
    payments,
  ] = await Promise.all([
    first<TotalsRow>(
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
      [start],
    ),
    first<OrdersRow>(
      `SELECT
         COUNT(*) AS orders,
         COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN dp_amount ELSE 0 END), 0) AS dp
       FROM orders
       WHERE created_at >= ?`,
      [start],
    ),
    first<OnlineRow>(
      `SELECT
         COUNT(DISTINCT session_id) AS sessions,
         COALESCE(SUM(CASE WHEN type = 'pageview' THEN 1 ELSE 0 END), 0) AS pageviews
       FROM events
       WHERE created_at >= ?`,
      [fiveMinutesAgo],
    ),
    rangeKey === "today"
      ? all<SeriesRow>(
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
        )
      : Promise.resolve([]),
    all<DailyEventsRow>(
      `SELECT
         date(created_at, '+7 hours') AS day,
         COALESCE(SUM(CASE WHEN type = 'pageview' THEN 1 ELSE 0 END), 0) AS pageviews,
         COUNT(DISTINCT CASE WHEN type = 'pageview' THEN visitor_id END) AS visitors,
         COALESCE(SUM(CASE WHEN type = 'cta_order' THEN 1 ELSE 0 END), 0) AS clicks
       FROM events
       WHERE created_at >= ?
       GROUP BY day
       ORDER BY day`,
      [start],
    ),
    all<DailyOrdersRow>(
      `SELECT
         date(created_at, '+7 hours') AS day,
         COUNT(*) AS orders,
         COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN dp_amount ELSE 0 END), 0) AS dp
       FROM orders
       WHERE created_at >= ?
       GROUP BY day
       ORDER BY day`,
      [start],
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
      [start],
    ),
    all<SourceRow>(
      `SELECT COALESCE(NULLIF(referrer, ''), 'Langsung') AS source, COUNT(*) AS views
       FROM events
       WHERE type = 'pageview' AND created_at >= ?
       GROUP BY source
       ORDER BY views DESC
       LIMIT 6`,
      [start],
    ),
    all<PaymentRow>(
      `SELECT code, name, qty, dp_amount AS dp, status, created_at
       FROM orders
       WHERE created_at >= ?
       ORDER BY created_at DESC
       LIMIT 12`,
      [start],
    ),
  ]);

  const dailyEvents = new Map(dailyEventRows.map((row) => [row.day, row]));
  const dailyOrders = new Map(dailyOrderRows.map((row) => [row.day, row]));

  const daily: LiveDailyRow[] = [];
  const dayStartMs = Date.parse(dayStart);
  for (let i = range.days - 1; i >= 0; i -= 1) {
    const ms = dayStartMs - i * DAY;
    const key = wibDayKey(ms);
    const eventsRow = dailyEvents.get(key);
    const ordersDay = dailyOrders.get(key);
    daily.push({
      key,
      label: dayLabel(key),
      pageviews: Number(eventsRow?.pageviews ?? 0),
      visitors: Number(eventsRow?.visitors ?? 0),
      clicks: Number(eventsRow?.clicks ?? 0),
      orders: Number(ordersDay?.orders ?? 0),
      dp: Number(ordersDay?.dp ?? 0),
    });
  }

  let series: LiveSnapshot["series"];
  if (rangeKey === "today") {
    const byBucket = new Map(seriesRows.map((row) => [row.bucket, row]));
    series = [];
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
  } else {
    series = daily.map((row) => ({
      label: row.label,
      pageviews: row.pageviews,
      clicks: row.clicks,
      orders: row.orders,
    }));
  }

  const totals = {
    pageviews: Number(totalsRow?.pageviews ?? 0),
    visitors: Number(totalsRow?.visitors ?? 0),
    clicks: Number(totalsRow?.clicks ?? 0),
    clickers: Number(totalsRow?.clickers ?? 0),
    preorderVisitors: Number(totalsRow?.preorder_visitors ?? 0),
    qrisOpens: Number(totalsRow?.qris_opens ?? 0),
    proofUploads: Number(totalsRow?.proof_uploads ?? 0),
    orders: Number(ordersRow?.orders ?? 0),
    dp: Number(ordersRow?.dp ?? 0),
  };

  return {
    generatedAt,
    range: {
      key: rangeKey,
      label: range.label,
      days: range.days,
      start,
    },
    bucket: rangeKey === "today" ? "minute" : "day",
    totals,
    online: {
      sessions: Number(onlineRow?.sessions ?? 0),
      pageviews: Number(onlineRow?.pageviews ?? 0),
    },
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
