import Link from "next/link";
import LogoMark from "@/components/logo-mark";
import PreorderForm from "@/components/preorder-form";
import { PRODUCTS, SITE, formatIDR, waLink } from "@/lib/site";
import type { ProductId } from "@/lib/site";

export const metadata = {
  title: "Pre-Order LOCARD",
  description: "Formulir pre-order LOCARD dan Jasa Pemasangan Tracker.",
};

export default async function PreorderPage({
  searchParams,
}: {
  searchParams: Promise<{ produk?: string }>;
}) {
  const params = await searchParams;
  const initialProduct: ProductId = params.produk === "service" ? "service" : "locard";

  return (
    <main className="flex-1">
      <header className="border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark className="h-9 w-9" />
            <span className="font-display text-2xl tracking-[0.18em]">LOCARD</span>
          </Link>
          <Link
            href="/"
            className="text-[11px] tracking-[0.18em] text-ink-soft uppercase transition hover:text-wine"
          >
            ← Kembali
          </Link>
        </div>
      </header>

      <div className="grain">
        <div className="mx-auto w-full max-w-6xl px-6 pt-14 pb-20">
          <div className="grid gap-14 lg:grid-cols-[1fr_340px]">
            <div>
              <p className="eyebrow">Pre-Order LOCARD</p>
              <h1 className="mt-5 max-w-2xl font-display text-[clamp(2.2rem,4.4vw,3.4rem)] leading-[1.02]">
                Selamat Datang di Formulir{" "}
                <span className="font-display-italic text-wine">Pre-Order</span> LOCARD
              </h1>

              <div className="mt-7 max-w-2xl space-y-4 text-[14px] leading-relaxed text-ink-soft">
                <p>
                  Terima kasih atas minat Anda terhadap produk dan layanan LOCARD.
                </p>
                <p>
                  Silakan lengkapi formulir pemesanan berikut dengan mengisi data
                  diri serta memilih produk atau layanan yang diinginkan.
                </p>
              </div>

              <div className="mt-6 max-w-2xl rounded-2xl border border-wine/20 bg-wine/[0.04] px-5 py-4">
                <p className="text-[13px] leading-relaxed text-ink-soft">
                  Untuk pemesanan <span className="font-medium text-ink">LOCARD Complete</span>,
                  pembayaran uang muka (DP) sebesar{" "}
                  <span className="font-medium text-wine">
                    {formatIDR(PRODUCTS.locard.dp)}
                  </span>{" "}
                  dilakukan melalui <span className="font-medium text-ink">QRIS</span>{" "}
                  sebagai konfirmasi pesanan.
                </p>
              </div>

              <p className="mt-4 max-w-2xl text-[12px] leading-relaxed text-ink-faint">
                Informasi lebih lanjut mengenai proses pemesanan dan pembayaran akan
                disampaikan pada bagian selanjutnya.
              </p>

              <div className="mt-12">
                <PreorderForm initialProduct={initialProduct} />
              </div>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-line bg-paper p-6">
                <p className="eyebrow">Ringkasan</p>

                <div className="mt-5 space-y-4">
                  {(["locard", "service"] as ProductId[]).map((id) => (
                    <div key={id} className="border-b border-line/70 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-[13px] font-medium">{PRODUCTS[id].name}</p>
                        <p className="text-[13px] text-wine">{formatIDR(PRODUCTS[id].price)}</p>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-ink-faint">
                        {id === "locard"
                          ? `DP ${formatIDR(PRODUCTS[id].dp)}/unit via QRIS`
                          : "Dilanjutkan via WhatsApp"}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl bg-paper-dim/50 p-4">
                  <p className="text-[10px] tracking-[0.2em] text-ink-faint uppercase">
                    Butuh bantuan?
                  </p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">
                    Tim kami siap membantu sebelum Anda memesan.
                  </p>
                  <a
                    href={waLink("Halo LOCARD, saya ingin bertanya sebelum melakukan pre-order.")}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-[11px] tracking-[0.16em] text-wine uppercase transition hover:text-wine-soft"
                  >
                    Contact us →
                  </a>
                </div>
              </div>

              <p className="mt-4 px-1 text-[10px] leading-relaxed text-ink-faint">
                Data Anda hanya digunakan untuk memproses pesanan dan dihubungi oleh
                tim LOCARD.
              </p>
            </aside>
          </div>
        </div>
      </div>

      <section className="border-t border-line bg-paper-dim/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-14 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow">Contact us</p>
            <h2 className="mt-3 font-display text-3xl">
              Konsultasi dulu, <span className="font-display-italic text-wine">tidak masalah</span>.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={waLink("Halo LOCARD, saya ingin konsultasi tentang produk dan layanan.")}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-wine px-7 py-3.5 text-[11px] tracking-[0.18em] text-cream uppercase transition hover:bg-wine-soft"
            >
              WhatsApp
            </a>
            <a
              href={`mailto:${SITE.email}`}
              className="rounded-full border border-line bg-paper px-7 py-3.5 text-[11px] tracking-[0.18em] text-ink-soft uppercase transition hover:border-wine/30 hover:text-wine"
            >
              Email
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
