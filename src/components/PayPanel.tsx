'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = { price: number; listPrice: number; siteHref: string; initialVoucher: string };
type View =
  | { kind: 'form' }
  | { kind: 'loading' }
  | { kind: 'qr'; orderId: string; qrUrl: string; amount: number }
  | { kind: 'paid'; trialDays?: number }
  | { kind: 'expired' }
  | { kind: 'error'; msg: string };
type Applied = { code: string; discount: number; final: number; trialDays: number | null };

const rp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

export default function PayPanel({ price, listPrice, siteHref, initialVoucher }: Props) {
  const [v, setV] = useState<View>({ kind: 'form' });
  const [code, setCode] = useState(initialVoucher);
  const [applied, setApplied] = useState<Applied | null>(null);
  const [vmsg, setVmsg] = useState('');
  const [checking, setChecking] = useState(false);
  const auto = useRef(false);

  const trial = applied?.trialDays ?? null;
  const total = trial ? 0 : applied ? applied.final : price;

  const apply = useCallback(async (raw: string) => {
    const c = raw.trim();
    if (!c) {
      setApplied(null);
      setVmsg('');
      return;
    }
    setChecking(true);
    setVmsg('');
    try {
      const res = await fetch('/api/pay/voucher', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voucher: c }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) {
        setApplied(null);
        setVmsg(d.error || 'Voucher gagal dicek.');
      } else {
        setApplied({ code: d.code, discount: d.discount, final: d.final, trialDays: d.trialDays ?? null });
        setVmsg('');
      }
    } catch {
      setVmsg('Tidak ada koneksi. Coba lagi.');
    } finally {
      setChecking(false);
    }
  }, []);

  // Kode dari tautan promo (?voucher=KODE) langsung dicek.
  useEffect(() => {
    if (auto.current || !initialVoucher) return;
    auto.current = true;
    apply(initialVoucher);
  }, [initialVoucher, apply]);

  const create = useCallback(async (voucher: string | null) => {
    setV({ kind: 'loading' });
    try {
      const res = await fetch('/api/pay/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voucher }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) return setV({ kind: 'error', msg: d.error || 'Gagal membuat kode bayar.' });
      if (d.status === 'paid') return setV({ kind: 'paid', trialDays: d.trialDays });
      setV({ kind: 'qr', orderId: d.orderId, qrUrl: d.qrUrl, amount: d.amount });
    } catch {
      setV({ kind: 'error', msg: 'Tidak ada koneksi. Coba lagi.' });
    }
  }, []);

  // Cek status tiap 4 detik selama kode QR tampil.
  const orderId = v.kind === 'qr' ? v.orderId : null;
  useEffect(() => {
    if (!orderId) return;
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/pay/status?order=${encodeURIComponent(orderId)}`, { cache: 'no-store' });
        const d = await res.json().catch(() => ({}));
        if (stop || !d.ok) return;
        if (d.status === 'paid') setV({ kind: 'paid' });
        else if (d.status === 'expired' || d.status === 'failed') setV({ kind: 'expired' });
      } catch {
        /* coba lagi di putaran berikutnya */
      }
    };
    const t = setInterval(tick, 4000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [orderId]);

  if (v.kind === 'paid') {
    return (
      <div className="box payok" role="status">
        <h2>{v.trialDays ? `Percobaan ${v.trialDays} hari dimulai` : total === 0 ? 'Voucher berhasil dipakai' : 'Pembayaran berhasil'}</h2>
        <p>Situsmu sudah terbit dan bisa dibuka siapa saja.</p>
        {v.trialDays ? <p className="note">Setelah {v.trialDays} hari situs berhenti tampil. Bayar kapan saja dari dashboard untuk melanjutkan.</p> : null}
        <p className="linkrow"><code>{siteHref}</code></p>
        <div className="cta">
          <a className="btn primary lg" href={siteHref} target="_blank" rel="noopener noreferrer">Buka situs</a>
          <a className="btn lg" href="/dashboard">Kembali ke dashboard</a>
        </div>
      </div>
    );
  }

  if (v.kind === 'loading') return <p className="note" aria-live="polite">Menyiapkan pembayaran...</p>;

  if (v.kind === 'qr') {
    return (
      <div className="box payqr">
        <p className="payamt">{rp(v.amount)}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="qr" src={v.qrUrl} width={280} height={280} alt="Kode QRIS untuk membayar" />
        <ol className="paysteps">
          <li>Buka GoPay, OVO, DANA, ShopeePay, atau aplikasi m-banking.</li>
          <li>Pilih Scan atau Bayar, lalu arahkan ke kode di atas.</li>
          <li>Kalau kamu membuka halaman ini dari HP yang sama, simpan gambar kode (tekan lama), lalu pilih &quot;unggah dari galeri&quot; di menu Scan aplikasi pembayaranmu.</li>
        </ol>
        <p className="note" aria-live="polite">Halaman ini otomatis berubah setelah pembayaran diterima. Kode berlaku beberapa menit.</p>
        <button type="button" className="btn sm" onClick={() => setV({ kind: 'form' })}>Ganti voucher</button>
      </div>
    );
  }

  return (
    <div className="box payform">
      {v.kind === 'error' ? <p role="alert">{v.msg}</p> : null}
      {v.kind === 'expired' ? <p role="alert">Kode QRIS sudah kedaluwarsa. Buat kode baru untuk melanjutkan.</p> : null}
      <div className="fld">
        <label htmlFor="voucher">Kode voucher (opsional)</label>
        <div className="linkrow">
          <input id="voucher" type="text" value={code} maxLength={30} autoComplete="off" autoCapitalize="characters" spellCheck={false} onChange={(e) => { setCode(e.target.value.toUpperCase()); setApplied(null); setVmsg(''); }} />
          <button type="button" className="btn" disabled={checking || !code.trim()} onClick={() => apply(code)}>{checking ? 'Mengecek...' : 'Terapkan'}</button>
        </div>
        {vmsg ? <p className="note" role="alert">{vmsg}</p> : null}
      </div>
      <dl className="paysum">
        {listPrice > price ? <div><dt>Harga normal</dt><dd><s className="was">{rp(listPrice)}</s></dd></div> : null}
        {listPrice > price ? <div><dt>Diskon promo</dt><dd>-{rp(listPrice - price)}</dd></div> : null}
        <div><dt>Harga</dt><dd>{rp(price)}</dd></div>
        {applied && !trial ? <div><dt>Diskon ({applied.code})</dt><dd>-{rp(applied.discount)}</dd></div> : null}
        {trial ? <div><dt>Percobaan gratis ({applied!.code})</dt><dd>{trial} hari</dd></div> : null}
        <div className="tot"><dt>{trial ? 'Bayar hari ini' : 'Total'}</dt><dd>{rp(total)}</dd></div>
      </dl>
      {trial ? <p className="note">Setelah {trial} hari situs berhenti tampil kecuali kamu melanjutkan dengan {rp(price)} per tahun.</p> : null}
      <button type="button" className="btn primary lg" disabled={checking || (!!code.trim() && !applied)} onClick={() => create(applied ? applied.code : null)}>
        {trial ? `Mulai percobaan ${trial} hari` : total === 0 ? 'Terbitkan situs' : 'Lanjut bayar dengan QRIS'}
      </button>
      {code.trim() && !applied ? <p className="note">Tekan Terapkan dulu, atau kosongkan kode untuk membayar harga penuh.</p> : null}
    </div>
  );
}
