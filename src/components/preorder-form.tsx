"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { PRODUCTS, SITE, formatIDR, waLink, type ProductId } from "@/lib/site";

type Result = {
  code: string;
  product: string;
  qty: number;
  unitPrice: number;
  total: number;
  dp: number;
  status: string;
};

const MAX_BYTES = 5 * 1024 * 1024;

export default function PreorderForm({ initialProduct }: { initialProduct: ProductId }) {
  const [product, setProduct] = useState<ProductId>(initialProduct);
  const [qty, setQty] = useState(1);
  const [proof, setProof] = useState<File | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const preview = useMemo(
    () => (proof ? URL.createObjectURL(proof) : null),
    [proof],
  );

  const meta = PRODUCTS[product];
  const total = meta.price * qty;
  const dp = meta.dp * qty;

  const waMessage = useMemo(
    () =>
      `Halo LOCARD, saya ingin memesan ${meta.name}${
        product === "locard" ? ` sebanyak ${qty} unit` : ""
      }. Mohon informasi selanjutnya.`,
    [meta.name, product, qty],
  );

  useEffect(() => {
    if (product !== "locard") return;
    let cancelled = false;
    QRCode.toDataURL(`LOCARD-DEMO|DP ${dp}|QTY ${qty}`, {
      margin: 1,
      width: 480,
      color: { dark: "#561c24", light: "#faf5ee" },
    })
      .then((url) => !cancelled && setQr(url))
      .catch(() => !cancelled && setQr(null));
    return () => {
      cancelled = true;
    };
  }, [product, qty, dp]);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function pickFile(file: File | null) {
    setError(null);
    if (!file) {
      setProof(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Ukuran bukti transfer maksimal 5 MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Bukti transfer harus berupa gambar (JPG, PNG, atau WEBP).");
      return;
    }
    setProof(file);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const whatsapp = String(data.get("whatsapp") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();

    if (name.length < 2) return setError("Nama lengkap minimal 2 karakter.");
    if (whatsapp.replace(/[^\d]/g, "").length < 9)
      return setError("Nomor WhatsApp belum lengkap.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return setError("Alamat email tidak valid.");

    if (product === "service") {
      const text = `Halo LOCARD, saya ${name}. Saya ingin memesan Jasa Pemasangan Tracker (${formatIDR(
        PRODUCTS.service.price,
      )}). Mohon informasi selanjutnya.`;
      window.open(waLink(text), "_blank", "noopener");
      return;
    }

    if (!proof) return setError("Unggah bukti transfer DP terlebih dahulu.");

    setState("submitting");
    const body = new FormData();
    body.append("name", name);
    body.append("whatsapp", whatsapp);
    body.append("email", email);
    body.append("product", product);
    body.append("qty", String(qty));
    body.append("proof", proof);

    try {
      const response = await fetch("/api/orders", { method: "POST", body });
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? "Pesanan gagal dikirim.");
        setState("error");
        return;
      }
      setResult(json.order);
      setState("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Tidak dapat menghubungi server. Coba lagi.");
      setState("error");
    }
  }

  if (state === "success" && result) {
    return <SuccessPanel result={result} />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      {/* 01 — Data diri */}
      <section>
        <SectionTitle index="01" title="Data diri" hint="Kami hubungi lewat WhatsApp." />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Nama lengkap" name="name" placeholder="Nama sesuai identitas" autoComplete="name" className="sm:col-span-2" />
          <Field
            label="Nomor WhatsApp"
            name="whatsapp"
            placeholder="0812 3456 7890"
            inputMode="tel"
            autoComplete="tel"
          />
          <Field
            label="Email"
            name="email"
            type="email"
            placeholder="nama@email.com"
            autoComplete="email"
          />
        </div>
      </section>

      {/* 02 — Produk */}
      <section>
        <SectionTitle index="02" title="Pilih produk / layanan" />
        <div className="mt-5 grid gap-3">
          {(["locard", "service"] as ProductId[]).map((id) => {
            const item = PRODUCTS[id];
            const active = product === id;
            return (
              <label
                key={id}
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition ${
                  active
                    ? "border-wine bg-wine/[0.04] shadow-[0_20px_40px_-32px_rgba(61,19,25,0.6)]"
                    : "border-line bg-paper hover:border-wine/30"
                }`}
              >
                <input
                  type="radio"
                  name="product"
                  value={id}
                  checked={active}
                  onChange={() => {
                    setProduct(id);
                    setError(null);
                  }}
                  className="peer sr-only"
                />
                <span
                  className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border transition ${
                    active ? "border-wine" : "border-line"
                  }`}
                >
                  {active ? <span className="h-2 w-2 rounded-full bg-wine" /> : null}
                </span>

                <span className="flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="font-display text-lg text-wine">
                      {formatIDR(item.price)}
                    </span>
                  </span>
                  <span className="mt-1 block text-[12px] leading-relaxed text-ink-soft">
                    {item.summary}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* 03 — Pembayaran */}
      {product === "locard" ? (
        <section>
          <SectionTitle
            index="03"
            title="Pembayaran DP"
            hint={`DP ${formatIDR(PRODUCTS.locard.dp)} per unit via QRIS.`}
          />

          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_260px]">
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-2xl border border-line bg-paper px-5 py-4">
                <div>
                  <p className="text-[10px] tracking-[0.2em] text-ink-faint uppercase">
                    Jumlah pemesanan
                  </p>
                  <p className="mt-1 text-[12px] text-ink-soft">
                    Maksimal 20 unit per formulir.
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-line bg-paper-dim/50 p-1">
                  <StepButton onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>
                    −
                  </StepButton>
                  <span className="w-9 text-center text-sm font-medium">{qty}</span>
                  <StepButton onClick={() => setQty((q) => Math.min(20, q + 1))} disabled={qty >= 20}>
                    +
                  </StepButton>
                </div>
              </div>

              <div>
                <p className="text-[10px] tracking-[0.2em] text-ink-faint uppercase">
                  Unggah bukti transfer
                </p>

                <label
                  className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-8 text-center transition ${
                    proof ? "border-wine/40 bg-wine/[0.03]" : "border-line bg-paper hover:border-wine/40"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                  />

                  {preview ? (
                    <span className="flex flex-col items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt="Pratinjau bukti transfer"
                        className="h-32 w-auto rounded-lg border border-line object-contain"
                      />
                      <span className="text-[12px] text-ink-soft">
                        {proof?.name} · {(proof!.size / 1024).toFixed(0)} KB
                      </span>
                      <span className="text-[10px] tracking-[0.18em] text-wine uppercase">
                        Ganti gambar
                      </span>
                    </span>
                  ) : (
                    <span className="flex flex-col items-center gap-2">
                      <span className="grid h-10 w-10 place-items-center rounded-full border border-line text-wine">
                        ↑
                      </span>
                      <span className="text-[13px] font-medium">Pilih gambar bukti transfer</span>
                      <span className="text-[11px] text-ink-faint">
                        JPG, PNG, atau WEBP · maksimal 5 MB
                      </span>
                    </span>
                  )}
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-paper p-5 text-center">
              <p className="text-[10px] tracking-[0.2em] text-ink-faint uppercase">
                Pindai untuk membayar
              </p>

              <div className="mx-auto mt-4 w-full max-w-[190px] overflow-hidden rounded-xl border border-line bg-paper p-2">
                {SITE.qrisImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={SITE.qrisImage} alt="QRIS pembayaran LOCARD" className="w-full" />
                ) : qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qr} alt="QR demo" className="w-full" />
                ) : (
                  <div className="grid aspect-square place-items-center text-[11px] text-ink-faint">
                    Memuat QR…
                  </div>
                )}
              </div>

              <p className="mt-3 text-[10px] leading-relaxed text-ink-faint">
                {SITE.qrisImage
                  ? "QRIS resmi LOCARD"
                  : "QR demo — belum terhubung ke QRIS pembayaran"}
              </p>

              <div className="mt-4 border-t border-line pt-4">
                <p className="text-[10px] tracking-[0.2em] text-ink-faint uppercase">
                  Total harga
                </p>
                <p className="mt-1 text-[13px] text-ink-soft">{formatIDR(total)}</p>
              </div>

              <div className="mt-3 border-t border-line pt-3">
                <p className="text-[10px] tracking-[0.2em] text-ink-faint uppercase">
                  DP sekarang
                </p>
                <p className="mt-1 font-display text-2xl text-wine">{formatIDR(dp)}</p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section>
          <SectionTitle index="03" title="Konsultasi & pemesanan" />
          <div className="mt-5 rounded-2xl border border-wine/20 bg-wine/[0.04] p-6">
            <p className="text-sm leading-relaxed text-ink-soft">
              Untuk Jasa Pemasangan Tracker, pesanan dilanjutkan melalui WhatsApp agar
              tim kami dapat membahas barang yang akan dipasangi, lokasi pemasangan,
              dan jadwalnya.
            </p>
            <a
              href={waLink(waMessage)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-wine px-6 py-3 text-[11px] tracking-[0.18em] text-cream uppercase transition hover:bg-wine-soft"
            >
              Hubungi via WhatsApp →
            </a>
          </div>
        </section>
      )}

      {error ? (
        <p className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-[13px] text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] leading-relaxed text-ink-faint">
          Dengan mengirim formulir, Anda menyetujui dihubungi oleh tim LOCARD
          melalui WhatsApp atau email.
        </p>

        <button
          type="submit"
          disabled={state === "submitting"}
          className="rounded-full bg-wine px-8 py-3.5 text-[11px] font-medium tracking-[0.2em] text-cream uppercase transition hover:bg-wine-soft disabled:opacity-60"
        >
          {state === "submitting"
            ? "Mengirim…"
            : product === "service"
              ? "Lanjut via WhatsApp"
              : "Kirim pesanan"}
        </button>
      </div>
    </form>
  );
}

function SectionTitle({
  index,
  title,
  hint,
}: {
  index: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
      <h2 className="flex items-baseline gap-3 text-sm font-medium">
        <span className="font-mono text-[10px] text-wine/60">{index}</span>
        {title}
      </h2>
      {hint ? <span className="text-[10px] text-ink-faint">{hint}</span> : null}
    </div>
  );
}

function Field({
  label,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[10px] tracking-[0.2em] text-ink-faint uppercase">
        {label}
      </span>
      <input
        {...props}
        required
        className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-faint/60 focus:border-wine focus:ring-2 focus:ring-wine/10"
      />
    </label>
  );
}

function StepButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="grid h-8 w-8 place-items-center rounded-full text-sm text-ink-soft transition hover:bg-paper disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function SuccessPanel({ result }: { result: Result }) {
  const message = `Halo LOCARD, saya sudah mengirim pre-order dengan kode ${result.code}. Mohon konfirmasi pesanan saya.`;

  return (
    <div className="rise rounded-3xl border border-wine/20 bg-paper p-8 text-center sm:p-12">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-wine text-cream">
        ✓
      </div>

      <p className="eyebrow mt-6">Pesanan diterima</p>
      <h2 className="mt-3 font-display text-3xl">Terima kasih.</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
        Bukti transfer Anda sudah kami terima. Tim LOCARD akan menghubungi Anda
        melalui WhatsApp untuk konfirmasi.
      </p>

      <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-line bg-paper-dim/40 p-5 text-left">
        <Row label="Kode pesanan" value={result.code} mono />
        <Row
          label="Produk"
          value={result.product === "locard" ? "LOCARD" : "Jasa Pemasangan Tracker"}
        />
        <Row label="Jumlah" value={`${result.qty} unit`} />
        <Row label="Total" value={formatIDR(result.total)} />
        <Row label="DP dibayar" value={formatIDR(result.dp)} />
        <Row label="Status" value="Menunggu konfirmasi" />
      </div>

      <a
        href={waLink(message)}
        target="_blank"
        rel="noreferrer"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-wine px-8 py-3.5 text-[11px] tracking-[0.2em] text-cream uppercase transition hover:bg-wine-soft"
      >
        Konfirmasi via WhatsApp →
      </a>

      <p className="mt-4 text-[11px] text-ink-faint">
        Simpan kode pesanan Anda: <span className="font-mono">{result.code}</span>
      </p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line/70 py-2 last:border-0">
      <span className="text-[11px] text-ink-faint">{label}</span>
      <span className={`text-[13px] font-medium ${mono ? "font-mono tracking-wider" : ""}`}>
        {value}
      </span>
    </div>
  );
}
