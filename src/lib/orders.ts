import { q } from './db';
import { fetchStatus } from './midtrans';
import { PRO } from './plans';
import type { OrderStatus } from './pay';
import { rewardReferral } from './referral';
import { sendReceipt } from './receipt';

export type Order = { id: string; userId: string; siteId: string; plan: string; amount: number; status: OrderStatus; qrUrl: string | null; voucherCode: string | null };

type Row = { id: string; user_id: string; site_id: string; plan: string; amount: number; status: string; qr_url: string | null; voucher_code: string | null };

const COLS = 'id, user_id, site_id, plan, amount, status, qr_url, voucher_code';

function toOrder(r: Row): Order {
  return { id: r.id, userId: r.user_id, siteId: r.site_id, plan: r.plan, amount: r.amount, status: r.status as OrderStatus, qrUrl: r.qr_url, voucherCode: r.voucher_code };
}

export async function createOrder(id: string, userId: string, siteId: string, amount: number, voucherCode: string | null = null, discount = 0, plan: string = PRO.id): Promise<void> {
  await q('insert into orders (id, user_id, site_id, plan, amount, voucher_code, discount) values ($1, $2, $3, $4, $5, $6, $7)', [id, userId, siteId, plan, amount, voucherCode, discount]);
}

export async function getOrder(id: string): Promise<Order | null> {
  const rows = await q<Row>(`select ${COLS} from orders where id = $1`, [id]);
  return rows[0] ? toOrder(rows[0]) : null;
}

// Pesanan menunggu yang masih baru: dipakai ulang supaya klik berkali-kali tidak membuat banyak QR.
export const REUSE_MINUTES = 10;
export async function latestPendingOrder(userId: string): Promise<Order | null> {
  const rows = await q<Row>(
    `select ${COLS} from orders
     where user_id = $1 and status = 'pending' and qr_url is not null and created_at > now() - make_interval(mins => $2)
     order by created_at desc limit 1`,
    [userId, REUSE_MINUTES],
  );
  return rows[0] ? toOrder(rows[0]) : null;
}

export async function setQr(id: string, qrUrl: string, ref: string): Promise<void> {
  await q('update orders set qr_url = $2, provider_ref = $3 where id = $1', [id, qrUrl, ref]);
}

// Hanya pesanan yang masih menunggu yang boleh berubah jadi kedaluwarsa atau gagal.
export async function markStatus(id: string, status: 'expired' | 'failed'): Promise<void> {
  await q(`update orders set status = $2 where id = $1 and status = 'pending'`, [id, status]);
}

// Satu pernyataan SQL: menandai lunas dan menerbitkan situs sekaligus, dan hanya berjalan sekali per pesanan
// (webhook dan polling boleh datang bersamaan). Perpanjangan menambah masa aktif dari tanggal berakhir yang lama.
export const SETTLE_SQL = `
  with o as (
    update orders set status = 'paid', paid_at = now() where id = $1 and status <> 'paid' returning site_id, plan, voucher_code
  ),
  v as (
    update vouchers set used = used + 1 where code = (select voucher_code from o) returning 1
  )
  update sites s set plan = o.plan, published = true,
    plan_expires_at = case when o.plan = 'trial' then now() + make_interval(days => $3)
      else greatest(coalesce(s.plan_expires_at, now()), now()) + make_interval(months => $2) end,
    updated_at = now()
  from o where s.id = o.site_id
  returning s.id`;

// trialDays hanya dipakai pesanan berjenis trial. Pesanan lain mengabaikannya.
export async function settleOrder(id: string, trialDays = 0): Promise<boolean> {
  const rows = await q(SETTLE_SQL, [id, PRO.months, trialDays]);
  if (rows.length > 0) {
    await rewardReferral(id);
    await sendReceipt(id); // aman: tidak pernah melempar error, dan hanya jalan sekali per pesanan
  }
  return rows.length > 0;
}

// Cocokkan pesanan dengan status di Midtrans. Aman dipanggil berulang dan dari mana saja.
export async function syncOrder(o: Order): Promise<OrderStatus> {
  if (o.status === 'paid') return 'paid';
  const st = await fetchStatus(o.id);
  if (!st) return o.status;
  if (st.status === 'paid') {
    if (st.amount !== o.amount) {
      console.error(`Nominal tidak cocok untuk ${o.id}: Midtrans ${st.amount}, pesanan ${o.amount}`);
      return o.status;
    }
    await settleOrder(o.id);
    return 'paid';
  }
  if (st.status === 'expired' || st.status === 'failed') await markStatus(o.id, st.status);
  return st.status;
}
