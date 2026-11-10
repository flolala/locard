"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import MapShell from "./map-shell";
import { COLOR_HEX } from "@/lib/colors";
import { formatDistance, relativeTime } from "@/lib/geo";
import type { DeviceView } from "@/lib/view";

export type AlertView = {
  id: string;
  device_id: string;
  type: string;
  title: string;
  body: string | null;
  created_at: string;
};

const JAKARTA = { lat: -6.2088, lng: 106.8456 };

export default function Dashboard({
  devices,
  alerts,
}: {
  devices: DeviceView[];
  alerts: AlertView[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(devices[0]?.id ?? null);
  const [busy, setBusy] = useState<string | null>(null);

  const selected = devices.find((d) => d.id === selectedId) ?? devices[0] ?? null;

  const center = useMemo(() => {
    if (selected?.last_lat != null && selected?.last_lng != null) {
      return { lat: selected.last_lat, lng: selected.last_lng };
    }
    return JAKARTA;
  }, [selected]);

  const alertsForDevice = alerts.filter((a) => a.device_id === selected?.id).slice(0, 6);

  async function simulate(device: DeviceView) {
    setBusy(device.id);
    await fetch(`/api/devices/${device.id}/simulate`, { method: "POST" });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="space-y-4">
        <AddDevice />

        <div className="space-y-2">
          <p className="px-1 text-[11px] tracking-[0.18em] text-ink-faint uppercase">
            {devices.length} perangkat
          </p>

          {devices.map((device) => {
            const active = device.id === selected?.id;
            return (
              <button
                key={device.id}
                onClick={() => setSelectedId(device.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-ink/20 bg-paper shadow-[0_12px_40px_-24px_rgba(20,17,15,0.5)]"
                    : "border-line bg-paper/60 hover:border-ink/15 hover:bg-paper"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: COLOR_HEX[device.color] ?? COLOR_HEX.gold }}
                    />
                    <div>
                      <p className="text-sm font-medium">{device.name}</p>
                      <p className="text-[11px] text-ink-faint">
                        {device.last_seen_at ? relativeTime(device.last_seen_at) : "Belum ada data"}
                      </p>
                    </div>
                  </div>
                  {device.lost_mode ? (
                    <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
                      Hilang
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center gap-4 text-[11px] text-ink-soft">
                  <span>
                    Baterai{" "}
                    <span className="font-medium text-ink">
                      {device.last_battery != null ? `${device.last_battery}%` : "—"}
                    </span>
                  </span>
                  <span>
                    Zona{" "}
                    <span className="font-medium text-ink">
                      {device.geofence
                        ? device.distanceToFence != null &&
                          device.distanceToFence <= device.geofence.radius_m
                          ? "Di dalam"
                          : "Di luar"
                        : "—"}
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-line bg-paper">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
            <div>
              <p className="text-[11px] tracking-[0.18em] text-ink-faint uppercase">
                Peta
              </p>
              <p className="text-sm font-medium">
                {selected ? selected.name : "Belum ada perangkat"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selected ? (
                <Link
                  href={`/app/devices/${selected.id}`}
                  className="rounded-full border border-line px-3.5 py-1.5 text-xs text-ink-soft transition hover:border-ink/25 hover:text-ink"
                >
                  Detail
                </Link>
              ) : null}
              {selected?.provider === "mock" ? (
                <button
                  onClick={() => simulate(selected)}
                  disabled={busy === selected.id}
                  className="rounded-full bg-ink px-3.5 py-1.5 text-xs font-medium text-paper transition hover:bg-ink/90 disabled:opacity-60"
                >
                  {busy === selected.id ? "Menggeser…" : "Simulasikan gerak"}
                </button>
              ) : null}
            </div>
          </div>

          <div className="h-[380px] w-full">
            <MapShell
              center={center}
              marker={
                selected?.last_lat != null && selected?.last_lng != null
                  ? {
                      lat: selected.last_lat,
                      lng: selected.last_lng,
                      color: COLOR_HEX[selected.color] ?? COLOR_HEX.gold,
                    }
                  : undefined
              }
              fence={selected?.geofence ?? undefined}
              zoom={selected?.last_lat != null ? 15 : 12}
            />
          </div>

          {selected ? (
            <div className="grid grid-cols-2 divide-x divide-line border-t border-line text-center sm:grid-cols-4">
              <Metric
                label="Terakhir"
                value={selected.last_seen_at ? relativeTime(selected.last_seen_at) : "—"}
              />
              <Metric
                label="Akurasi"
                value={
                  selected.last_accuracy != null
                    ? `${Math.round(selected.last_accuracy)} m`
                    : "—"
                }
              />
              <Metric
                label="Jarak zona"
                value={
                  selected.distanceToFence != null
                    ? formatDistance(selected.distanceToFence)
                    : "—"
                }
              />
              <Metric
                label="Sumber"
                value={selected.last_source ?? "—"}
              />
            </div>
          ) : null}
        </div>

        <div id="alerts" className="rounded-2xl border border-line bg-paper">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <p className="text-sm font-medium">Notifikasi</p>
            <span className="text-[11px] text-ink-faint">
              {alertsForDevice.length} terbaru
            </span>
          </div>
          <ul className="divide-y divide-line">
            {alertsForDevice.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-ink-faint">
                Belum ada notifikasi untuk perangkat ini.
              </li>
            ) : (
              alertsForDevice.map((alert) => (
                <li key={alert.id} className="flex gap-3 px-5 py-4">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  <div>
                    <p className="text-sm">{alert.title}</p>
                    {alert.body ? (
                      <p className="mt-0.5 text-xs text-ink-soft">{alert.body}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-ink-faint">
                      {relativeTime(alert.created_at)}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-3.5">
      <p className="text-[10px] tracking-[0.16em] text-ink-faint uppercase">{label}</p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}

function AddDevice() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(data.get("name") ?? ""),
        kind: String(data.get("kind") ?? "cardholder"),
        provider: String(data.get("provider") ?? "mock"),
        color: String(data.get("color") ?? "gold"),
      }),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      setError(json.error ?? "Gagal menambah perangkat.");
      setPending(false);
      return;
    }

    setPending(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-line bg-paper">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-medium"
      >
        Tambah perangkat
        <span className="text-lg leading-none text-ink-faint">{open ? "−" : "+"}</span>
      </button>

      {open ? (
        <form onSubmit={submit} className="space-y-3 border-t border-line px-5 py-4">
          <input
            name="name"
            required
            placeholder="Nama perangkat"
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-gold"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              name="kind"
              className="rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-gold"
            >
              <option value="cardholder">Card holder</option>
              <option value="tag">Tag</option>
              <option value="keys">Kunci</option>
              <option value="bag">Tas</option>
              <option value="other">Lainnya</option>
            </select>
            <select
              name="provider"
              className="rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-gold"
            >
              <option value="mock">Simulasi</option>
              <option value="webhook">Webhook</option>
              <option value="findhub">Find Hub</option>
            </select>
          </div>
          <div className="flex gap-2">
            {Object.entries(COLOR_HEX).map(([key, hex]) => (
              <label key={key} className="cursor-pointer">
                <input type="radio" name="color" value={key} className="peer sr-only" defaultChecked={key === "gold"} />
                <span
                  className="block h-6 w-6 rounded-full ring-offset-2 ring-offset-paper peer-checked:ring-2 peer-checked:ring-ink/40"
                  style={{ background: hex }}
                />
              </label>
            ))}
          </div>

          {error ? <p className="text-xs text-danger">{error}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-ink py-2.5 text-xs font-medium text-paper disabled:opacity-60"
          >
            {pending ? "Menyimpan…" : "Simpan perangkat"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
