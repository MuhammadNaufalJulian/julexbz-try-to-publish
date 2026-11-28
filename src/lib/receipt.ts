import { q } from './db';
import { sendEmail } from './email';
import { rootUrl } from './home';
import { buildReceipt } from './receiptMail.ts';

type Row = { id: string; amount: number; discount: number; voucher_code: string | null; paid_at: Date | null; email: string; name: string | null; slug: string; plan_expires_at: Date | null };

// Dipanggil sekali setelah pesanan lunas. Tidak pernah melempar error: gagal kirim tidak boleh mengganggu pembayaran.
export async function sendReceipt(orderId: string): Promise<boolean> {
  try {
    const rows = await q<Row>(
      `select o.id, o.amount, o.discount, o.voucher_code, o.paid_at, u.email, u.name, s.slug, s.plan_expires_at
       from orders o join users u on u.id = o.user_id join sites s on s.id = o.site_id
       where o.id = $1 and o.status = 'paid' and o.plan <> 'trial' and o.amount > 0`,
      [orderId],
    );
    const r = rows[0];
    if (!r) return false;
    const m = buildReceipt({
      orderId: r.id,
      email: r.email,
      name: r.name,
      slug: r.slug,
      amount: r.amount,
      discount: r.discount,
      voucherCode: r.voucher_code,
      paidAt: new Date(r.paid_at ?? Date.now()),
      expiresAt: r.plan_expires_at ? new Date(r.plan_expires_at) : null,
    }, rootUrl());
    return await sendEmail(r.email, m.subject, m.html, m.text);
  } catch (e) {
    console.error('Bukti bayar gagal dikirim', e);
    return false;
  }
}
