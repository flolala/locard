import { NextResponse } from "next/server";
import { createSession, findUserByEmail, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim();
  const password = String(body?.password ?? "");

  const row = await findUserByEmail(email);
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return NextResponse.json(
      { error: "Email atau password salah." },
      { status: 401 },
    );
  }

  const user = { id: row.id, email: row.email, name: row.name };
  await createSession(user);
  return NextResponse.json({ user });
}
