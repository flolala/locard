import { NextResponse } from "next/server";
import { adminConfigured, checkAdminPassword, createAdminSession } from "@/lib/admin";

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "Admin belum dikonfigurasi. Set LOCARD_ADMIN_PASSWORD." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const password = String(body?.password ?? "");

  if (!checkAdminPassword(password)) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return NextResponse.json({ error: "Password salah." }, { status: 401 });
  }

  await createAdminSession();
  return NextResponse.json({ ok: true });
}
