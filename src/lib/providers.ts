export type ProviderId = "mock" | "webhook" | "findhub";

export type ProviderMeta = {
  id: ProviderId;
  label: string;
  short: string;
  description: string;
  /** Can the web app read coordinates without any external bridge? */
  selfContained: boolean;
  /** Requires a companion device / gateway to push positions. */
  needsBridge: boolean;
  status: "ready" | "needs-bridge" | "unsupported";
  notes: string[];
};

export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  mock: {
    id: "mock",
    label: "Simulasi (demo)",
    short: "Mock",
    description:
      "Posisi dihasilkan oleh simulator bawaan. Dipakai untuk demo dan pengujian alur tanpa perangkat fisik.",
    selfContained: true,
    needsBridge: false,
    status: "ready",
    notes: ["Data tidak nyata.", "Cocok untuk presentasi dan uji usability."],
  },
  webhook: {
    id: "webhook",
    label: "Bridge / Webhook",
    short: "Webhook",
    description:
      "Perangkat apa pun (modul GPS, aplikasi pendamping, atau gateway) mengirim posisi ke endpoint LOCARD dengan API key.",
    selfContained: true,
    needsBridge: true,
    status: "ready",
    notes: [
      "Endpoint: POST /api/ingest/{api_key}",
      "Payload: { lat, lng, accuracy?, battery?, recorded_at? }",
      "Cocok untuk tracker GPS/BLE buatan sendiri.",
    ],
  },
  findhub: {
    id: "findhub",
    label: "Tracker eksternal",
    short: "Eksternal",
    description:
      "Membaca laporan lokasi dari layanan pelacakan pihak ketiga melalui bridge yang Anda jalankan sendiri.",
    selfContained: false,
    needsBridge: true,
    status: "needs-bridge",
    notes: [
      "Layanan pelacakan pihak ketiga umumnya tidak menyediakan API publik.",
      "Posisi diteruskan oleh bridge self-hosted ke endpoint LOCARD.",
    ],
  },
};

export function providerMeta(id: string): ProviderMeta {
  return PROVIDERS[(id as ProviderId) ?? "mock"] ?? PROVIDERS.mock;
}

export function isProviderId(value: string): value is ProviderId {
  return value in PROVIDERS;
}

export type IngestPayload = {
  lat: number;
  lng: number;
  accuracy?: number;
  battery?: number;
  recorded_at?: string;
  source?: string;
};

export function validateIngest(body: unknown): IngestPayload {
  const b = body as Record<string, unknown>;
  const lat = Number(b?.lat);
  const lng = Number(b?.lng);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error("lat tidak valid (harus -90..90).");
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new Error("lng tidak valid (harus -180..180).");
  }

  const accuracy = b?.accuracy === undefined ? undefined : Number(b.accuracy);
  const battery = b?.battery === undefined ? undefined : Number(b.battery);

  return {
    lat,
    lng,
    accuracy: Number.isFinite(accuracy) ? accuracy : undefined,
    battery: Number.isFinite(battery)
      ? Math.max(0, Math.min(100, Math.round(battery as number)))
      : undefined,
    recorded_at:
      typeof b?.recorded_at === "string" && !Number.isNaN(Date.parse(b.recorded_at))
        ? new Date(b.recorded_at).toISOString()
        : undefined,
    source: typeof b?.source === "string" ? b.source.slice(0, 40) : undefined,
  };
}
