import { randomInt } from 'node:crypto';
import { q } from './db';
import { computeDiscount } from './voucher';
import { REFERRAL, REWARD_SQL, genRefCode, isRefCode } from './referralCore';

// Kode referral milik pengguna. Dibuat sekali saat pertama dibutuhkan.
export async function ensureRefCode(userId: string): Promise<string | null> {
  const have = await q<{ ref_code: string | null }>('select ref_code from users where id = $1', [userId]);
  if (!have[0]) return null;
  if (have[0].ref_code) return have[0].ref_code;
  for (let i = 0; i < 6; i++) {
    try {
      const rows = await q<{ ref_code: string }>('update users set ref_code = $2 where id = $1 and ref_code is null returning ref_code', [userId, genRefCode((n) => randomInt(n))]);
      if (rows[0]) return rows[0].ref_code;
      const again = await q<{ ref_code: string | null }>('select ref_code from users where id = $1', [userId]);
      if (again[0]?.ref_code) return again[0].ref_code;
    } catch {
      // kode kebetulan bentrok dengan pengguna lain: coba kode lain
    }
  }
  return null;
}

export type ReferralInfo = { code: string; invited: number; months: number; cap: number; pct: number; monthsPer: number };

export async function getReferralInfo(userId: string): Promise<ReferralInfo | null> {
  if (!REFERRAL.enabled) return null;
  try {
    const code = await ensureRefCode(userId);
    if (!code) return null;
    const rows = await q<{ invited: string; months: string | null }>('select count(*) as invited, sum(months) as months from referrals where referrer_id = $1', [userId]);
    return { code, invited: Number(rows[0]?.invited ?? 0), months: Number(rows[0]?.months ?? 0), cap: REFERRAL.capMonths, pct: REFERRAL.discountPct, monthsPer: REFERRAL.monthsPer };
  } catch {
    // Migrasi belum dijalankan atau database sibuk: dashboard tetap tampil tanpa kartu undangan.
    return null;
  }
}

// Diskon untuk pembeli yang memakai kode referral, atau null bila tidak boleh dipakai.
// Syarat: pengundang masih berlangganan pro aktif, bukan diri sendiri, dan ini pembelian pertama pembeli.
export async function referralDiscount(buyerId: string, code: string, price: number): Promise<{ discount: number; final: number } | null> {
  if (!REFERRAL.enabled || !isRefCode(code)) return null;
  const ref = await q(
    `select 1 from users u join sites s on s.user_id = u.id
     where u.ref_code = $1 and u.id <> $2 and s.plan = 'pro' and s.published
       and (s.plan_expires_at is null or s.plan_expires_at > now()) limit 1`,
    [code, buyerId],
  );
  if (ref.length === 0) return null;
  const used = await q(
    `select 1 from orders where user_id = $1 and plan = 'pro' and status = 'paid' and amount > 0
     union all select 1 from referrals where referred_id = $1 limit 1`,
    [buyerId],
  );
  if (used.length > 0) return null;
  return computeDiscount(price, 'percent', REFERRAL.discountPct);
}

// Memberi hadiah ke pengundang setelah pesanan lunas. Tidak pernah menggagalkan pembayaran.
export async function rewardReferral(orderId: string): Promise<void> {
  try {
    await q(REWARD_SQL, [orderId, REFERRAL.monthsPer, REFERRAL.capMonths]);
  } catch (e) {
    console.error('Gagal memberi hadiah referral untuk', orderId, e);
  }
}
