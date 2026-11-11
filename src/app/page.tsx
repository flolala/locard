import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import HeroCarousel, { type HeroSlide } from "@/components/hero-carousel";
import ScrollEffects from "@/components/scroll-effects";
import { PRODUCTS, SITE, STARTING_PRICE, formatIDR, waLink } from "@/lib/site";


const HERO_SLIDES: HeroSlide[] = [
  {
    src: "/products/hero-1.jpg",
    alt: "Card holder LOCARD warna burgundy di dalam kotak premium",
    caption: "Signature Burgundy",
  },
  {
    src: "/products/hero-2.jpg",
    alt: "Bagian dalam card holder LOCARD dengan slot kartu",
    caption: "Sembilan slot kartu",
  },
  {
    src: "/products/hero-3.jpg",
    alt: "Tiga pilihan warna card holder LOCARD",
    caption: "Tiga pilihan warna",
  },
];

const features = [
  {
    n: "01",
    title: "Lokasi terakhir",
    body: "Lihat posisi terakhir card holder lengkap dengan waktu dan akurasi — dari perangkat apa pun.",
  },
  {
    n: "02",
    title: "Alarm dari jauh",
    body: "Barang tertinggal di sekitar Anda tetapi tak terlihat? Bunyikan alarm langsung dari dashboard.",
  },
  {
    n: "03",
    title: "Zona aman",
    body: "LOCARD memberikan notifikasi begitu card holder menjauh dari jangkauan Anda.",
  },
];

const moments = [
  {
    time: "07:40",
    title: "Kartu akses tidak di tempatnya",
    body: "Tergelincir dari kantong saat buru-buru berangkat. Baru ketahuan ketika Anda sudah berdiri di depan lift kantor.",
  },
  {
    time: "12:15",
    title: "Card holder tertinggal di meja kafe",
    body: "Anda sudah di jalan dan ponsel ada di tangan — tetapi tidak ada cara memastikan di mana benda itu terakhir berada.",
  },
  {
    time: "18:30",
    title: "Satu barang hilang, satu malam tidak tenang",
    body: "Menelepon ke sana-sini, kembali ke tempat tadi, dan tetap tanpa jawaban pasti soal keberadaannya.",
  },
];

const steps = [
  {
    n: "01",
    title: "Pemesanan",
    body: "Lengkapi formulir pre-order, tentukan pilihan Anda, dan selesaikan pembayaran awal melalui QRIS.",
  },
  {
    n: "02",
    title: "Persiapan",
    body: "Tim kami menyiapkan unit Anda secara personal dan menghubungi Anda melalui WhatsApp untuk konfirmasi.",
  },
  {
    n: "03",
    title: "Aktivasi",
    body: "Setibanya di tangan Anda, hubungkan perangkat dan akses lokasi, alarm, serta zona aman melalui dashboard.",
  },
];

const marquee = [
  "Tracker terpadu",
  "Alarm dari jauh",
  "Zona aman",
  "Lokasi terakhir",
  "Dashboard pribadi",
  "Pre-order Batch 01",
];

/** Splits a heading into masked lines that slide up one after another. */
function Lines({ lines }: { lines: ReactNode[] }) {
  return (
    <>
      {lines.map((line, i) => (
        <span key={i} className="line" style={{ "--line-i": i } as CSSProperties}>
          <span>{line}</span>
        </span>
      ))}
    </>
  );
}

export default function Home() {
  return (
    <main className="flex-1">
      <ScrollEffects />

      <header
        data-header
        className="site-header sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md"
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-baseline gap-2.5">
            <span className="font-display text-2xl tracking-[0.18em]">LOCARD</span>
            <span className="hidden text-[9px] tracking-[0.3em] text-ink-faint uppercase sm:inline">
              est. 2026
            </span>
          </Link>

          <nav className="hidden items-center gap-9 text-[13px] text-ink-soft md:flex">
            <a href="#filosofi" data-nav="filosofi" className="nav-link transition hover:text-wine">Filosofi</a>
            <a href="#produk" data-nav="produk" className="nav-link transition hover:text-wine">Produk</a>
            <a href="#cara" data-nav="cara" className="nav-link transition hover:text-wine">Proses</a>
            <a href="#kontak" data-nav="kontak" className="nav-link transition hover:text-wine">Kontak</a>
          </nav>

          <Link
            href="/preorder"
            className="rounded-full bg-wine px-6 py-2.5 text-[11px] font-medium tracking-[0.18em] text-cream uppercase transition hover:bg-wine-soft"
          >
            Order Now
          </Link>
        </div>
        <span
          aria-hidden
          data-page-progress
          className="page-progress absolute inset-x-0 -bottom-px h-px bg-wine/70"
        />
      </header>

      {/* Hero */}
      <section data-scroll-progress="exit" className="grain relative overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl gap-16 px-6 pt-16 pb-24 md:grid-cols-[1.05fr_0.95fr] md:items-center md:pt-24">
          <div className="hero-copy">
            <p className="eyebrow rise rise-1 flex items-center gap-3">
              <span className="h-px w-8 bg-wine/40" />
              Pre-order dibuka · Batch 01
            </p>

            <h1 className="rise rise-2 mt-7 font-display text-[clamp(2.6rem,5.4vw,4.3rem)] leading-[1.02]">
              Your premium carry for peace of mind.
            </h1>

            <p className="rise rise-3 mt-5 max-w-lg font-display-italic text-[clamp(1.15rem,2.2vw,1.5rem)] leading-snug text-wine">
              Designed to keep your essentials close and easy to find.
            </p>

            <div className="rise rise-4 mt-12 flex flex-wrap items-center gap-4">
              <Link
                href="/preorder"
                className="group inline-flex items-center gap-3 rounded-full bg-wine px-8 py-4 text-[11px] font-medium tracking-[0.2em] text-cream uppercase transition hover:bg-wine-soft"
              >
                Order Now
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <a
                href="#produk"
                className="inline-flex items-center gap-2 border-b border-ink/20 pb-1 text-[11px] tracking-[0.2em] text-ink-soft uppercase transition hover:border-wine hover:text-wine"
              >
                Lihat koleksi
              </a>
            </div>
          </div>

          <div className="hero-visual relative isolate mx-auto w-full max-w-sm">
            {/* Decorative orbit that turns as the page scrolls */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-10 -z-10 hidden sm:block"
            >
              <div className="hero-orbit relative h-full w-full rounded-full border border-wine/10">
                <span className="absolute top-1/2 -left-1 h-2 w-2 rounded-full bg-wine/40" />
                <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 rounded-full bg-sand" />
              </div>
            </div>

            <div className="unveil relative aspect-[4/5] overflow-hidden rounded-t-[7rem] rounded-b-[2rem] bg-wine-deep shadow-[0_50px_90px_-50px_rgba(61,19,25,0.7)]">
              <HeroCarousel slides={HERO_SLIDES} />
              <div className="pointer-events-none absolute inset-0 rounded-t-[7rem] rounded-b-[2rem] ring-1 ring-inset ring-cream/15" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["Alarm", "Bunyikan dari jauh"],
                ["Zona aman", "Notifikasi otomatis"],
              ].map(([label, value], i) => (
                <div
                  key={label}
                  className={`rise ${i === 0 ? "rise-3" : "rise-4"} rounded-2xl border border-line bg-paper/95 px-4 py-3 text-center`}
                >
                  <p className="text-[9px] tracking-[0.2em] text-ink-faint uppercase">
                    {label}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Marquee strip */}
      <div className="marquee overflow-hidden border-y border-line bg-paper-dim/60">
        <div className="marquee-track py-4 text-[9px] tracking-[0.24em] text-ink-soft uppercase sm:text-[10px]">
          {[0, 1].map((copy) => (
            <div key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
              {marquee.map((item) => (
                <span key={item} className="flex items-center">
                  <span className="px-6">{item}</span>
                  <span className="text-wine/30">◆</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Philosophy / features */}
      <section id="filosofi" className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-[0.85fr_1.15fr]">
          <div data-reveal="lines">
            <p className="eyebrow">Filosofi</p>
            <h2 className="mt-5 font-display text-[clamp(2.1rem,4vw,3.1rem)] leading-[1.02]">
              <Lines
                lines={[
                  "Tenang itu kemewahan",
                  <>
                    yang paling <span className="font-display-italic text-wine">nyata</span>.
                  </>,
                ]}
              />
            </h2>
          </div>

          <div
            data-reveal-stagger="120"
            className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3"
          >
            {features.map((feature) => (
              <article
                key={feature.n}
                data-reveal="up"
                className="group bg-paper p-7 transition hover:bg-paper-dim/70"
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] text-ink-faint">{feature.n}</span>
                  <span className="h-px w-6 translate-y-2 bg-line transition-all duration-500 group-hover:w-10 group-hover:bg-wine/40" />
                </div>
                <h3 className="mt-5 text-base font-medium">{feature.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                  {feature.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="produk" className="border-y border-line bg-paper-dim/40">
        <div className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div data-reveal="lines">
              <p className="eyebrow">Koleksi</p>
              <h2 className="mt-5 font-display text-[clamp(2.1rem,4vw,3.1rem)]">
                <Lines lines={["Dua cara memiliki LOCARD"]} />
              </h2>
            </div>
            <p
              data-reveal="fade"
              style={{ "--reveal-delay": "200ms" } as CSSProperties}
              className="max-w-sm text-sm leading-relaxed text-ink-soft"
            >
              Pilih card holder siap pakai, atau pasangkan tracker pada barang
              favorit yang sudah Anda miliki.
            </p>
          </div>

          <div data-reveal-stagger="160" className="mt-14 grid gap-6 md:grid-cols-2">
            {[PRODUCTS.locard, PRODUCTS.service].map((product) => (
              <article
                key={product.id}
                data-reveal="scale"
                className="group flex flex-col justify-between rounded-2xl border border-line bg-paper p-8 transition-[border-color,box-shadow,translate] duration-500 hover:-translate-y-1 hover:border-wine/30 hover:shadow-[0_30px_60px_-45px_rgba(61,19,25,0.5)]"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] tracking-[0.24em] text-ink-faint uppercase">
                        {product.id === "locard" ? "Signature" : "Service"}
                      </p>
                      <h3 className="mt-2 font-display text-2xl">{product.name}</h3>
                    </div>
                    <p className="font-display text-2xl text-wine">
                      {formatIDR(product.price)}
                    </p>
                  </div>

                  <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-ink-soft">
                    {product.summary}
                  </p>

                  <ul className="mt-6 space-y-2 border-t border-line pt-5">
                    {product.includes.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-[13px] text-ink-soft"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-wine/50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 flex items-center justify-between gap-4">
                  {product.id === "locard" ? (
                    <span className="text-[10px] tracking-[0.16em] text-ink-faint uppercase">
                      DP {formatIDR(product.dp)} via QRIS
                    </span>
                  ) : (
                    <span className="text-[10px] tracking-[0.16em] text-ink-faint uppercase">
                      Konsultasi via WhatsApp
                    </span>
                  )}

                  <Link
                    href={product.id === "locard" ? "/preorder" : "/preorder?produk=service"}
                    className="inline-flex items-center gap-2 rounded-full border border-wine/25 px-5 py-2.5 text-[10px] tracking-[0.2em] text-wine uppercase transition hover:bg-wine hover:text-cream"
                  >
                    {product.id === "locard" ? "Pilih" : "Tanya"}
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="cara" className="mx-auto w-full max-w-6xl px-6 py-28">
        <div className="grid gap-16 md:grid-cols-[0.8fr_1.2fr]">
          <div className="md:sticky md:top-28 md:self-start">
            <div data-reveal="lines">
              <p className="eyebrow">Proses</p>
              <h2 className="mt-5 font-display text-[clamp(2.1rem,4vw,3.1rem)] leading-[1.02]">
                <Lines
                  lines={[
                    "Tenang sejak",
                    <>
                      langkah <span className="font-display-italic text-wine">pertama</span>.
                    </>,
                  ]}
                />
              </h2>
            </div>
            <p
              data-reveal="fade"
              style={{ "--reveal-delay": "250ms" } as CSSProperties}
              className="mt-6 max-w-xs text-[13px] leading-relaxed text-ink-soft"
            >
              Tiga tahap yang kami dampingi sepenuhnya, dari pemesanan hingga
              perangkat aktif di tangan Anda.
            </p>
          </div>

          <ol data-scroll-progress="draw" className="relative">
            <span
              aria-hidden
              className="absolute top-4 bottom-4 left-[1.125rem] w-px bg-line"
            />
            <span
              aria-hidden
              className="timeline-fill absolute top-4 bottom-4 left-[1.125rem] w-px bg-wine/60"
            />

            {steps.map((item) => (
              <li
                key={item.n}
                data-reveal="left"
                className="relative flex gap-7 pb-12 last:pb-0"
              >
                <span className="step-dot relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-paper font-display text-[13px] text-wine">
                  {item.n}
                </span>
                <div className="pt-1.5">
                  <h3 className="font-display text-xl leading-snug">{item.title}</h3>
                  <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ink-soft">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pain points */}
      <section
        data-scroll-progress
        className="relative overflow-hidden border-y border-line bg-wine text-cream"
      >
        <p
          aria-hidden
          className="drift-x pointer-events-none absolute -bottom-[0.18em] left-0 font-display-italic text-[clamp(7rem,20vw,17rem)] leading-none whitespace-nowrap text-cream/[0.05] select-none"
        >
          peace of mind · peace of mind
        </p>

        <div className="relative mx-auto w-full max-w-6xl px-6 py-20">
          <div data-reveal="lines">
            <p className="text-[10px] tracking-[0.24em] text-cream/50 uppercase">
              Tanpa LOCARD
            </p>
            <h2 className="mt-5 max-w-2xl font-display text-[clamp(1.9rem,3.4vw,2.7rem)] leading-[1.05]">
              <Lines
                lines={[
                  "Tiga momen dalam sehari yang membuat Anda",
                  <span key="k" className="font-display-italic text-cream/70">
                    kehilangan waktu.
                  </span>,
                ]}
              />
            </h2>
          </div>

          <div
            data-reveal-stagger="140"
            className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-cream/15 bg-cream/15 md:grid-cols-3"
          >
            {moments.map((moment) => (
              <article
                key={moment.time}
                data-reveal="blur"
                className="bg-wine p-8 transition-colors duration-500 hover:bg-wine-soft"
              >
                <p className="font-mono text-[10px] tracking-[0.2em] text-cream/40">
                  {moment.time}
                </p>
                <h3 className="mt-5 font-display text-xl leading-snug">
                  {moment.title}
                </h3>
                <p className="mt-3 text-[13px] leading-relaxed text-cream/60">
                  {moment.body}
                </p>
              </article>
            ))}
          </div>

          <p
            data-reveal="up"
            className="mt-10 max-w-lg text-[13px] leading-relaxed text-cream/60"
          >
            LOCARD menjawab satu hal saja: di mana benda itu sekarang.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section id="kontak" className="mx-auto w-full max-w-6xl px-6 py-24">
        <div
          data-reveal="scale"
          className="grid items-center gap-10 rounded-3xl border border-line bg-paper-dim/50 p-10 md:grid-cols-[1.1fr_0.9fr] md:p-14"
        >
          <div data-reveal="lines" style={{ "--reveal-delay": "200ms" } as CSSProperties}>
            <p className="eyebrow">Contact us</p>
            <h2 className="mt-4 font-display text-[clamp(2rem,3.6vw,2.8rem)] leading-[1.05]">
              <Lines lines={["Ada yang ingin", "ditanyakan lebih dulu?"]} />
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft">
              Tim kami siap membantu memilih varian, menjelaskan cara kerja
              tracker, atau mengatur pemasangan.
            </p>
          </div>

          <div data-reveal-stagger="120" className="space-y-3">
            <a
              href={waLink("Halo LOCARD, saya ingin bertanya tentang produk dan layanan.")}
              target="_blank"
              rel="noreferrer"
              data-reveal="right"
              className="group flex items-center justify-between rounded-2xl bg-wine px-6 py-5 text-cream transition hover:bg-wine-soft"
            >
              <span>
                <span className="block text-[10px] tracking-[0.24em] text-cream/60 uppercase">
                  WhatsApp
                </span>
                <span className="mt-1 block text-sm font-medium">Contact us</span>
              </span>
              <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
            </a>

            <a
              href={`mailto:${SITE.email}`}
              data-reveal="right"
              className="group flex items-center justify-between rounded-2xl border border-line bg-paper px-6 py-5 transition hover:border-wine/30"
            >
              <span>
                <span className="block text-[10px] tracking-[0.24em] text-ink-faint uppercase">
                  Email
                </span>
                <span className="mt-1 block text-sm font-medium">{SITE.email}</span>
              </span>
              <span className="text-lg text-ink-faint transition-transform group-hover:translate-x-1">→</span>
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div
          data-reveal="fade"
          className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p className="font-display text-xl tracking-[0.18em]">LOCARD</p>
            <p className="mt-2 max-w-xs text-[12px] leading-relaxed text-ink-faint">
              {SITE.tagline}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 text-[11px] tracking-[0.16em] text-ink-soft uppercase">
            <Link href="/preorder" className="nav-link transition hover:text-wine">Pre-order</Link>
            <a href="#produk" className="nav-link transition hover:text-wine">Produk</a>
            <a href={waLink("Halo LOCARD, saya ingin bertanya.")} target="_blank" rel="noreferrer" className="nav-link transition hover:text-wine">
              WhatsApp
            </a>
            <Link href="/login" className="nav-link transition hover:text-wine">Dashboard</Link>
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-6 pb-10">
          <p data-reveal="fade" className="mb-6">
            <span className="rule rule-draw block" />
          </p>
          <p className="text-[10px] tracking-[0.16em] text-ink-faint uppercase">
            © 2026 LOCARD · {SITE.city}
          </p>
        </div>
      </footer>
    </main>
  );
}
