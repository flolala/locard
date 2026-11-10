"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      onClick={async () => {
        setPending(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
      disabled={pending}
      className="rounded-full border border-line px-4 py-1.5 text-xs text-ink-soft transition hover:border-ink/25 hover:text-ink disabled:opacity-50"
    >
      {pending ? "Keluar…" : "Keluar"}
    </button>
  );
}
