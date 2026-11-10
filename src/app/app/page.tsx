import Dashboard from "@/components/dashboard";
import { requireUser } from "@/lib/auth";
import { deviceSummary, listDevices, recentAlertsForUser } from "@/lib/locard";
import { toDeviceView } from "@/lib/view";
import { ensureDemoSeed } from "@/lib/seed";

export default async function AppHome() {
  const user = await requireUser();
  await ensureDemoSeed();

  const devices = listDevices(user.id).map(deviceSummary).map(toDeviceView);
  const alerts = recentAlertsForUser(user.id).map((alert) => ({
    id: alert.id,
    device_id: alert.device_id,
    type: alert.type,
    title: alert.title,
    body: alert.body,
    created_at: alert.created_at,
  }));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.22em] text-gold uppercase">
            Dashboard
          </p>
          <h1 className="mt-2 font-display text-4xl">Halo, {user.name.split(" ")[0]}.</h1>
          <p className="mt-2 max-w-lg text-sm text-ink-soft">
            Semua perangkat Anda dalam satu tempat. Klik perangkat untuk melihat
            riwayat, mengatur zona aman, dan membunyikan alarm.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-paper px-4 py-3 text-right">
          <p className="text-[10px] tracking-[0.16em] text-ink-faint uppercase">
            Perangkat aktif
          </p>
          <p className="font-display text-2xl">{devices.length}</p>
        </div>
      </header>

      <Dashboard devices={devices} alerts={alerts} />
    </div>
  );
}
