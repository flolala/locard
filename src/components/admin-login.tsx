"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLogin() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: String(data.get("password") ?? "") }),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      setError(json.error ?? "Gagal masuk.");
      setPending(false);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-[10px] tracking-[0.2em] text-ink-faint uppercase">
          Password admin
        </span>
        <input
          name="password"
          type="password"
          required
          autoFocus
          placeholder="••••••••"
          className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm outline-none transition focus:border-wine focus:ring-2 focus:ring-wine/10"
        />
      </label>

      {error ? (
        <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-wine py-3 text-sm font-medium text-cream transition hover:bg-wine-soft disabled:opacity-60"
      >
        {pending ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
