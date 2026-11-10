"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();

      if (!response.ok) {
        setError(json.error ?? "Terjadi kesalahan.");
        setPending(false);
        return;
      }

      router.push("/app");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "register" ? (
        <Field label="Nama" name="name" type="text" placeholder="Nama lengkap" autoComplete="name" />
      ) : null}
      <Field
        label="Email"
        name="email"
        type="email"
        placeholder="nama@email.com"
        autoComplete="email"
        defaultValue={mode === "login" ? "demo@locard.id" : ""}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        placeholder="Minimal 6 karakter"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        defaultValue={mode === "login" ? "locard123" : ""}
      />

      {error ? (
        <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-ink py-3 text-sm font-medium text-paper transition hover:bg-ink/90 disabled:opacity-60"
      >
        {pending ? "Memproses…" : mode === "login" ? "Masuk" : "Buat akun"}
      </button>

      <p className="pt-2 text-center text-sm text-ink-soft">
        {mode === "login" ? (
          <>
            Belum punya akun?{" "}
            <Link href="/register" className="font-medium text-ink underline underline-offset-4">
              Daftar
            </Link>
          </>
        ) : (
          <>
            Sudah punya akun?{" "}
            <Link href="/login" className="font-medium text-ink underline underline-offset-4">
              Masuk
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] tracking-[0.16em] text-ink-faint uppercase">
        {label}
      </span>
      <input
        {...props}
        required
        className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-faint/70 focus:border-gold focus:ring-2 focus:ring-gold/15"
      />
    </label>
  );
}
