import Link from "next/link";
import { notFound } from "next/navigation";
import DeviceControls from "@/components/device-controls";
import MapShell from "@/components/map-shell";
import { requireUser } from "@/lib/auth";
import { COLOR_HEX } from "@/lib/colors";
import { formatDateTime, formatDistance, relativeTime } from "@/lib/geo";
import {
  alertsFor,
  deviceSummary,
  geofencesFor,
  getDeviceForUser,
  locationsFor,
} from "@/lib/locard";
import { providerMeta } from "@/lib/providers";
import { toDeviceView } from "@/lib/view";

export default async function DevicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const device = await getDeviceForUser(id, user.id);
  if (!device) notFound();

  const view = toDeviceView(await deviceSummary(device));
  const locations = await locationsFor(device.id, 80);
  const trail = [...locations]
    .reverse()
    .map((point) => ({ lat: point.lat, lng: point.lng }));
  const alerts = await alertsFor(device.id, 12);
  const provider = providerMeta(device.provider);
  const fence = (await geofencesFor(device.id))[0] ?? null;

  const center =
    view.last_lat != null && view.last_lng != null
      ? { lat: view.last_lat, lng: view.last_lng }
      : { lat: -6.2088, lng: 106.8456 };

  const inside =
    fence && view.distanceToFence != null
      ? view.distanceToFence <= fence.radius_m
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/app"
            className="text-[11px] tracking-[0.18em] text-ink-faint uppercase transition hover:text-ink"
          >
            ← Semua perangkat
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: COLOR_HEX[view.color] ?? COLOR_HEX.gold }}
            />
            <h1 className="font-display text-4xl">{view.name}</h1>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-ink-soft">
              {provider.label}
            </span>
            <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-ink-soft">
              {view.kind}
            </span>
            {view.lost_mode ? (
              <span className="rounded-full bg-danger/10 px-2.5 py-1 font-medium text-danger">
                Mode hilang aktif
              </span>
            ) : null}
            {inside !== null ? (
              <span
                className={`rounded-full px-2.5 py-1 font-medium ${
                  inside ? "bg-success/10 text-success" : "bg-gold-wash text-gold"
                }`}
              >
                {inside ? "Di dalam zona aman" : "Di luar zona aman"}
              </span>
            ) : null}
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] tracking-[0.16em] text-ink-faint uppercase">
            Terakhir terlihat
          </p>
          <p className="text-sm font-medium">
            {view.last_seen_at ? relativeTime(view.last_seen_at) : "Belum ada data"}
          </p>
          <p className="text-[11px] text-ink-faint">
            {formatDateTime(view.last_seen_at)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-line bg-paper">
            <div className="h-[400px] w-full">
              <MapShell
                center={center}
                marker={
                  view.last_lat != null && view.last_lng != null
                    ? {
                        lat: view.last_lat,
                        lng: view.last_lng,
                        color: COLOR_HEX[view.color] ?? COLOR_HEX.gold,
                        label: view.name,
                      }
                    : undefined
                }
                trail={trail}
                fence={
                  fence
                    ? { lat: fence.lat, lng: fence.lng, radius_m: fence.radius_m }
                    : undefined
                }
                zoom={15}
              />
            </div>
            <div className="grid grid-cols-2 divide-x divide-line border-t border-line text-center sm:grid-cols-4">
              <Cell
                label="Akurasi"
                value={
                  view.last_accuracy != null
                    ? `${Math.round(view.last_accuracy)} m`
                    : "—"
                }
              />
              <Cell
                label="Baterai"
                value={view.last_battery != null ? `${view.last_battery}%` : "—"}
              />
              <Cell
                label="Jarak zona"
                value={
                  view.distanceToFence != null
                    ? formatDistance(view.distanceToFence)
                    : "—"
                }
              />
              <Cell label="Titik" value={String(locations.length)} />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-paper">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <p className="text-sm font-medium">Riwayat lokasi</p>
              <span className="text-[11px] text-ink-faint">
                {locations.length} titik terakhir
              </span>
            </div>
            <ul className="max-h-80 divide-y divide-line overflow-y-auto">
              {locations.length === 0 ? (
                <li className="px-5 py-8 text-center text-sm text-ink-faint">
                  Belum ada lokasi. Kirim data lewat endpoint bridge di samping.
                </li>
              ) : (
                locations.map((point) => (
                  <li
                    key={point.id}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <div>
                      <p className="text-sm">
                        {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                      </p>
                      <p className="text-[11px] text-ink-faint">
                        {formatDateTime(point.recorded_at)} · {point.source}
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-ink-soft">
                      <p>{point.accuracy != null ? `±${Math.round(point.accuracy)} m` : "—"}</p>
                      <p className="text-ink-faint">
                        {point.battery != null ? `${point.battery}%` : ""}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-paper">
            <div className="border-b border-line px-5 py-3.5">
              <p className="text-sm font-medium">Notifikasi</p>
            </div>
            <ul className="divide-y divide-line">
              {alerts.length === 0 ? (
                <li className="px-5 py-8 text-center text-sm text-ink-faint">
                  Belum ada notifikasi.
                </li>
              ) : (
                alerts.map((alert) => (
                  <li key={alert.id} className="flex gap-3 px-5 py-3.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    <div>
                      <p className="text-sm">{alert.title}</p>
                      {alert.body ? (
                        <p className="text-xs text-ink-soft">{alert.body}</p>
                      ) : null}
                      <p className="mt-0.5 text-[11px] text-ink-faint">
                        {relativeTime(alert.created_at)}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-paper-dim/40 p-5">
            <p className="text-[11px] tracking-[0.18em] text-gold uppercase">
              Tentang provider
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {provider.description}
            </p>
            <ul className="mt-3 space-y-1 text-xs text-ink-soft">
              {provider.notes.map((note) => (
                <li key={note} className="flex gap-2">
                  <span className="text-ink-faint">·</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DeviceControls device={view} />
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-3.5">
      <p className="text-[10px] tracking-[0.16em] text-ink-faint uppercase">{label}</p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}
