import Link from "next/link";
import AdminLogin from "@/components/admin-login";
import AdminOrders from "@/components/admin-orders";
import LogoMark from "@/components/logo-mark";
import { adminConfigured, isAdmin } from "@/lib/admin";
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
      <Shell>
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
      </Shell>
    );
  }

  if (!authed) {
    return (
      <Shell>
        <div className="mx-auto mt-16 max-w-sm">
          <p className="eyebrow">Admin</p>
          <h1 className="mt-3 font-display text-3xl">Masuk ke panel</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Halaman ini hanya untuk pengelola LOCARD.
          </p>
          <AdminLogin />
        </div>
      </Shell>
    );
  }

  const params = await searchParams;
  const status = params.status;
  const [orders, stats] = await Promise.all([
    listOrdersFiltered({ status }),
    orderStats(),
  ]);

  return (
    <Shell>
      <AdminOrders
        orders={orders}
        stats={stats}
        status={status}
        analyticsUrl={ANALYTICS_URL}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark className="h-8 w-8" />
            <span className="font-display text-xl tracking-[0.18em]">LOCARD</span>
            <span className="rounded-full border border-line px-2 py-0.5 text-[9px] tracking-[0.2em] text-ink-faint uppercase">
              Admin
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
