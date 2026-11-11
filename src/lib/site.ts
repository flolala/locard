export const SITE = {
  name: "LOCARD",
  tagline: "More than just a card holder.",
  /** Ganti dengan nomor WhatsApp bisnis Anda (format internasional, tanpa +). */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "6281234567890",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@locard.id",
  city: "Jakarta, Indonesia",
  /** URL gambar QRIS. Kosongkan untuk memakai QR demo. */
  qrisImage: process.env.NEXT_PUBLIC_QRIS_IMAGE ?? "",
} as const;

export type ProductId = "locard" | "service";

export const PRODUCTS: Record<
  ProductId,
  {
    id: ProductId;
    name: string;
    price: number;
    dp: number;
    summary: string;
    includes: string[];
  }
> = {
  locard: {
    id: "locard",
    name: "LOCARD",
    price: 249_000,
    dp: 50_000,
    summary:
      "Card holder dengan tracker terpadu dan alarm. Termasuk akses dashboard LOCARD.",
    includes: [
      "Card holder premium",
      "Tracker terpadu + alarm",
      "Akses dashboard dari perangkat apa pun",
      "Panduan pemakaian",
    ],
  },
  service: {
    id: "service",
    name: "Jasa Pemasangan Tracker",
    price: 199_000,
    dp: 0,
    summary:
      "Tracker dipasang rapi oleh teknisi pada barang pilihan Anda — dompet, tas, atau kunci.",
    includes: [
      "Konsultasi penempatan",
      "Pemasangan oleh teknisi",
      "Uji fungsi sebelum diserahkan",
      "Pendampingan setup dashboard",
    ],
  },
};

export function formatIDR(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

/** Harga terendah dari semua produk — dipakai untuk copy "mulai dari". */
export const STARTING_PRICE = Math.min(
  ...Object.values(PRODUCTS).map((product) => product.price),
);

export function waLink(message?: string): string {
  const base = `https://wa.me/${SITE.whatsapp.replace(/[^\d]/g, "")}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
