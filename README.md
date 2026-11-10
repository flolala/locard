# LOCARD

Web dashboard untuk card holder pintar LOCARD: lacak lokasi terakhir, bunyikan
alarm, atur zona aman, dan aktifkan mode hilang — dari perangkat apa pun.

> **Your premium carry for peace of mind.**

**Live:** <https://locard.locard.workers.dev> — akun demo `demo@locard.id` / `locard123`.

## Menjalankan

```bash
npm install
npm run dev
```

Buka <http://localhost:3000>.

Akun demo dibuat otomatis saat pertama kali halaman dibuka:

```
email    : demo@locard.id
password : locard123
```

Build produksi:

```bash
npm run build
npm start
```

## Stack

| Bagian | Pilihan |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Bahasa | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | SQLite lewat `node:sqlite` (bawaan Node 22+) |
| Peta | Leaflet + react-leaflet, tile CARTO Light |
| Auth | JWT (jose) di cookie httpOnly + bcrypt |

Tidak ada layanan eksternal yang wajib. Database dibuat otomatis di
`data/locard.db` (di-gitignore).

## Arsitektur

```
Bridge / perangkat            Next.js (server)                 Browser
──────────────────            ────────────────                 ───────
ESP32, app pendamping  ──►  POST /api/ingest/:api_key  ──►  Dashboard
gateway GPS, simulator      simpan lokasi + evaluasi          Peta, riwayat,
                            zona aman + baterai               notifikasi
```

### Lapisan provider

Posisi perangkat tidak di-hardcode ke satu vendor. Setiap perangkat punya
`provider` yang menjelaskan dari mana datanya datang:

| Provider | Status | Keterangan |
|---|---|---|
| `mock` | siap | Simulator bawaan untuk demo dan uji usability. |
| `webhook` | siap | Perangkat apa pun mengirim posisi ke endpoint LOCARD. |
| `findhub` | butuh bridge | Xiaomi Tag via Google Find Hub. |

## Soal Xiaomi Tag

Xiaomi Tag hanya bekerja melalui **Apple Find My** dan **Google Find Hub**,
dan **tidak** kompatibel dengan Xiaomi Home. Google menyatakan belum
menyediakan API/SDK publik untuk Find Hub, sementara laporan lokasinya
terenkripsi end-to-end dengan kunci milik pemilik perangkat.

Konsekuensinya: aplikasi web tidak bisa membaca posisi Xiaomi Tag secara
langsung. LOCARD menyelesaikannya dengan memisahkan *sumber posisi* dari
*antarmuka*:

1. **Sekarang** — pakai `mock` untuk demo, atau `webhook` bila Anda punya
   tracker sendiri (ESP32/BLE/GPS).
2. **Nanti** — jalankan bridge Find Hub sendiri (self-hosted) yang memegang
   kunci perangkat, lalu teruskan hasilnya ke endpoint `webhook` LOCARD.
   Frontend tidak perlu diubah.

## Deploy ke Cloudflare Workers

Aplikasi ini berjalan di Cloudflare Workers memakai adapter **OpenNext** dan
database **D1** (SQLite terkelola).

```bash
# 1. buat database D1 (sekali saja)
npx wrangler d1 create locard-db
# salin database_id ke wrangler.jsonc

# 2. terapkan skema
npx wrangler d1 execute locard-db --remote --file=./schema.sql --yes

# 3. build + deploy
npm run deploy
```

Variabel yang dibutuhkan saat deploy: `CLOUDFLARE_API_TOKEN` dan
`CLOUDFLARE_ACCOUNT_ID`.

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Dev server lokal (D1 lokal via Miniflare) |
| `npm run preview` | Build produksi + preview di Wrangler |
| `npm run deploy` | Build + deploy ke Workers |
| `npm run cf-typegen` | Generate tipe binding Cloudflare |

Binding di `wrangler.jsonc`:

| Binding | Resource |
|---|---|
| `DB` | D1 `locard-db` |
| `ASSETS` | Static assets |
| `LOCARD_SEED` | `"1"` → isi akun demo saat pertama diakses |

## API

Semua endpoint perangkat memakai API key per-perangkat (bukan sesi login).

### Kirim posisi

```http
POST /api/ingest/:api_key
Content-Type: application/json

{
  "lat": -6.2088,
  "lng": 106.8456,
  "accuracy": 15,
  "battery": 80,
  "recorded_at": "2026-11-10T10:00:00Z"
}
```

`lat` dan `lng` wajib. Sisanya opsional. Setiap kiriman otomatis:

- memperbarui "terakhir terlihat" perangkat;
- mengevaluasi zona aman (keluar/masuk → notifikasi);
- memberi notifikasi bila baterai ≤ 20%.

### Ambil perintah (bridge polling)

```http
GET  /api/bridge/:api_key/commands
POST /api/bridge/:api_key/commands   { "id": "...", "status": "acked" }
```

### Endpoint sesi

| Method | Path | Fungsi |
|---|---|---|
| POST | `/api/auth/register` | Daftar |
| POST | `/api/auth/login` | Masuk |
| POST | `/api/auth/logout` | Keluar |
| GET/POST | `/api/devices` | Daftar / tambah perangkat |
| GET/PATCH/DELETE | `/api/devices/:id` | Detail / ubah / hapus |
| POST | `/api/devices/:id/command` | `ring`, `locate`, `lost_on`, `lost_off` |
| POST | `/api/devices/:id/geofence` | Simpan zona aman |
| POST | `/api/devices/:id/simulate` | Geser posisi perangkat mock |

## Halaman

| Path | Isi |
|---|---|
| `/` | Landing page |
| `/login`, `/register` | Autentikasi |
| `/app` | Dashboard: daftar perangkat, peta, notifikasi |
| `/app/devices/:id` | Detail: peta + jejak, riwayat, zona aman, endpoint bridge |
| `/f/:slug` | Halaman publik untuk penemu barang (aktif saat mode hilang) |

## Environment

| Variabel | Default | Fungsi |
|---|---|---|
| `LOCARD_SECRET` | dev fallback | Secret JWT — **wajib** diubah untuk produksi |
| `LOCARD_SEED` | — | Set `1` untuk mengisi akun demo di produksi |
| `DB` | binding D1 | Database (lihat `wrangler.jsonc`) |

## Roadmap

- [ ] Bridge ESP32 + BLE beacon (firmware contoh)
- [ ] Push notification (web push) untuk peringatan zona aman
- [ ] Bagikan perangkat ke anggota keluarga (multi-user)
- [ ] Adapter Find Hub self-hosted
- [ ] Ekspor riwayat lokasi (CSV/GPX)
