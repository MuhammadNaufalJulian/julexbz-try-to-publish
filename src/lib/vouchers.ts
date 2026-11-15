import { q } from './db';
import { PRO } from './plans';
import { checkVoucher, normalizeCode, type Voucher } from './voucher';

type Row = { code: string; kind: string; value: number; max_uses: number | null; used: number; expires_at: Date | string | null; active: boolean };

export async function getVoucher(code: string): Promise<Voucher | null> {
  const rows = await q<Row>('select code, kind, value, max_uses, used, expires_at, active from vouchers where code = $1', [code]);
  const r = rows[0];
  if (!r) return null;
  return { code: r.code, kind: r.kind as Voucher['kind'], value: r.value, maxUses: r.max_uses, used: r.used, expiresAt: r.expires_at ? new Date(r.expires_at) : null, active: r.active };
}

// Satu pengguna hanya boleh memakai satu voucher sekali (dihitung dari pesanan yang sudah lunas).
export async function userUsedVoucher(userId: string, code: string): Promise<boolean> {
  const rows = await q(`select 1 from orders where user_id = $1 and voucher_code = $2 and status = 'paid' limit 1`, [userId, code]);
  return rows.length > 0;
}

export const VOUCHER_ERROR = 'Kode voucher tidak berlaku.';

// Percobaan hanya sekali per pengguna (kode apa pun), dan tidak untuk situs yang sedang berlangganan pro.
async function trialNotAllowed(userId: string): Promise<boolean> {
  const used = await q(`select 1 from orders where user_id = $1 and plan = 'trial' and status = 'paid' limit 1`, [userId]);
  if (used.length > 0) return true;
  const pro = await q(`select 1 from sites where user_id = $1 and plan = 'pro' and (plan_expires_at is null or plan_expires_at > now()) and published limit 1`, [userId]);
  return pro.length > 0;
}

export type Quote = { ok: true; code: string | null; price: number; discount: number; final: number; trialDays: number | null } | { ok: false; error: string };

// Hitung harga akhir. Tanpa kode: harga penuh. Semua alasan penolakan dijawab sama agar kode tidak bisa ditebak.
export async function quote(userId: string, raw: unknown): Promise<Quote> {
  const price = PRO.amount;
  if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) return { ok: true, code: null, price, discount: 0, final: price, trialDays: null };
  const code = normalizeCode(raw);
  if (!code) return { ok: false, error: VOUCHER_ERROR };
  const v = await getVoucher(code);
  if (!v) return { ok: false, error: VOUCHER_ERROR };
  const chk = checkVoucher(v, price);
  if (!chk.ok) return { ok: false, error: VOUCHER_ERROR };
  if (await userUsedVoucher(userId, code)) return { ok: false, error: VOUCHER_ERROR };
  if (chk.trialDays && (await trialNotAllowed(userId))) return { ok: false, error: VOUCHER_ERROR };
  return { ok: true, code, price, discount: chk.discount, final: chk.final, trialDays: chk.trialDays ?? null };
}

// ---------- admin ----------
import { randomInt } from 'node:crypto';
import { randomCode, type NewVoucherInput } from './voucher';

export type VoucherRow = { code: string; kind: Voucher['kind']; value: number; used: number; maxUses: number | null; expiresAt: string | null; active: boolean; note: string | null };

export async function listVouchers(): Promise<VoucherRow[]> {
  const rows = await q<{ code: string; kind: string; value: number; used: number; max_uses: number | null; expires_at: Date | string | null; active: boolean; note: string | null }>(
    'select code, kind, value, used, max_uses, expires_at, active, note from vouchers order by created_at desc limit 300',
  );
  return rows.map((r) => ({ code: r.code, kind: r.kind as Voucher['kind'], value: r.value, used: r.used, maxUses: r.max_uses, expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null, active: r.active, note: r.note }));
}

async function insertOne(code: string, v: NewVoucherInput, note: string | null): Promise<boolean> {
  const rows = await q(
    `insert into vouchers (code, kind, value, max_uses, expires_at, note)
     values ($1, $2, $3, $4, case when $5::int is null then null else now() + make_interval(days => $5::int) end, $6)
     on conflict (code) do nothing returning code`,
    [code, v.kind, v.value, v.maxUses, v.validDays, note],
  );
  return rows.length > 0;
}

// Membuat satu atau banyak kode. Kode acak yang kebetulan bentrok diulang. Kode buatan sendiri yang sudah ada ditolak.
export async function createVouchers(v: NewVoucherInput, note: string | null): Promise<{ ok: true; codes: string[] } | { ok: false; error: string }> {
  if (v.code) {
    return (await insertOne(v.code, v, note)) ? { ok: true, codes: [v.code] } : { ok: false, error: `Kode ${v.code} sudah ada.` };
  }
  const codes: string[] = [];
  for (let tries = 0; codes.length < v.count && tries < v.count * 5; tries++) {
    const c = randomCode(v.prefix, (n) => randomInt(n));
    if (codes.includes(c)) continue;
    if (await insertOne(c, v, note)) codes.push(c);
  }
  return codes.length === v.count ? { ok: true, codes } : { ok: false, error: 'Gagal membuat semua kode. Coba lagi.' };
}

export async function setVoucherActive(code: string, active: boolean): Promise<boolean> {
  const rows = await q('update vouchers set active = $2 where code = $1 returning code', [code, active]);
  return rows.length > 0;
}
