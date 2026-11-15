'use client';

import { useCallback, useEffect, useState } from 'react';

type Kind = 'percent' | 'fixed' | 'trial';
type Row = { code: string; kind: Kind; value: number; used: number; maxUses: number | null; expiresAt: string | null; active: boolean; note: string | null };
type Form = { kind: Kind; value: string; count: string; prefix: string; code: string; maxUses: string; validDays: string; note: string };

const rp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
const PRESETS: { name: string; f: Form }[] = [
  { name: 'Teman diskon 80%', f: { kind: 'percent', value: '80', count: '5', prefix: 'TEMAN', code: '', maxUses: '1', validDays: '', note: 'Teman' } },
  { name: 'Event diskon 50%', f: { kind: 'percent', value: '50', count: '1', prefix: 'EVENT', code: '', maxUses: '100', validDays: '14', note: 'Event' } },
  { name: 'Percobaan 7 hari', f: { kind: 'trial', value: '7', count: '1', prefix: 'TRIAL', code: '', maxUses: '100', validDays: '', note: 'Percobaan' } },
];
const EMPTY: Form = { kind: 'percent', value: '20', count: '1', prefix: '', code: '', maxUses: '', validDays: '', note: '' };

function label(r: Pick<Row, 'kind' | 'value'>) {
  return r.kind === 'percent' ? `${r.value}%` : r.kind === 'trial' ? `${r.value} hari gratis` : rp(r.value);
}

export default function VoucherAdmin({ price, rootUrl }: { price: number; rootUrl: string }) {
  const [f, setF] = useState<Form>(EMPTY);
  const [rows, setRows] = useState<Row[]>([]);
  const [made, setMade] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');

  const base = rootUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const link = (c: string) => `${base}/bayar?voucher=${encodeURIComponent(c)}`;
  const set = (k: keyof Form, v: string) => setF((p) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/voucher', { cache: 'no-store' });
      const d = await res.json().catch(() => ({}));
      if (d.ok) setRows(d.vouchers);
    } catch {
      /* tabel tetap seperti sebelumnya */
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      setMsg('Salin gagal. Salin manual.');
    }
  }

  async function create() {
    setBusy(true);
    setMsg('');
    setMade([]);
    const num = (s: string) => (s.trim() === '' ? null : Number(s));
    try {
      const res = await fetch('/api/admin/voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: f.kind, value: Number(f.value), count: Number(f.count || 1), prefix: f.prefix, code: f.code, maxUses: num(f.maxUses), validDays: num(f.validDays), note: f.note }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) setMsg(d.error || 'Gagal membuat voucher.');
      else {
        setMade(d.codes);
        load();
      }
    } catch {
      setMsg('Tidak ada koneksi. Coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(r: Row) {
    const res = await fetch('/api/admin/voucher', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: r.code, active: !r.active }) });
    if (res.ok) load();
    else setMsg('Gagal mengubah status.');
  }

  const v = Number(f.value);
  const preview =
    f.kind === 'trial'
      ? Number.isInteger(v) && v >= 1 ? `Situs terbit gratis ${v} hari, lalu harus bayar ${rp(price)}.` : ''
      : Number.isInteger(v) && v >= 1
        ? (() => {
            const off = f.kind === 'percent' ? Math.floor((price * Math.min(v, 100)) / 100) : Math.min(v, price);
            const fin = price - off;
            return fin === 0 ? 'Gratis penuh.' : `Harga jadi ${rp(fin)} (dari ${rp(price)}).`;
          })()
        : '';

  const allText = made.join('\n');

  return (
    <>
      <section className="box" aria-label="Preset">
        <p className="note">Pilih contoh lalu ubah angkanya kalau perlu:</p>
        <div className="cta">
          {PRESETS.map((p) => (
            <button key={p.name} type="button" className="btn sm" onClick={() => { setF(p.f); setMade([]); setMsg(''); }}>{p.name}</button>
          ))}
        </div>
      </section>

      <section className="box vform" aria-label="Buat voucher">
        <div className="fld">
          <label htmlFor="v-kind">Jenis</label>
          <select id="v-kind" value={f.kind} onChange={(e) => set('kind', e.target.value)}>
            <option value="percent">Diskon persen (%)</option>
            <option value="fixed">Potongan rupiah (Rp)</option>
            <option value="trial">Percobaan gratis (hari)</option>
          </select>
        </div>
        <div className="fld">
          <label htmlFor="v-val">{f.kind === 'percent' ? 'Besar diskon (%)' : f.kind === 'fixed' ? 'Potongan (Rp)' : 'Lama percobaan (hari)'}</label>
          <input id="v-val" inputMode="numeric" value={f.value} onChange={(e) => set('value', e.target.value.replace(/\D/g, ''))} />
          {preview ? <p className="note">{preview}</p> : null}
        </div>
        <div className="fld">
          <label htmlFor="v-count">Jumlah kode yang dibuat (1 sampai 50)</label>
          <input id="v-count" inputMode="numeric" value={f.count} onChange={(e) => set('count', e.target.value.replace(/\D/g, ''))} />
          <p className="note">Untuk teman: buat 5 kode, tiap kode kuota 1, lalu bagikan satu kode per orang.</p>
        </div>
        <div className="fld">
          <label htmlFor="v-quota">Kuota per kode (kosong = tanpa batas)</label>
          <input id="v-quota" inputMode="numeric" value={f.maxUses} onChange={(e) => set('maxUses', e.target.value.replace(/\D/g, ''))} />
        </div>
        <div className="fld">
          <label htmlFor="v-days">Berlaku berapa hari (kosong = sampai kuota habis)</label>
          <input id="v-days" inputMode="numeric" value={f.validDays} onChange={(e) => set('validDays', e.target.value.replace(/\D/g, ''))} />
        </div>
        <div className="fld">
          <label htmlFor="v-prefix">Awalan kode acak (opsional)</label>
          <input id="v-prefix" value={f.prefix} maxLength={16} autoCapitalize="characters" onChange={(e) => set('prefix', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))} />
          <p className="note">Contoh awalan TEMAN menghasilkan TEMAN-K7XQ2.</p>
        </div>
        <div className="fld">
          <label htmlFor="v-code">Atau tulis kode sendiri (hanya jika jumlah = 1)</label>
          <input id="v-code" value={f.code} maxLength={30} autoCapitalize="characters" onChange={(e) => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))} />
        </div>
        <div className="fld">
          <label htmlFor="v-note">Catatan untuk dirimu (opsional)</label>
          <input id="v-note" value={f.note} maxLength={100} onChange={(e) => set('note', e.target.value)} />
        </div>
        <button type="button" className="btn primary lg" disabled={busy} onClick={create}>{busy ? 'Membuat...' : 'Buat voucher'}</button>
        {msg ? <p role="alert">{msg}</p> : null}
      </section>

      {made.length ? (
        <section className="box" aria-label="Kode baru" role="status">
          <h2>{made.length} kode dibuat</h2>
          <ul className="vlist">
            {made.map((c) => (
              <li key={c}>
                <code>{c}</code>
                <button type="button" className="btn sm" onClick={() => copy(c, c)}>{copied === c ? 'Tersalin' : 'Salin kode'}</button>
                <button type="button" className="btn sm" onClick={() => copy(link(c), 'l' + c)}>{copied === 'l' + c ? 'Tersalin' : 'Salin tautan'}</button>
              </li>
            ))}
          </ul>
          {made.length > 1 ? <button type="button" className="btn" onClick={() => copy(allText, 'all')}>{copied === 'all' ? 'Tersalin' : 'Salin semua kode'}</button> : null}
        </section>
      ) : null}

      <section aria-label="Daftar voucher">
        <h2>Semua voucher</h2>
        {rows.length === 0 ? <p className="note">Belum ada voucher.</p> : null}
        <ul className="vlist">
          {rows.map((r) => {
            const out = r.maxUses !== null && r.used >= r.maxUses;
            const exp = r.expiresAt && new Date(r.expiresAt).getTime() <= Date.now();
            const state = !r.active ? 'mati' : out ? 'habis' : exp ? 'kedaluwarsa' : 'aktif';
            return (
              <li key={r.code} data-state={state}>
                <code>{r.code}</code>
                <span>{label(r)}</span>
                <span>terpakai {r.used}{r.maxUses !== null ? `/${r.maxUses}` : ''}</span>
                <span>{r.expiresAt ? `s/d ${new Date(r.expiresAt).toLocaleDateString('id-ID')}` : 'tanpa batas waktu'}</span>
                {r.note ? <span className="note">{r.note}</span> : null}
                <strong>{state}</strong>
                <button type="button" className="btn sm" onClick={() => copy(link(r.code), 'r' + r.code)}>{copied === 'r' + r.code ? 'Tersalin' : 'Salin tautan'}</button>
                <button type="button" className="btn sm" onClick={() => toggle(r)}>{r.active ? 'Matikan' : 'Nyalakan'}</button>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
