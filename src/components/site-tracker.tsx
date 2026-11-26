"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/track-client";

/** Jaga-jaga dari double-mount React Strict Mode di dev. */
const lastPageview = new Map<string, number>();

export default function SiteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const now = Date.now();
    const previous = lastPageview.get(pathname) ?? 0;
    if (now - previous < 1500) return;

    lastPageview.set(pathname, now);
    track("pageview", { path: pathname });
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#")) return;

      const label = (anchor.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 80);

      if (href.includes("/preorder")) {
        track("cta_order", { label });
      } else if (href.includes("wa.me") || href.includes("whatsapp.com")) {
        track("cta_whatsapp", { label });
      } else if (href.toLowerCase().includes("qris")) {
        track("qris_open", { label });
      }
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
