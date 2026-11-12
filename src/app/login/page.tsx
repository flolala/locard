import Link from "next/link";
import LogoMark from "@/components/logo-mark";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth-form";
import { getSession } from "@/lib/auth";
import { ensureDemoSeed } from "@/lib/seed";

export default async function LoginPage() {
  await ensureDemoSeed();
  const session = await getSession();
  if (session) redirect("/app");

  return (
    <main className="grain grid flex-1 place-items-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 flex items-center gap-3">
          <LogoMark className="h-8 w-8" />
          <span className="text-sm font-semibold tracking-[0.32em]">LOCARD</span>
        </Link>

        <h1 className="font-display text-4xl">Selamat datang kembali</h1>
        <p className="mt-2 mb-8 text-sm text-ink-soft">
          Masuk untuk memantau card holder Anda.
        </p>

        <AuthForm mode="login" />

        <p className="mt-8 rounded-xl border border-line bg-paper-dim/50 px-4 py-3 text-xs leading-relaxed text-ink-soft">
          <span className="font-medium text-ink">Akun demo</span> sudah terisi otomatis:
          demo@locard.id / locard123
        </p>
      </div>
    </main>
  );
}
