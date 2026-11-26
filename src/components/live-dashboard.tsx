"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatIDR } from "@/lib/site";
import {
  EVENT_META,
  type EventTone,
  type LiveEvent,
  type LiveSnapshot,
} from "@/lib/track-shared";

const POLL_MS = 5000;
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

const TONE_DOT: Record<EventTone, string> = {
  visit: "bg-wine/30",
  click: "bg-wine",
  payment: "bg-success",
  system: "bg-ink-faint/60",
};

const STATUS_LABEL: Record<string, string> = {
  awaiting_confirmation: "Menunggu",
  confirmed: "Dikonfirmasi",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const STATUS_STYLE: Record<string, string> = {
  awaiting_confirmation: "bg-gold-wash text-wine",
  confirmed: "bg-wine/10 text-wine",
  completed: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function wibTime(iso: string) {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return "—";
  const date = new Date(time + JAKARTA_OFFSET_MS);
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

function ago(iso: string, nowMs: number) {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return "—";
  const seconds = Math.max(0, Math.round((nowMs - time) / 1000));
  if (seconds < 5) return "baru saja";
  if (seconds < 60) return `${seconds} dtk lalu`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mnt lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
  return `${Math.floor(seconds / 86400)} hari lalu`;
}

function parseMeta(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function eventDetail(event: LiveEvent) {
  const meta = parseMeta(event.meta);
  if (event.type === "order_created") {
    const code = typeof meta.code === "string" ? meta.code : event.label;
    const dp = typeof meta.dp === "number" ? formatIDR(meta.dp) : null;
    return [code, dp].filter(Boolean).join(" · ") || "—";
  }
  if (event.type === "submit_error" && event.label) return event.label;
  return [event.label, event.path].filter(Boolean).join(" · ") || "—";
}

export default function LiveDashboard({ initial }: { initial: LiveSnapshot }) {
  const [data, setData] = useState(initial);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (paused) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const pull = async () => {
      if (document.visibilityState === "hidden") {
        timer = setTimeout(pull, POLL_MS);
        return;
      }

      try {
        const response = await fetch("/api/admin/live", { cache: "no-store" });
        if (!response.ok) throw new Error("request failed");
        const snapshot = (await response.json()) as LiveSnapshot;
        if (!cancelled) {
          setData(snapshot);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }

      if (!cancelled) timer = setTimeout(pull, POLL_MS);
    };

    timer = setTimeout(pull, POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [paused]);

  const conversion =
    data.today.visitors > 0 ? (data.today.orders / data.today.visitors) * 100 : 0;
  const clock = wibTime(nowMs ? new Date(nowMs).toISOString() : data.generatedAt);
  const connection = paused ? "paused" : failed ? "error" : "live";

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Live dashboard</p>
          <h1 className="mt-2 font-display text-4xl">Aktivitas real-time</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
            Pantau pengunjung yang masuk ke situs, klik tombol Order, dan pembayaran
            DP saat kejadiannya berlangsung.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[10px] tracking-[0.16em] uppercase ${
              connection === "live"
                ? "border-success/25 bg-success/5 text-success"
                : connection === "paused"
                  ? "border-line bg-paper text-ink-faint"
                  : "border-danger/25 bg-danger/5 text-danger"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {connection === "live" ? (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              ) : null}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  connection === "live"
                    ? "bg-success"
                    : connection === "paused"
                      ? "bg-ink-faint"
                      : "bg-danger"
                }`}
              />
            </span>
            {connection === "live"
              ? "Live"
              : connection === "paused"
                ? "Dijeda"
                : "Menyambung ulang"}
          </span>

          <span className="rounded-full border border-line bg-paper px-3.5 py-2 font-mono text-[11px] text-ink-soft">
            {clock} WIB
          </span>

          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            className="rounded-full border border-line px-4 py-2 text-[10px] tracking-[0.14em] text-ink-soft uppercase transition hover:border-wine/30 hover:text-wine"
          >
            {paused ? "Lanjutkan" : "Jeda"}
          </button>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-wine px-4 py-2 text-[10px] tracking-[0.14em] text-cream uppercase transition hover:bg-wine-soft"
          >
            Buka situs
          </a>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          live
          label="Online sekarang"
          value={String(data.online.sessions)}
          hint={`${data.online.pageviews} halaman dibuka · 5 menit terakhir`}
        />
        <Stat
          label="Pengunjung hari ini"
          value={String(data.today.visitors)}
          hint={`${data.today.pageviews} kunjungan halaman`}
        />
        <Stat
          label="Klik tombol Order"
          value={String(data.today.clicks)}
          hint={`${data.today.clickers} pengunjung unik`}
        />
        <Stat
          label="Order masuk"
          value={String(data.today.orders)}
          hint={`Konversi ${conversion.toFixed(1)}% dari pengunjung`}
        />
        <Stat
          accent
          label="DP hari ini"
          value={formatIDR(data.today.dp)}
          hint="Total DP dari pesanan hari ini"
        />
        <Stat
          label="Lihat pre-order"
          value={String(data.today.preorderVisitors)}
          hint="Pengunjung unik ke /preorder"
        />
        <Stat
          label="QRIS dibuka"
          value={String(data.today.qrisOpens)}
          hint="Klik pada poster QRIS"
        />
        <Stat
          label="Bukti DP diunggah"
          value={String(data.today.proofUploads)}
          hint="Event unggah bukti transfer"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Panel
          title="Aktivitas 30 menit terakhir"
          hint="Per menit · WIB · auto-refresh 5 detik"
        >
          <ActivityChart series={data.series} />
        </Panel>

        <Panel
          title="Event terbaru"
          hint={`${data.feed.length} event terakhir`}
          action={
            <span className="text-[10px] tracking-[0.12em] text-ink-faint uppercase">
              Streaming
            </span>
          }
        >
          <EventFeed events={data.feed} nowMs={nowMs} />
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_1fr_1fr]">
        <Panel title="Corong hari ini" hint="Pengunjung unik → pesanan">
          <Funnel steps={data.funnel} />
        </Panel>

        <Panel title="Halaman terpopuler" hint="Hari ini">
          <RankedList
            items={data.topPages.map((page) => ({
              label: page.path,
              value: page.views,
            }))}
            empty="Belum ada kunjungan hari ini."
          />
        </Panel>

        <Panel title="Sumber trafik" hint="Hari ini">
          <RankedList
            items={data.sources.map((source) => ({
              label: source.source,
              value: source.views,
            }))}
            empty="Belum ada data sumber."
          />
        </Panel>
      </section>

      <Panel
        title="Pembayaran DP hari ini"
        hint={`${data.today.orders} pesanan · ${formatIDR(data.today.dp)}`}
        action={
          <Link
            href="/admin"
            className="rounded-full border border-line px-3.5 py-1.5 text-[10px] tracking-[0.12em] text-ink-soft uppercase transition hover:border-wine/30 hover:text-wine"
          >
            Semua pesanan →
          </Link>
        }
      >
        {data.payments.length === 0 ? (
          <Empty>Belum ada pembayaran DP yang masuk hari ini.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[9px] tracking-[0.14em] text-ink-faint uppercase">
                  <th className="py-2 pr-4 font-normal">Kode</th>
                  <th className="px-3 py-2 font-normal">Pelanggan</th>
                  <th className="px-3 py-2 text-right font-normal">Qty</th>
                  <th className="px-3 py-2 text-right font-normal">DP</th>
                  <th className="px-3 py-2 font-normal">Status</th>
                  <th className="py-2 pl-3 text-right font-normal">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {data.payments.map((payment) => (
                  <tr key={payment.code}>
                    <td className="py-2.5 pr-4 font-mono text-[11px]">{payment.code}</td>
                    <td className="px-3 py-2.5 text-[12px]">{payment.name}</td>
                    <td className="px-3 py-2.5 text-right text-[12px]">{payment.qty}</td>
                    <td className="px-3 py-2.5 text-right text-[12px] text-wine">
                      {formatIDR(payment.dp)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-medium ${
                          STATUS_STYLE[payment.status] ?? "bg-paper-dim text-ink-soft"
                        }`}
                      >
                        {STATUS_LABEL[payment.status] ?? payment.status}
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-right text-[10px] text-ink-faint">
                      {wibTime(payment.createdAt)} WIB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="text-[10px] leading-relaxed text-ink-faint">
        Data dari tabel <span className="font-mono">events</span> dan{" "}
        <span className="font-mono">orders</span> di Cloudflare D1. ID sesi dibuat acak
        dan anonim — tanpa cookie iklan dan tanpa menyimpan alamat IP. Semua waktu WIB
        (UTC+7).
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  accent,
  live,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  live?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent ? "border-wine/25 bg-wine/[0.04]" : "border-line bg-paper"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] tracking-[0.16em] text-ink-faint uppercase">{label}</p>
        {live ? (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
        ) : null}
      </div>
      <p
        className={`mt-2 font-display text-[2rem] leading-none ${
          accent ? "text-wine" : "text-ink"
        }`}
      >
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-[10px] leading-relaxed text-ink-faint">{hint}</p> : null}
    </div>
  );
}

function Panel({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-paper">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
        <div>
          <p className="text-[11px] font-medium">{title}</p>
          {hint ? <p className="text-[10px] text-ink-faint">{hint}</p> : null}
        </div>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function ActivityChart({ series }: { series: LiveSnapshot["series"] }) {
  const max = Math.max(
    1,
    ...series.map((point) => point.pageviews + point.clicks + point.orders),
  );
  const height = 128;

  return (
    <div>
      <div className="flex h-32 items-end gap-[3px]">
        {series.map((point, index) => {
          const total = point.pageviews + point.clicks + point.orders;
          return (
            <div
              key={`${point.label}-${index}`}
              className="group relative flex h-full flex-1 flex-col justify-end"
              title={`${point.label} — ${point.pageviews} kunjungan · ${point.clicks} klik · ${point.orders} order`}
            >
              {point.orders > 0 ? (
                <span
                  className="w-full rounded-t-[2px] bg-success"
                  style={{ height: Math.max(2, (point.orders / max) * height) }}
                />
              ) : null}
              {point.clicks > 0 ? (
                <span
                  className="w-full bg-wine"
                  style={{ height: Math.max(2, (point.clicks / max) * height) }}
                />
              ) : null}
              {point.pageviews > 0 ? (
                <span
                  className="w-full rounded-t-[2px] bg-wine/20 transition group-hover:bg-wine/30"
                  style={{ height: Math.max(2, (point.pageviews / max) * height) }}
                />
              ) : null}
              {total === 0 ? <span className="h-[2px] w-full bg-line/60" /> : null}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-[9px] text-ink-faint">
        <span>{series[0]?.label}</span>
        <span>{series[Math.floor(series.length / 2)]?.label}</span>
        <span>{series[series.length - 1]?.label}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-ink-faint">
        <Legend className="bg-wine/20" label="Kunjungan" />
        <Legend className="bg-wine" label="Klik Order" />
        <Legend className="bg-success" label="Order" />
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-[2px] ${className}`} />
      {label}
    </span>
  );
}

function EventFeed({ events, nowMs }: { events: LiveEvent[]; nowMs: number | null }) {
  if (events.length === 0) {
    return (
      <Empty>
        Belum ada aktivitas. Buka situs di tab lain — kunjungan dan klik akan muncul
        di sini secara otomatis.
      </Empty>
    );
  }

  return (
    <ul className="max-h-[360px] space-y-0 overflow-y-auto pr-1">
      {events.map((event) => {
        const meta = EVENT_META[event.type] ?? { label: event.type, tone: "system" as EventTone };
        return (
          <li
            key={event.id}
            className="flex items-start gap-3 border-b border-line/60 py-2.5 last:border-0"
          >
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[meta.tone]}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] leading-snug font-medium">{meta.label}</p>
              <p className="truncate text-[11px] text-ink-faint">{eventDetail(event)}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-ink-faint">
                {nowMs ? ago(event.created_at, nowMs) : wibTime(event.created_at)}
              </p>
              {event.country ? (
                <p className="text-[9px] tracking-[0.1em] text-ink-faint/70 uppercase">
                  {event.country}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Funnel({ steps }: { steps: LiveSnapshot["funnel"] }) {
  const base = Math.max(1, steps[0]?.value ?? 0);

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const ratio = step.value / base;
        return (
          <div key={step.key}>
            <div className="flex items-baseline justify-between gap-2 text-[11px]">
              <span className="text-ink-soft">{step.label}</span>
              <span className="font-medium">
                {step.value}
                <span className="ml-1.5 text-[10px] font-normal text-ink-faint">
                  {Math.round(ratio * 100)}%
                </span>
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-dim">
              <div
                className="h-full rounded-full bg-wine transition-[width] duration-700"
                style={{
                  width: `${step.value > 0 ? Math.max(3, ratio * 100) : 0}%`,
                  opacity: 1 - index * 0.16,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RankedList({
  items,
  empty,
}: {
  items: Array<{ label: string; value: number }>;
  empty: string;
}) {
  if (items.length === 0) return <Empty>{empty}</Empty>;

  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-[11px]">
            <span className="truncate text-ink-soft">{item.label}</span>
            <span className="shrink-0 text-[10px] text-ink-faint">{item.value}</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-paper-dim">
            <div
              className="h-full rounded-full bg-wine/40"
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-line bg-paper-dim/30 px-4 py-8 text-center text-[12px] leading-relaxed text-ink-faint">
      {children}
    </p>
  );
}
