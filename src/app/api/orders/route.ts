import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createOrder, priceFor } from "@/lib/orders";
import type { ProductId } from "@/lib/site";

type KVNamespace = {
  put(
    key: string,
    value: ArrayBuffer,
    options?: { metadata?: Record<string, unknown> },
  ): Promise<void>;
};

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Format formulir tidak valid." }, { status: 400 });
  }

  const name = String(form.get("name") ?? "").trim();
  const whatsapp = String(form.get("whatsapp") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const product = String(form.get("product") ?? "") as ProductId;
  const qtyRaw = Number(form.get("qty") ?? 1);
  const note = String(form.get("note") ?? "").trim();

  if (name.length < 2) {
    return NextResponse.json({ error: "Nama lengkap minimal 2 karakter." }, { status: 400 });
  }

  const digits = whatsapp.replace(/[^\d]/g, "");
  if (digits.length < 9 || digits.length > 15) {
    return NextResponse.json(
      { error: "Nomor WhatsApp tidak valid (contoh: 08123456789)." },
      { status: 400 },
    );
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Alamat email tidak valid." }, { status: 400 });
  }

  if (product !== "locard" && product !== "service") {
    return NextResponse.json({ error: "Pilih produk atau layanan." }, { status: 400 });
  }

  const qty = Math.min(20, Math.max(1, Math.round(qtyRaw || 1)));

  let proof:
    | { key: string; type: string; size: number }
    | undefined;

  if (product === "locard") {
    const file = form.get("proof");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Unggah bukti transfer DP terlebih dahulu." },
        { status: 400 },
      );
    }
    if (file.size > MAX_PROOF_BYTES) {
      return NextResponse.json(
        { error: "Ukuran bukti transfer maksimal 5 MB." },
        { status: 400 },
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format bukti transfer harus JPG, PNG, atau WEBP." },
        { status: 400 },
      );
    }

    const env = getCloudflareContext().env as unknown as { PROOFS?: KVNamespace };
    if (!env.PROOFS) {
      return NextResponse.json(
        { error: "Penyimpanan bukti transfer belum dikonfigurasi." },
        { status: 503 },
      );
    }

    const key = `proofs/${crypto.randomUUID()}`;
    await env.PROOFS.put(key, await file.arrayBuffer(), {
      metadata: { type: file.type, name: file.name, size: file.size },
    });
    proof = { key, type: file.type, size: file.size };
  }

  const order = await createOrder({
    name,
    whatsapp: digits,
    email,
    product,
    qty,
    note: note || undefined,
    proof,
  });

  const pricing = priceFor(product, qty);

  return NextResponse.json(
    {
      order: {
        code: order.code,
        product: order.product,
        qty: order.qty,
        unitPrice: pricing.unitPrice,
        total: pricing.total,
        dp: pricing.dp,
        status: order.status,
      },
    },
    { status: 201 },
  );
}
