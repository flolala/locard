import AdminLogin from "@/components/admin-login";
import AdminOrders from "@/components/admin-orders";
import AdminShell from "@/components/admin-shell";
import { adminConfigured, isAdmin } from "@/lib/admin";
import { withDummyOrderStats, withDummyOrders } from "@/lib/dummy"; // DUMMY
import { listOrdersFiltered, orderStats } from "@/lib/orders";

export const metadata = {
  title: "Admin — LOCARD",
  robots: { index: false, follow: false },
};

const ANALYTICS_URL = "https://dash.cloudflare.com/?to=/:account/web-analytics";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const configured = adminConfigured();
  const authed = await isAdmin();

  if (!configured) {
    return (
      <AdminShell active="orders">
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
      <AdminShell active="orders">
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
  const status = params.status;
  const [realOrders, realStats] = await Promise.all([
    listOrdersFiltered({ status }),
    orderStats(),
  ]);
  const orders = withDummyOrders(realOrders, status); // DUMMY — ganti jadi `realOrders`
  const stats = withDummyOrderStats(realStats); // DUMMY — ganti jadi `realStats`

  return (
    <AdminShell active="orders">
      <AdminOrders
        orders={orders}
        stats={stats}
        status={status}
        analyticsUrl={ANALYTICS_URL}
      />
    </AdminShell>
  );
}
