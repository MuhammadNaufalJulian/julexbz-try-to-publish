// Logika referral yang murni (tanpa database) supaya mudah dites.
// Angka bisa diubah lewat variabel lingkungan tanpa mengubah kode.

const num = (v: string | undefined, d: number, min: number, max: number): number => {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : d;
};

export const REFERRAL = {
  get enabled(): boolean {
    return process.env.REFERRAL_ENABLED !== '0';
  },
  // Diskon untuk pembeli yang memakai kode (persen dari harga paket).
  get discountPct(): number {
    return num(process.env.REFERRAL_DISCOUNT_PCT, 20, 1, 90);
  },
  // Bulan gratis untuk pengundang per pembeli yang berhasil bayar.
  get monthsPer(): number {
    return num(process.env.REFERRAL_MONTHS, 2, 1, 12);
  },
  // Batas total bulan gratis dari referral per pengundang.
  get capMonths(): number {
    return num(process.env.REFERRAL_CAP_MONTHS, 24, 1, 120);
  },
};

// Kode referral selalu berawalan REF- dan 6 karakter (tanpa huruf/angka yang mirip).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const REF_RE = /^REF-[A-HJKMNP-Z2-9]{6}$/;

export function isRefCode(code: string): boolean {
  return REF_RE.test(code);
}

export function genRefCode(rand: (max: number) => number): string {
  let tail = '';
  for (let i = 0; i < 6; i++) tail += ALPHABET[rand(ALPHABET.length)];
  return 'REF-' + tail;
}

// Berapa bulan yang benar-benar diberikan, mengingat batas total.
export function rewardMonths(alreadyGranted: number, per: number, cap: number): number {
  return Math.max(0, Math.min(per, cap - alreadyGranted));
}

// Dipanggil setelah pesanan lunas. $1 = id pesanan, $2 = bulan per undangan, $3 = batas total.
// Satu pernyataan SQL: aman dipanggil berulang (referred_id unik), dan tidak mengubah akun yang masa aktifnya tak terbatas.
export const REWARD_SQL = `
  with o as (
    select id, user_id, voucher_code from orders
    where id = $1 and status = 'paid' and plan = 'pro' and amount > 0 and voucher_code like 'REF-%'
  ),
  r as (
    select u.id as referrer_id, o.id as order_id, o.user_id as buyer_id,
      greatest(0, least($2::int, $3::int - coalesce((select sum(months)::int from referrals where referrer_id = u.id), 0))) as months
    from o join users u on u.ref_code = o.voucher_code and u.id <> o.user_id
  ),
  ins as (
    insert into referrals (referrer_id, referred_id, order_id, months)
    select referrer_id, buyer_id, order_id, months from r
    on conflict (referred_id) do nothing
    returning referrer_id, months
  )
  update sites s set plan_expires_at = greatest(s.plan_expires_at, now()) + make_interval(months => ins.months), updated_at = now()
  from ins
  where s.user_id = ins.referrer_id and s.plan = 'pro' and s.plan_expires_at is not null and ins.months > 0
  returning s.id`;
