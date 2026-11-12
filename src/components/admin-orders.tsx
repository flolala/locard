"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDateTime } from "@/lib/geo";
import { formatIDR } from "@/lib/site";
import type { OrderRow, OrderStats } from "@/lib/orders";

const STATUS_LABEL: Record<string, string> = {
  awaiting_confirmation: "Menunggu konfirmasi",
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

const FILTERS = [
  { id: "", label: "Semua" },
  { id: "awaiting_confirmation", label: "Menunggu" },
  { id: "confirmed", label: "Dikonfirmasi" },
  { id: "completed", label: "Selesai" },
  { id: "cancelled", label: "Dibatalkan" },
];

export default function AdminOrders({
  orders,
  stats,
  status,
  analyticsUrl,
}: {
  orders: OrderRow[];
  stats: OrderStats;
  status?: string;
  analyticsUrl: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(code: string, next: string) {
    setBusy(code);
    await fetch(`/api/admin/orders/${code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(null);
    router.refresh();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-2 font-display text-4xl">Pesanan & kunjungan</h1>
          <p className="mt-2 max-w-lg text-sm text-ink-soft">
            Semua pre-order yang masuk, bukti transfer, dan tautan ke statistik
            pengunjung.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-full border border-line px-4 py-2 text-[11px] tracking-[0.14em] text-ink-soft uppercase transition hover:border-wine/30 hover:text-wine"
          >
            Lihat situs
          </Link>
          <button
            onClick={logout}
            className="rounded-full border border-line px-4 py-2 text-[11px] tracking-[0.14em] text-ink-soft uppercase transition hover:border-danger/30 hover:text-danger"
          >
            Keluar
          </button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total pesanan" value={String(stats.total)} />
        <Stat label="Menunggu konfirmasi" value={String(stats.awaiting)} accent />
        <Stat label="Dikonfirmasi" value={String(stats.confirmed)} />
        <Stat label="DP terkumpul" value={formatIDR(stats.dp)} />
      </section>

      <section className="rounded-2xl border border-line bg-paper">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => {
              const active = (status ?? "") === f.id;
              return (
                <Link
                  key={f.id || "all"}
                  href={f.id ? `/admin?status=${f.id}` : "/admin"}
                  className={`rounded-full px-3.5 py-1.5 text-[11px] tracking-[0.1em] uppercase transition ${
                    active
                      ? "bg-wine text-cream"
                      : "text-ink-soft hover:bg-paper-dim"
                  }`}
                >
                  {f.label}
                </Link>
              );
            })}
          </div>

          <a
            href={`/api/admin/orders/export${status ? `?status=${status}` : ""}`}
            className="rounded-full border border-line px-3.5 py-1.5 text-[11px] tracking-[0.1em] text-ink-soft uppercase transition hover:border-wine/30 hover:text-wine"
          >
            Ekspor CSV
          </a>
        </div>

        {orders.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-xl">Belum ada pesanan</p>
            <p className="mt-2 text-sm text-ink-soft">
              Pesanan dari halaman pre-order akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[10px] tracking-[0.14em] text-ink-faint uppercase">
                  <th className="px-5 py-3 font-normal">Kode</th>
                  <th className="px-3 py-3 font-normal">Pelanggan</th>
                  <th className="px-3 py-3 font-normal">Produk</th>
                  <th className="px-3 py-3 font-normal text-right">Qty</th>
                  <th className="px-3 py-3 font-normal text-right">Total</th>
                  <th className="px-3 py-3 font-normal text-right">DP</th>
                  <th className="px-3 py-3 font-normal">Status</th>
                  <th className="px-5 py-3 font-normal">Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((order) => (
                  <tr key={order.id} className="align-top transition hover:bg-paper-dim/40">
                    <td className="px-5 py-4">
                      <p className="font-mono text-[12px]">{order.code}</p>
                      <p className="mt-1 text-[10px] text-ink-faint">
                        {formatDateTime(order.created_at)}
                      </p>
                    </td>

                    <td className="px-3 py-4">
                      <p className="font-medium">{order.name}</p>
                      <a
                        href={`https://wa.me/${order.whatsapp}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-wine underline-offset-2 hover:underline"
                      >
                        {order.whatsapp}
                      </a>
                      <p className="text-[11px] text-ink-faint">{order.email}</p>
                    </td>

                    <td className="px-3 py-4 text-[12px]">
                      {order.product === "locard" ? "LOCARD" : "Jasa Pemasangan"}
                    </td>

                    <td className="px-3 py-4 text-right text-[12px]">{order.qty}</td>
                    <td className="px-3 py-4 text-right text-[12px]">
                      {formatIDR(order.unit_price * order.qty)}
                    </td>
                    <td className="px-3 py-4 text-right text-[12px] text-wine">
                      {order.dp_amount > 0 ? formatIDR(order.dp_amount) : "—"}
                    </td>

                    <td className="px-3 py-4">
                      <select
                        value={order.status}
                        disabled={busy === order.code}
                        onChange={(e) => setStatus(order.code, e.target.value)}
                        className={`rounded-full border-0 px-2.5 py-1 text-[11px] font-medium outline-none ${
                          STATUS_STYLE[order.status] ?? "bg-paper-dim text-ink-soft"
                        }`}
                      >
                        {Object.entries(STATUS_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-5 py-4">
                      {order.proof_key ? (
                        <a
                          href={`/api/admin/proof/${order.code}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-wine underline underline-offset-2"
                        >
                          Lihat
                        </a>
                      ) : (
                        <span className="text-[11px] text-ink-faint">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-paper-dim/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Statistik pengunjung</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
              Kunjungan, halaman populer, dan sumber trafik dipantau lewat
              Cloudflare Web Analytics — tanpa cookie dan tanpa memperlambat situs.
            </p>
          </div>
          <a
            href={analyticsUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-wine px-6 py-3 text-[11px] tracking-[0.16em] text-cream uppercase transition hover:bg-wine-soft"
          >
            Buka dashboard →
          </a>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent ? "border-wine/25 bg-wine/[0.04]" : "border-line bg-paper"
      }`}
    >
      <p className="text-[10px] tracking-[0.16em] text-ink-faint uppercase">{label}</p>
      <p className={`mt-2 font-display text-3xl ${accent ? "text-wine" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}
