import Link from "next/link";
import LogoMark from "@/components/logo-mark";
import { notFound } from "next/navigation";
import MapShell from "@/components/map-shell";
import { formatDateTime, relativeTime } from "@/lib/geo";
import { getDeviceBySlug } from "@/lib/locard";

export default async function FoundPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const device = await getDeviceBySlug(slug);
  if (!device) notFound();

  const hasLocation = device.last_lat != null && device.last_lng != null;
  const center = hasLocation
    ? { lat: device.last_lat!, lng: device.last_lng! }
    : { lat: -6.2088, lng: 106.8456 };

  const phone = device.contact_phone?.replace(/[^\d+]/g, "") ?? "";
  const message = encodeURIComponent(
    `Halo, saya menemukan "${device.name}" yang terdaftar di LOCARD.`,
  );

  return (
    <main className="grain flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark className="h-8 w-8" />
          <span className="text-sm font-semibold tracking-[0.32em]">LOCARD</span>
        </Link>
        <span className="rounded-full border border-line px-3 py-1 text-[10px] tracking-[0.16em] text-ink-faint uppercase">
          Halaman penemu
        </span>
      </header>

      <section className="mx-auto w-full max-w-3xl px-6 pb-20">
        {device.lost_mode ? (
          <div className="mb-6 rounded-2xl border border-gold/30 bg-gold-wash px-5 py-4">
            <p className="text-sm font-medium text-ink">
              Pemilik menandai barang ini sebagai hilang.
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {device.lost_message ??
                "Mohon hubungi pemilik lewat kontak di bawah ini."}
            </p>
          </div>
        ) : (
          <div className="mb-6 rounded-2xl border border-line bg-paper-dim/50 px-5 py-4">
            <p className="text-sm font-medium">Barang ini terdaftar di LOCARD.</p>
            <p className="mt-1 text-sm text-ink-soft">
              Pemilik belum mengaktifkan mode hilang, sehingga kontak tidak
              ditampilkan.
            </p>
          </div>
        )}

        <h1 className="font-display text-4xl">{device.name}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {device.last_seen_at
            ? `Terakhir terlihat ${relativeTime(device.last_seen_at)} · ${formatDateTime(device.last_seen_at)}`
            : "Belum ada data lokasi."}
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-paper">
          <div className="h-64 w-full">
            <MapShell
              center={center}
              marker={hasLocation ? { ...center, color: "#a8822a" } : undefined}
              zoom={hasLocation ? 15 : 11}
            />
          </div>
          {hasLocation ? (
            <div className="border-t border-line px-5 py-3 text-xs text-ink-soft">
              Perkiraan posisi:{" "}
              <span className="font-mono">
                {device.last_lat!.toFixed(3)}, {device.last_lng!.toFixed(3)}
              </span>
              {device.last_accuracy != null ? (
                <> · akurasi ±{Math.round(device.last_accuracy)} m</>
              ) : null}
            </div>
          ) : null}
        </div>

        {device.lost_mode && (device.contact_name || device.contact_phone) ? (
          <div className="mt-6 rounded-2xl border border-line bg-paper p-5">
            <p className="text-[11px] tracking-[0.18em] text-ink-faint uppercase">
              Kontak pemilik
            </p>
            <p className="mt-2 text-lg font-medium">
              {device.contact_name ?? "Pemilik LOCARD"}
            </p>
            {device.contact_phone ? (
              <p className="text-sm text-ink-soft">{device.contact_phone}</p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {phone ? (
                <>
                  <a
                    href={`tel:${phone}`}
                    className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/90"
                  >
                    Telepon pemilik
                  </a>
                  <a
                    href={`https://wa.me/${phone.replace(/^\+/, "")}?text=${message}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-line px-5 py-2.5 text-sm text-ink-soft transition hover:border-ink/25 hover:text-ink"
                  >
                    Kirim WhatsApp
                  </a>
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <p className="mt-8 text-center text-[11px] text-ink-faint">
          Halaman ini hanya menampilkan posisi perkiraan, bukan lokasi presisi.
        </p>
      </section>
    </main>
  );
}
