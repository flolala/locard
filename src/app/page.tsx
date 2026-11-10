import Link from "next/link";
import { ensureDemoSeed } from "@/lib/seed";

const features = [
  {
    title: "Lokasi terakhir",
    body: "Lihat posisi terakhir card holder lengkap dengan waktu dan tingkat akurasi — dari perangkat apa pun.",
    tag: "01",
  },
  {
    title: "Alarm dari jauh",
    body: "Barang tertinggal di sekitar Anda tapi tak terlihat? Bunyikan alarm dari dashboard.",
    tag: "02",
  },
  {
    title: "Notifikasi zona aman",
    body: "Tentukan area aman. LOCARD memberi tahu saat barang keluar dari area tersebut.",
    tag: "03",
  },
  {
    title: "Mode hilang",
    body: "Aktifkan halaman publik berisi kontak Anda, sehingga penemu bisa menghubungi langsung.",
    tag: "04",
  },
];

const stats = [
  { value: "71%", label: "responden menyebut dompet / card holder sebagai barang yang paling sering hilang" },
  { value: "52,4%", label: "memilih card holder dengan tracker menyatu dibanding jasa pasang terpisah" },
  { value: "n=21", label: "wawancara problem & solution validation" },
];

export default async function Home() {
  await ensureDemoSeed();

  return (
    <main className="grain flex-1">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-ink/15 bg-ink text-[11px] font-semibold tracking-[0.15em] text-paper">
            LC
          </span>
          <span className="text-sm font-semibold tracking-[0.32em]">LOCARD</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-ink-soft md:flex">
          <a href="#fitur" className="transition hover:text-ink">Fitur</a>
          <a href="#cara-kerja" className="transition hover:text-ink">Cara kerja</a>
          <a href="#integrasi" className="transition hover:text-ink">Integrasi</a>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-ink-soft transition hover:bg-paper-dim hover:text-ink"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-ink px-5 py-2.5 font-medium text-paper transition hover:bg-ink/90"
          >
            Mulai
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-14 px-6 pt-10 pb-24 md:grid-cols-[1.15fr_0.85fr] md:items-center md:pt-16">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-[11px] tracking-[0.18em] text-ink-soft uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Smart card holder · Kelompok 4
          </p>
          <h1 className="font-display text-[clamp(2.8rem,6vw,4.6rem)] leading-[0.98]">
            Your premium carry
            <br />
            for <span className="text-gold">peace of mind</span>.
          </h1>
          <p className="mt-7 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            Card holder slim dengan tracker menyatu. Ketika kartu penting tertinggal,
            Anda tetap bisa melihat lokasi terakhirnya — bahkan saat HP ikut hilang,
            karena dashboard bisa dibuka dari laptop, komputer kantor, atau HP teman.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition hover:bg-ink/90"
            >
              Buka dashboard demo
            </Link>
            <a
              href="#cara-kerja"
              className="rounded-full border border-line px-6 py-3 text-sm text-ink-soft transition hover:border-ink/30 hover:text-ink"
            >
              Lihat cara kerja
            </a>
          </div>

          <p className="mt-6 text-xs text-ink-faint">
            Akun demo: <span className="font-mono">demo@locard.id</span> /{" "}
            <span className="font-mono">locard123</span>
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-gold-soft/50 via-transparent to-paper-deep/60 blur-2xl" />
          <div className="relative overflow-hidden rounded-[1.6rem] border border-line bg-paper shadow-[0_30px_80px_-40px_rgba(20,17,15,0.45)]">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <span className="text-[11px] tracking-[0.2em] text-ink-faint uppercase">
                Card Holder Kulit
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Terhubung
              </span>
            </div>
            <div className="relative h-64 bg-paper-dim">
              <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,#e2d8c8_1px,transparent_1px),linear-gradient(to_bottom,#e2d8c8_1px,transparent_1px)] [background-size:36px_36px]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="pulse-ring relative block h-4 w-4 rounded-full bg-gold ring-4 ring-paper" />
              </div>
              <div className="absolute bottom-4 left-4 rounded-xl border border-line bg-paper/90 px-3 py-2 backdrop-blur">
                <p className="text-[10px] tracking-[0.16em] text-ink-faint uppercase">
                  Terakhir terlihat
                </p>
                <p className="text-sm font-medium">3 menit lalu · akurasi 18 m</p>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-line border-t border-line text-center">
              {[
                ["Baterai", "82%"],
                ["Zona", "Di dalam"],
                ["Sinyal", "Kuat"],
              ].map(([label, value]) => (
                <div key={label} className="px-3 py-4">
                  <p className="text-[10px] tracking-[0.16em] text-ink-faint uppercase">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-paper-dim/50">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.value}>
              <p className="font-display text-4xl text-ink">{stat.value}</p>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="fitur" className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] tracking-[0.22em] text-gold uppercase">Fitur inti</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">
              Empat hal yang membuatnya berbeda
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
            Dirancang dari hasil 21 wawancara: yang paling dibutuhkan bukan sekadar
            tracker, tapi cara cepat menemukan barang tanpa panik.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
          {features.map((feature) => (
            <article key={feature.title} className="group bg-paper p-8 transition hover:bg-paper-dim/60">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-medium">{feature.title}</h3>
                <span className="font-mono text-[11px] text-ink-faint">{feature.tag}</span>
              </div>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
                {feature.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="cara-kerja" className="border-y border-line bg-ink text-paper">
        <div className="mx-auto w-full max-w-6xl px-6 py-24">
          <p className="text-[11px] tracking-[0.22em] text-gold-soft uppercase">Cara kerja</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl md:text-5xl">
            Tiga langkah, tanpa membuka port apa pun di jaringan Anda.
          </h2>

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Pasangkan perangkat",
                body: "Daftarkan card holder di dashboard. Setiap perangkat mendapat API key sendiri untuk mengirim posisi.",
              },
              {
                step: "02",
                title: "Tracker mengirim posisi",
                body: "Bridge (ESP32, aplikasi pendamping, atau gateway GPS) mengirim koordinat ke endpoint LOCARD.",
              },
              {
                step: "03",
                title: "Pantau dari mana saja",
                body: "Buka dashboard dari perangkat apa pun. Peta, riwayat, alarm, dan notifikasi zona aman langsung tersedia.",
              },
            ].map((item) => (
              <div key={item.step} className="border-t border-paper/15 pt-6">
                <span className="font-mono text-xs text-gold-soft">{item.step}</span>
                <h3 className="mt-3 text-lg font-medium">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/65">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="integrasi" className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="grid gap-10 rounded-2xl border border-line bg-paper-dim/40 p-8 md:grid-cols-[0.9fr_1.1fr] md:p-12">
          <div>
            <p className="text-[11px] tracking-[0.22em] text-gold uppercase">Integrasi</p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">
              Soal Xiaomi Tag, kami jujur.
            </h2>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-ink-soft">
            <p>
              Xiaomi Tag hanya bekerja lewat jaringan <strong>Apple Find My</strong> dan{" "}
              <strong>Google Find Hub</strong>. Google secara resmi menyatakan belum
              menyediakan API/SDK publik untuk Find Hub, dan laporan lokasinya
              terenkripsi end-to-end dengan kunci milik pemilik.
            </p>
            <p>
              Karena itu LOCARD memakai lapisan <em>provider</em>: posisi bisa datang
              dari simulator, dari bridge/webhook apa pun, atau dari layanan Find Hub
              self-hosted yang Anda jalankan sendiri.
            </p>
            <p className="rounded-xl border border-line bg-paper px-4 py-3 text-xs text-ink-soft">
              Artinya: aplikasi web tetap berfungsi penuh hari ini, dan jalur ke
              hardware asli (atau bridge Find Hub) sudah tersedia tanpa mengubah
              frontend.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 text-xs text-ink-faint md:flex-row md:items-center">
          <p>© 2026 LOCARD · Kelompok 4 · KB4</p>
          <p className="font-mono">Next.js · SQLite · Leaflet</p>
        </div>
      </footer>
    </main>
  );
}
