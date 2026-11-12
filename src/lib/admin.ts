import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "locard_admin";

/**
 * Secrets live in the Worker env. In production `process.env` is populated by
 * nodejs_compat, while `next dev` exposes them through the Cloudflare context,
 * so check both and read lazily (bindings are not ready at module load).
 */
function adminPassword(): string {
  const direct = process.env.LOCARD_ADMIN_PASSWORD;
  if (direct) return direct;

  try {
    const env = getCloudflareContext().env as unknown as Record<string, string | undefined>;
    return env.LOCARD_ADMIN_PASSWORD ?? "";
  } catch {
    return "";
  }
}

function secretKey() {
  const password = adminPassword();
  return new TextEncoder().encode(
    `${process.env.LOCARD_SECRET ?? "locard-dev-secret"}::admin::${password}`,
  );
}

export function adminConfigured() {
  return adminPassword().length >= 8;
}

function safeEqual(a: string, b: string) {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

export function checkAdminPassword(input: string) {
  const password = adminPassword();
  if (password.length < 8) return false;
  return safeEqual(input, password);
}

export async function createAdminSession() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function destroyAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.role === "admin";
  } catch {
    return false;
  }
}
