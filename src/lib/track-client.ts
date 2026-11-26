"use client";

import type { TrackEventType } from "./track-shared";

const SESSION_KEY = "locard_sid";
const VISITOR_KEY = "locard_vid";

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function readId(storage: Storage | null, key: string): string {
  try {
    const existing = storage?.getItem(key);
    if (existing) return existing;
    const id = randomId();
    storage?.setItem(key, id);
    return id;
  } catch {
    return randomId();
  }
}

/** ID sesi (per tab) — dipakai untuk hitungan "online sekarang". */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  return readId(window.sessionStorage, SESSION_KEY);
}

/** ID pengunjung (per browser) — dipakai untuk hitungan pengunjung unik. */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  return readId(window.localStorage, VISITOR_KEY);
}

function referrerHost(): string | null {
  try {
    if (!document.referrer) return null;
    const host = new URL(document.referrer).hostname;
    return host === window.location.hostname ? null : host.slice(0, 120);
  } catch {
    return null;
  }
}

export function track(
  type: TrackEventType,
  data: {
    path?: string;
    label?: string;
    meta?: Record<string, unknown>;
  } = {},
): void {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    type,
    path: data.path ?? window.location.pathname,
    label: data.label?.slice(0, 160),
    meta: data.meta,
    session: getSessionId(),
    visitor: getVisitorId(),
    referrer: referrerHost(),
  });

  try {
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/track", blob)) return;
  } catch {
    // fall through to fetch
  }

  try {
    void fetch("/api/track", {
      method: "POST",
      body: payload,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}
