import { NextResponse } from "next/server";
import { createSession, registerUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const password = String(body?.password ?? "");

    if (name.length < 2) {
      return NextResponse.json({ error: "Nama minimal 2 karakter." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter." },
        { status: 400 },
      );
    }

    const user = await registerUser({ name, email, password });
    await createSession(user);
    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mendaftar.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
