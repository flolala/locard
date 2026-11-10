"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DeviceView } from "@/lib/view";

export default function DeviceControls({ device }: { device: DeviceView }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const ingestUrl = `${origin}/api/ingest/${device.api_key}`;
  const shareUrl = `${origin}/f/${device.share_slug}`;

  async function command(type: string, label: string) {
    setBusy(type);
    setMessage(null);
    const response = await fetch(`/api/devices/${device.id}/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    setBusy(null);
    setMessage(response.ok ? label : "Perintah gagal dikirim.");
    router.refresh();
  }

  async function simulate() {
    setBusy("simulate");
    await fetch(`/api/devices/${device.id}/simulate`, { method: "POST" });
    setBusy(null);
    router.refresh();
  }

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  }

  async function saveGeofence(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("geofence");
    const data = new FormData(event.currentTarget);

    const response = await fetch(`/api/devices/${device.id}/geofence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(data.get("name") ?? ""),
        lat: Number(data.get("lat")),
        lng: Number(data.get("lng")),
        radius_m: Number(data.get("radius_m")),
      }),
    });

    setBusy(null);
    setMessage(response.ok ? "Zona aman disimpan." : "Gagal menyimpan zona.");
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Hapus ${device.name}? Riwayat lokasi ikut terhapus.`)) return;
    setBusy("delete");
    await fetch(`/api/devices/${device.id}`, { method: "DELETE" });
    router.push("/app");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-paper p-5">
        <p className="text-[11px] tracking-[0.18em] text-ink-faint uppercase">Kontrol</p>

        <div className="mt-3 grid gap-2">
          <button
            onClick={() => command("ring", "Alarm dikirim ke perangkat.")}
            disabled={busy !== null}
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/90 disabled:opacity-60"
          >
            {busy === "ring" ? "Mengirim…" : "Bunyikan alarm"}
          </button>

          <button
            onClick={() =>
              command(
                device.lost_mode ? "lost_off" : "lost_on",
                device.lost_mode ? "Mode hilang dimatikan." : "Mode hilang aktif.",
              )
            }
            disabled={busy !== null}
            className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:opacity-60 ${
              device.lost_mode
                ? "border-line text-ink-soft hover:border-ink/25 hover:text-ink"
                : "border-danger/25 bg-danger/5 text-danger hover:bg-danger/10"
            }`}
          >
            {busy === "lost_on" || busy === "lost_off"
              ? "Memproses…"
              : device.lost_mode
                ? "Matikan mode hilang"
                : "Aktifkan mode hilang"}
          </button>

          {device.provider === "mock" ? (
            <button
              onClick={simulate}
              disabled={busy !== null}
              className="rounded-xl border border-line px-4 py-2.5 text-sm text-ink-soft transition hover:border-ink/25 hover:text-ink disabled:opacity-60"
            >
              {busy === "simulate" ? "Menggeser…" : "Simulasikan gerakan"}
            </button>
          ) : null}
        </div>

        {message ? (
          <p className="mt-3 rounded-lg bg-paper-dim px-3 py-2 text-xs text-ink-soft">
            {message}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-line bg-paper p-5">
        <p className="text-[11px] tracking-[0.18em] text-ink-faint uppercase">
          Zona aman
        </p>
        <form onSubmit={saveGeofence} className="mt-3 space-y-2.5">
          <input
            name="name"
            defaultValue={device.geofence?.name ?? "Kantor"}
            placeholder="Nama zona"
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-gold"
          />
          <div className="grid grid-cols-2 gap-2.5">
            <input
              name="lat"
              type="number"
              step="any"
              required
              defaultValue={device.geofence?.lat ?? device.last_lat ?? -6.2088}
              placeholder="Latitude"
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-gold"
            />
            <input
              name="lng"
              type="number"
              step="any"
              required
              defaultValue={device.geofence?.lng ?? device.last_lng ?? 106.8456}
              placeholder="Longitude"
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <input
            name="radius_m"
            type="number"
            min={25}
            max={20000}
            required
            defaultValue={device.geofence?.radius_m ?? 200}
            placeholder="Radius (meter)"
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-gold"
          />
          <button
            type="submit"
            disabled={busy !== null}
            className="w-full rounded-xl border border-line py-2.5 text-sm text-ink-soft transition hover:border-ink/25 hover:text-ink disabled:opacity-60"
          >
            {busy === "geofence" ? "Menyimpan…" : "Simpan zona"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-line bg-paper p-5">
        <p className="text-[11px] tracking-[0.18em] text-ink-faint uppercase">
          Endpoint bridge
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          Kirim posisi dari perangkat apa pun ke URL ini.
        </p>
        <CopyRow
          label="POST"
          value={ingestUrl}
          copied={copied === "ingest"}
          onCopy={() => copy(ingestUrl, "ingest")}
        />
        <pre className="mt-2 overflow-x-auto rounded-lg bg-ink px-3 py-2.5 font-mono text-[10px] leading-relaxed text-paper/80">
{`curl -X POST ${ingestUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"lat":-6.2088,"lng":106.8456,"accuracy":15,"battery":80}'`}
        </pre>

        <p className="mt-4 text-[11px] tracking-[0.18em] text-ink-faint uppercase">
          Halaman penemu
        </p>
        <CopyRow
          label="URL"
          value={shareUrl}
          copied={copied === "share"}
          onCopy={() => copy(shareUrl, "share")}
        />
      </div>

      <button
        onClick={remove}
        disabled={busy !== null}
        className="w-full rounded-2xl border border-line py-3 text-xs text-ink-faint transition hover:border-danger/30 hover:text-danger disabled:opacity-60"
      >
        Hapus perangkat
      </button>
    </div>
  );
}

function CopyRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-paper-dim/40 px-3 py-2">
      <span className="font-mono text-[10px] text-ink-faint">{label}</span>
      <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-soft">
        {value}
      </span>
      <button
        onClick={onCopy}
        className="shrink-0 rounded-md bg-paper px-2 py-1 text-[10px] text-ink-soft transition hover:text-ink"
      >
        {copied ? "Tersalin" : "Salin"}
      </button>
    </div>
  );
}
