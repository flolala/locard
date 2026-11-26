import Link from "next/link";
import LogoMark from "./logo-mark";

const TABS = [
  { id: "live", href: "/admin/live", label: "Live" },
  { id: "orders", href: "/admin", label: "Pesanan" },
] as const;

export default function AdminShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: "live" | "orders";
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark className="h-8 w-8" />
            <span className="font-display text-xl tracking-[0.18em]">LOCARD</span>
            <span className="rounded-full border border-line px-2 py-0.5 text-[9px] tracking-[0.2em] text-ink-faint uppercase">
              Admin
            </span>
          </Link>

          <nav className="flex items-center gap-1 rounded-full border border-line bg-paper p-1 text-[10px] tracking-[0.14em] uppercase">
            {TABS.map((tab) => {
              const isActive = tab.id === active;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-full px-4 py-1.5 transition ${
                    isActive
                      ? "bg-wine text-cream"
                      : "text-ink-soft hover:bg-paper-dim hover:text-wine"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
