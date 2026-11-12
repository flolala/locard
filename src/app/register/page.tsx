import Link from "next/link";
import LogoMark from "@/components/logo-mark";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth-form";
import { getSession } from "@/lib/auth";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/app");

  return (
    <main className="grain grid flex-1 place-items-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 flex items-center gap-3">
          <LogoMark className="h-8 w-8" />
          <span className="text-sm font-semibold tracking-[0.32em]">LOCARD</span>
        </Link>

        <h1 className="font-display text-4xl">Buat akun</h1>
        <p className="mt-2 mb-8 text-sm text-ink-soft">
          Satu akun untuk semua card holder dan tracker Anda.
        </p>

        <AuthForm mode="register" />
      </div>
    </main>
  );
}
