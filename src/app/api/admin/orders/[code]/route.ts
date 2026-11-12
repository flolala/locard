import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { isOrderStatus, updateOrderStatus } from "@/lib/orders";

type Ctx = { params: Promise<{ code: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  const body = await request.json().catch(() => ({}));
  const status = String(body?.status ?? "");

  if (!isOrderStatus(status)) {
    return NextResponse.json({ error: "Status tidak dikenal." }, { status: 400 });
  }

  await updateOrderStatus(code, status);
  return NextResponse.json({ ok: true, status });
}
