import AdminLogin from "@/components/admin-login";
import AdminShell from "@/components/admin-shell";
import LiveDashboard from "@/components/live-dashboard";
import { adminConfigured, isAdmin } from "@/lib/admin";
import { getLiveSnapshot } from "@/lib/live";
import { isLiveRangeKey, type LiveRangeKey } from "@/lib/track-shared";

export const metadata = {
  title: "Live — LOCARD",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const configured = adminConfigured();
  const authed = await isAdmin();

  if (!configured) {
    return (
      <AdminShell active="live">
        <div className="mx-auto mt-16 max-w-md rounded-2xl border border-line bg-paper p-8 text-center">
          <p className="font-display text-2xl">Admin belum aktif</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Set secret <span className="font-mono text-[12px]">LOCARD_ADMIN_PASSWORD</span>{" "}
            (minimal 8 karakter) lalu buka halaman ini kembali.
          </p>
          <code className="mt-4 block rounded-lg bg-ink px-3 py-2 text-left font-mono text-[11px] text-paper/80">
            npx wrangler secret put LOCARD_ADMIN_PASSWORD
          </code>
        </div>
      </AdminShell>
    );
  }

  if (!authed) {
    return (
      <AdminShell active="live">
        <div className="mx-auto mt-16 max-w-sm">
          <p className="eyebrow">Admin</p>
          <h1 className="mt-3 font-display text-3xl">Masuk ke panel</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Halaman ini hanya untuk pengelola LOCARD.
          </p>
          <AdminLogin />
        </div>
      </AdminShell>
    );
  }

  const params = await searchParams;
  const requested = params.range ?? "";
  const range: LiveRangeKey = isLiveRangeKey(requested) ? requested : "today";
  const snapshot = await getLiveSnapshot(range);

  return (
    <AdminShell active="live">
      <LiveDashboard initial={snapshot} />
    </AdminShell>
  );
}
