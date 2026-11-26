"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { PRODUCTS, SITE, formatIDR, waLink } from "@/lib/site";
import { getSessionId, track } from "@/lib/track-client";

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

export default function PreorderForm() {
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

  const meta = PRODUCTS.locard;
  const total = meta.price * qty;
  const dp = meta.dp * qty;

  useEffect(() => {
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
  }, [qty, dp]);

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
    track("proof_uploaded", { label: `${Math.round(file.size / 1024)} KB` });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const whatsapp = String(data.get("whatsapp") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();

    const fail = (message: string) => {
      setError(message);
      track("submit_error", { label: message });
    };

    if (name.length < 2) return fail("Nama lengkap minimal 2 karakter.");
    if (whatsapp.replace(/[^\d]/g, "").length < 9)
      return fail("Nomor WhatsApp belum lengkap.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return fail("Alamat email tidak valid.");

    if (!proof) return fail("Unggah bukti transfer DP terlebih dahulu.");

    track("submit_attempt");
    setState("submitting");
    const body = new FormData();
    body.append("name", name);
    body.append("whatsapp", whatsapp);
    body.append("email", email);
    body.append("product", "locard");
    body.append("qty", String(qty));
    body.append("proof", proof);
    body.append("session", getSessionId());

    try {
      const response = await fetch("/api/orders", { method: "POST", body });
      const json = await response.json();
      if (!response.ok) {
        const message = json.error ?? "Pesanan gagal dikirim.";
        setError(message);
        setState("error");
        track("submit_error", { label: message });
        return;
      }
      setResult(json.order);
      setState("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Tidak dapat menghubungi server. Coba lagi.");
      setState("error");
      track("submit_error", { label: "Tidak dapat menghubungi server" });
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
        <SectionTitle index="02" title="Produk" required />
        <div className="mt-5 rounded-2xl border border-wine bg-wine/[0.04] p-5 shadow-[0_20px_40px_-32px_rgba(61,19,25,0.6)]">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-medium">{PRODUCTS.locard.name}</span>
            <span className="font-display text-lg text-wine">
              {formatIDR(PRODUCTS.locard.price)}
            </span>
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
            {PRODUCTS.locard.summary}
          </p>
        </div>
      </section>

      {/* 03 — Pembayaran */}
      <section>
      <SectionTitle
        index="03"
        title="Pembayaran DP"
        required hint={`DP ${formatIDR(PRODUCTS.locard.dp)} per unit via QRIS.`}
      />

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-2xl border border-line bg-paper px-5 py-4">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-ink-faint uppercase">
                  Jumlah pemesanan <span className="text-wine">*</span>
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

            <div className="mx-auto mt-4 w-full max-w-[280px] overflow-hidden rounded-xl border border-line bg-paper p-2">
              {SITE.qrisImage ? (
                <a href={SITE.qrisImage} target="_blank" rel="noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={SITE.qrisImage} alt="QRIS pembayaran LOCARD" className="w-full" />
                </a>
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

            {SITE.qrisImage ? (
              <p className="mt-1 text-[10px] text-ink-faint">
                Ketuk gambar untuk memperbesar
              </p>
            ) : null}

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
            ? "Submitting…"
            : "Submit"}
        </button>
      </div>
    </form>
  );
}

function SectionTitle({
  index,
  title,
  hint,
  required,
}: {
  index: string;
  title: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
      <h2 className="flex items-baseline gap-3 text-sm font-medium">
        <span className="font-mono text-[10px] text-wine/60">{index}</span>
        {title}
        {required ? <span className="text-wine">*</span> : null}
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
        {label} <span className="text-wine">*</span>
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
        <Row label="Produk" value="LOCARD" />
        <Row label="Jumlah" value={`${result.qty} unit`} />
        <Row label="Total" value={formatIDR(result.total)} />
        <Row label="DP dibayar" value={formatIDR(result.dp)} />
        <Row label="Status" value="Menunggu konfirmasi" />
      </div>

      <a
        href={waLink(message)}
        target="_blank"
        rel="noreferrer"
        onClick={() => track("wa_confirm", { label: result.code })}
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
