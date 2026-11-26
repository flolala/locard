/**
 * Tipe & label event analytics yang dipakai bersama oleh client tracker,
 * API, dan dashboard live. File ini TIDAK boleh mengimpor server-only.
 */

export const TRACK_TYPES = [
  "pageview",
  "cta_order",
  "cta_whatsapp",
  "qris_open",
  "proof_uploaded",
  "submit_attempt",
  "submit_error",
  "order_created",
  "wa_confirm",
  "order_status",
] as const;

export type TrackEventType = (typeof TRACK_TYPES)[number];

export function isTrackEventType(value: string): value is TrackEventType {
  return (TRACK_TYPES as readonly string[]).includes(value);
}

export type EventTone = "visit" | "click" | "payment" | "system";

export const EVENT_META: Record<string, { label: string; tone: EventTone }> = {
  pageview: { label: "Kunjungan halaman", tone: "visit" },
  cta_order: { label: "Klik tombol Order", tone: "click" },
  cta_whatsapp: { label: "Klik WhatsApp", tone: "click" },
  qris_open: { label: "Buka poster QRIS", tone: "payment" },
  proof_uploaded: { label: "Unggah bukti DP", tone: "payment" },
  submit_attempt: { label: "Kirim formulir", tone: "click" },
  submit_error: { label: "Formulir gagal", tone: "system" },
  order_created: { label: "Pesanan masuk", tone: "payment" },
  wa_confirm: { label: "Konfirmasi WhatsApp", tone: "click" },
  order_status: { label: "Status pesanan berubah", tone: "system" },
};

export type LiveEvent = {
  id: string;
  type: string;
  path: string | null;
  label: string | null;
  country: string | null;
  meta: string | null;
  created_at: string;
};

export const LIVE_RANGES = ["today", "7d", "30d"] as const;

export type LiveRangeKey = (typeof LIVE_RANGES)[number];

export function isLiveRangeKey(value: string): value is LiveRangeKey {
  return (LIVE_RANGES as readonly string[]).includes(value);
}

export type LiveDailyRow = {
  key: string;
  label: string;
  pageviews: number;
  visitors: number;
  clicks: number;
  orders: number;
  dp: number;
};

export type LiveSnapshot = {
  generatedAt: string;
  range: {
    key: LiveRangeKey;
    label: string;
    days: number;
    start: string;
  };
  bucket: "minute" | "day";
  totals: {
    pageviews: number;
    visitors: number;
    clicks: number;
    clickers: number;
    preorderVisitors: number;
    qrisOpens: number;
    proofUploads: number;
    orders: number;
    dp: number;
  };
  online: {
    sessions: number;
    pageviews: number;
  };
  series: Array<{
    label: string;
    pageviews: number;
    clicks: number;
    orders: number;
  }>;
  daily: LiveDailyRow[];
  feed: LiveEvent[];
  funnel: Array<{ key: string; label: string; value: number }>;
  topPages: Array<{ path: string; views: number }>;
  sources: Array<{ source: string; views: number }>;
  payments: Array<{
    code: string;
    name: string;
    qty: number;
    dp: number;
    status: string;
    createdAt: string;
  }>;
};
