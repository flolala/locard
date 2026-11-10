import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { run } from "@/lib/db";
import { deviceSummary, getDeviceForUser } from "@/lib/locard";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const device = await getDeviceForUser(id, user.id);
  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ device: await deviceSummary(device) });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const device = await getDeviceForUser(id, user.id);
  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const fields: string[] = [];
  const values: unknown[] = [];

  const text = (key: string, max = 120) => {
    if (typeof body?.[key] !== "string") return;
    fields.push(`${key} = ?`);
    values.push(body[key].slice(0, max));
  };

  if (typeof body?.name === "string" && body.name.trim().length >= 2) {
    fields.push("name = ?");
    values.push(body.name.trim().slice(0, 120));
  }
  text("color", 20);
  text("kind", 20);
  text("lost_message", 500);
  text("contact_name", 120);
  text("contact_phone", 40);

  if (fields.length > 0) {
    values.push(id);
    await run(`UPDATE devices SET ${fields.join(", ")} WHERE id = ?`, values);
  }

  return NextResponse.json({
    device: await deviceSummary((await getDeviceForUser(id, user.id))!),
  });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const device = await getDeviceForUser(id, user.id);
  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await run("DELETE FROM devices WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
