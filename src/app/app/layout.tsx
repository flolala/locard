import Link from "next/link";
import { requireUser } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const user = await requireUser();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/app" className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-[11px] font-semibold tracking-[0.15em] text-paper">
                LC
              </span>
              <span className="text-sm font-semibold tracking-[0.32em]">LOCARD</span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-ink-soft md:flex">
              <Link href="/app" className="transition hover:text-ink">
                Perangkat
              </Link>
              <Link href="/app#alerts" className="transition hover:text-ink">
                Notifikasi
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium">{user.name}</p>
              <p className="text-[11px] text-ink-faint">{user.email}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
