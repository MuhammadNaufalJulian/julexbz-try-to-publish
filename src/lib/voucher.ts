// Logika voucher yang murni (tanpa database) supaya mudah dites.

export type Voucher = {
  code: string;
  kind: 'percent' | 'fixed';
  value: number;
  maxUses: number | null;
  used: number;
  expiresAt: Date | null;
  active: boolean;
};

// Batas bawah nominal yang dikirim ke Midtrans. Angka konservatif dari saya, bukan dari dokumentasi Midtrans.
export const MIN_CHARGE = 1000;

export function normalizeCode(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const c = v.trim().toUpperCase();
  return /^[A-Z0-9_-]{3,30}$/.test(c) ? c : null;
}

export function computeDiscount(price: number, kind: 'percent' | 'fixed', value: number): { discount: number; final: number } {
  const raw = kind === 'percent' ? Math.floor((price * Math.min(value, 100)) / 100) : value;
  const discount = Math.max(0, Math.min(price, Math.floor(raw)));
  return { discount, final: price - discount };
}

export type VoucherCheck = { ok: true; discount: number; final: number } | { ok: false; reason: 'inactive' | 'expired' | 'exhausted' | 'too_small' };

export function checkVoucher(v: Voucher, price: number, now: Date = new Date()): VoucherCheck {
  if (!v.active) return { ok: false, reason: 'inactive' };
  if (v.expiresAt && v.expiresAt.getTime() <= now.getTime()) return { ok: false, reason: 'expired' };
  if (v.maxUses !== null && v.used >= v.maxUses) return { ok: false, reason: 'exhausted' };
  const { discount, final } = computeDiscount(price, v.kind, v.value);
  // Gratis penuh boleh (tidak lewat Midtrans). Sisa kecil yang tak bisa ditagih ditolak.
  if (final > 0 && final < MIN_CHARGE) return { ok: false, reason: 'too_small' };
  return { ok: true, discount, final };
}
