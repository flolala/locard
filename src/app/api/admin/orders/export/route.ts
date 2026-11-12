import { isAdmin } from "@/lib/admin";
import { listOrdersFiltered } from "@/lib/orders";

function cell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const status = new URL(request.url).searchParams.get("status") ?? undefined;
  const orders = await listOrdersFiltered({ status, limit: 5000 });

  const header = [
    "Kode",
    "Tanggal",
    "Nama",
    "WhatsApp",
    "Email",
    "Produk",
    "Qty",
    "Harga Satuan",
    "Total",
    "DP",
    "Status",
    "Bukti",
  ];

  const rows = orders.map((o) =>
    [
      o.code,
      o.created_at,
      o.name,
      o.whatsapp,
      o.email,
      o.product === "locard" ? "LOCARD" : "Jasa Pemasangan Tracker",
      o.qty,
      o.unit_price,
      o.unit_price * o.qty,
      o.dp_amount,
      o.status,
      o.proof_key ? "ada" : "-",
    ]
      .map(cell)
      .join(","),
  );

  const csv = "\uFEFF" + [header.map(cell).join(","), ...rows].join("\r\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="locard-orders-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
