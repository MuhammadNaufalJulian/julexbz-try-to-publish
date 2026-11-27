// Logika voucher yang murni (tanpa database) supaya mudah dites.

export type Voucher = {
  code: string;
  kind: 'percent' | 'fixed' | 'trial'; // trial: value = jumlah hari percobaan gratis
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

export type VoucherCheck = { ok: true; discount: number; final: number; trialDays?: number } | { ok: false; reason: 'inactive' | 'expired' | 'exhausted' | 'too_small' };

export function checkVoucher(v: Voucher, price: number, now: Date = new Date()): VoucherCheck {
  if (!v.active) return { ok: false, reason: 'inactive' };
  if (v.expiresAt && v.expiresAt.getTime() <= now.getTime()) return { ok: false, reason: 'expired' };
  if (v.maxUses !== null && v.used >= v.maxUses) return { ok: false, reason: 'exhausted' };
  // Voucher percobaan tidak mengurangi harga: situs terbit gratis selama sekian hari, harga penuh berlaku setelahnya.
  if (v.kind === 'trial') return { ok: true, discount: 0, final: price, trialDays: v.value };
  const { discount, final } = computeDiscount(price, v.kind, v.value);
  // Gratis penuh boleh (tidak lewat Midtrans). Sisa kecil yang tak bisa ditagih ditolak.
  if (final > 0 && final < MIN_CHARGE) return { ok: false, reason: 'too_small' };
  return { ok: true, discount, final };
}

// ---------- pembuat voucher (dipakai halaman admin) ----------

// Tanpa huruf/angka yang mirip (0 O 1 I L) supaya kode mudah dibaca dan diketik teman.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function randomCode(prefix: string, rand: (max: number) => number, len = 5): string {
  let tail = '';
  for (let i = 0; i < len; i++) tail += ALPHABET[rand(ALPHABET.length)];
  return prefix ? `${prefix}-${tail}` : tail.length >= 3 ? tail : tail.padEnd(3, 'X');
}

export type NewVoucherInput = {
  kind: 'percent' | 'fixed' | 'trial';
  value: number;
  maxUses: number | null;
  validDays: number | null;
  count: number;
  prefix: string;
  code: string; // dipakai kalau count = 1 dan ingin kode buatan sendiri
};

const int = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : NaN);

// Memeriksa isian form. Mengembalikan pesan kesalahan (bahasa Indonesia) atau data yang sudah rapi.
export function parseNewVoucher(raw: unknown): { ok: true; v: NewVoucherInput } | { ok: false; error: string } {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const kind = r.kind;
  if (kind !== 'percent' && kind !== 'fixed' && kind !== 'trial') return { ok: false, error: 'Pilih jenis voucher.' };
  const value = int(r.value);
  if (!(value >= 1)) return { ok: false, error: 'Nilai harus bilangan bulat, minimal 1.' };
  if (kind === 'percent' && value > 100) return { ok: false, error: 'Persen maksimal 100.' };
  if (kind === 'trial' && value > 90) return { ok: false, error: 'Percobaan maksimal 90 hari.' };
  if (kind === 'fixed' && value > 10_000_000) return { ok: false, error: 'Potongan terlalu besar.' };

  let maxUses: number | null = null;
  if (r.maxUses !== null && r.maxUses !== undefined && r.maxUses !== '') {
    maxUses = int(r.maxUses);
    if (!(maxUses >= 1 && maxUses <= 100000)) return { ok: false, error: 'Kuota harus bilangan bulat 1 sampai 100000, atau kosongkan.' };
  }
  let validDays: number | null = null;
  if (r.validDays !== null && r.validDays !== undefined && r.validDays !== '') {
    validDays = int(r.validDays);
    if (!(validDays >= 1 && validDays <= 3650)) return { ok: false, error: 'Masa berlaku 1 sampai 3650 hari, atau kosongkan.' };
  }
  const count = r.count === undefined || r.count === null || r.count === '' ? 1 : int(r.count);
  if (!(count >= 1 && count <= 50)) return { ok: false, error: 'Jumlah kode 1 sampai 50.' };

  const prefixRaw = typeof r.prefix === 'string' ? r.prefix.trim().toUpperCase() : '';
  if (prefixRaw && !/^[A-Z0-9_]{1,16}$/.test(prefixRaw)) return { ok: false, error: 'Awalan: huruf besar atau angka, maksimal 16 karakter.' };

  if (prefixRaw.startsWith('REF')) return { ok: false, error: 'Awalan REF dipakai untuk kode referral. Pilih awalan lain.' };

  const codeRaw = typeof r.code === 'string' ? r.code.trim() : '';
  const code = codeRaw ? normalizeCode(codeRaw) : '';
  if (codeRaw && !code) return { ok: false, error: 'Kode: 3 sampai 30 karakter, huruf besar, angka, - atau _.' };
  if (code && code.startsWith('REF')) return { ok: false, error: 'Kode berawalan REF dipakai untuk referral. Pilih kode lain.' };
  if (code && count !== 1) return { ok: false, error: 'Kode buatan sendiri hanya untuk 1 kode. Kosongkan untuk membuat acak.' };

  return { ok: true, v: { kind, value, maxUses, validDays, count, prefix: prefixRaw, code: code ?? '' } };
}
