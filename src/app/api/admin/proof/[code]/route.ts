import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isAdmin } from "@/lib/admin";
import { getOrderByCode } from "@/lib/orders";

type KVNamespace = {
  get(
    key: string,
    type: "arrayBuffer",
  ): Promise<ArrayBuffer | null>;
};

type Ctx = { params: Promise<{ code: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  const order = await getOrderByCode(code);
  if (!order?.proof_key) {
    return NextResponse.json({ error: "Bukti transfer tidak ada." }, { status: 404 });
  }

  const env = getCloudflareContext().env as unknown as { PROOFS?: KVNamespace };
  if (!env.PROOFS) {
    return NextResponse.json({ error: "Penyimpanan tidak tersedia." }, { status: 503 });
  }

  const data = await env.PROOFS.get(order.proof_key, "arrayBuffer");
  if (!data) {
    return NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 404 });
  }

  return new Response(data, {
    headers: {
      "content-type": order.proof_type ?? "image/jpeg",
      "content-disposition": `inline; filename="${order.code}-bukti"`,
      "cache-control": "private, no-store",
    },
  });
}
