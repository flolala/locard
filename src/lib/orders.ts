import "server-only";

import { all, first, nowIso, run, uid } from "./db";
import { PRODUCTS, type ProductId } from "./site";

export type OrderRow = {
  id: string;
  code: string;
  name: string;
  whatsapp: string;
  email: string;
  product: string;
  qty: number;
  unit_price: number;
  dp_amount: number;
  status: string;
  proof_key: string | null;
  proof_type: string | null;
  proof_size: number | null;
  note: string | null;
  created_at: string;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function orderCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `LCD-${Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join("")}`;
}

export function priceFor(product: ProductId, qty: number) {
  const meta = PRODUCTS[product];
  return {
    unitPrice: meta.price,
    total: meta.price * qty,
    dp: meta.dp * qty,
  };
}

export async function createOrder(input: {
  name: string;
  whatsapp: string;
  email: string;
  product: ProductId;
  qty: number;
  note?: string;
  proof?: { key: string; type: string; size: number };
}): Promise<OrderRow> {
  const id = uid();
  const code = orderCode();
  const { unitPrice, dp } = priceFor(input.product, input.qty);

  await run(
    `INSERT INTO orders
      (id, code, name, whatsapp, email, product, qty, unit_price, dp_amount,
       status, proof_key, proof_type, proof_size, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_confirmation', ?, ?, ?, ?, ?)`,
    [
      id,
      code,
      input.name,
      input.whatsapp,
      input.email,
      input.product,
      input.qty,
      unitPrice,
      dp,
      input.proof?.key ?? null,
      input.proof?.type ?? null,
      input.proof?.size ?? null,
      input.note ?? null,
      nowIso(),
    ],
  );

  return (await first<OrderRow>("SELECT * FROM orders WHERE id = ?", [id]))!;
}

export function getOrderByCode(code: string): Promise<OrderRow | undefined> {
  return first<OrderRow>("SELECT * FROM orders WHERE code = ?", [code]);
}

export function listOrders(limit = 50): Promise<OrderRow[]> {
  return all<OrderRow>(
    "SELECT * FROM orders ORDER BY created_at DESC LIMIT ?",
    [limit],
  );
}
