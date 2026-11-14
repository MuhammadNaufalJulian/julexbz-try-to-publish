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

export type Quote = { ok: true; code: string | null; price: number; discount: number; final: number } | { ok: false; error: string };

// Hitung harga akhir. Tanpa kode: harga penuh. Semua alasan penolakan dijawab sama agar kode tidak bisa ditebak.
export async function quote(userId: string, raw: unknown): Promise<Quote> {
  const price = PRO.amount;
  if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) return { ok: true, code: null, price, discount: 0, final: price };
  const code = normalizeCode(raw);
  if (!code) return { ok: false, error: VOUCHER_ERROR };
  const v = await getVoucher(code);
  if (!v) return { ok: false, error: VOUCHER_ERROR };
  const chk = checkVoucher(v, price);
  if (!chk.ok) return { ok: false, error: VOUCHER_ERROR };
  if (await userUsedVoucher(userId, code)) return { ok: false, error: VOUCHER_ERROR };
  return { ok: true, code, price, discount: chk.discount, final: chk.final };
}
