import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MODE } from '@/lib/config';
import { getSiteByUserId } from '@/lib/sites';
import { newOrderId } from '@/lib/pay';
import { chargeQris, midtransConfigured } from '@/lib/midtrans';
import { createOrder, latestPendingOrder, markStatus, setQr, settleOrder, syncOrder } from '@/lib/orders';
import { quote } from '@/lib/vouchers';
import { TRIAL } from '@/lib/plans';
import { isLimited, recordAttempt } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

// Membuat (atau memakai ulang) kode QRIS untuk situs milik pengguna yang sedang masuk.
// Nominal selalu dari server (PRO.amount), tidak pernah dari browser.
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return fail('Sesi habis. Masuk lagi.', 401);
  if (MODE === 'single') return fail('Pembayaran tidak dipakai di mode ini.', 400);
  if (!midtransConfigured()) return fail('Pembayaran belum dikonfigurasi di server.', 503);

  const site = await getSiteByUserId(userId);
  if (!site) return fail('Situs belum dibuat.', 404);

  const body = (await req.json().catch(() => ({}))) as { voucher?: unknown };

  const key = `pay:${userId}`;
  if (await isLimited(key, 10, 600)) return fail('Terlalu sering membuat kode bayar. Tunggu beberapa menit.', 429);

  // Pesanan menunggu yang masih baru dipakai ulang. Kalau ternyata sudah dibayar, langsung beri tahu.
  const qt = await quote(userId, body.voucher);
  if (!qt.ok) return fail(qt.error, 400);

  // Voucher percobaan: situs terbit gratis selama sekian hari tanpa Midtrans. Setelah itu harus bayar.
  if (qt.trialDays) {
    await recordAttempt(key);
    const trialId = newOrderId();
    await createOrder(trialId, userId, site.id, 0, qt.code, 0, TRIAL.id);
    await settleOrder(trialId, qt.trialDays);
    return NextResponse.json({ ok: true, status: 'paid', orderId: trialId, amount: 0, qrUrl: null, trialDays: qt.trialDays });
  }

  // Dipakai ulang hanya kalau voucher-nya sama (atau tidak diminta lain), supaya harga yang tampil tidak berubah diam-diam.
  const existing = await latestPendingOrder(userId);
  if (existing && (existing.voucherCode ?? null) === qt.code) {
    const status = await syncOrder(existing);
    if (status === 'paid') return NextResponse.json({ ok: true, status: 'paid', orderId: existing.id, amount: existing.amount, qrUrl: null });
    if (status === 'pending') return NextResponse.json({ ok: true, status, orderId: existing.id, amount: existing.amount, qrUrl: existing.qrUrl });
  }

  await recordAttempt(key);
  const orderId = newOrderId();
  await createOrder(orderId, userId, site.id, qt.final, qt.code, qt.discount);

  // Voucher 100%: tidak perlu bayar, langsung terbit.
  if (qt.final === 0) {
    await settleOrder(orderId);
    return NextResponse.json({ ok: true, status: 'paid', orderId, amount: 0, qrUrl: null });
  }

  try {
    const { qrUrl, transactionId } = await chargeQris({ orderId, amount: qt.final, itemName: 'julexbz situs + kartu digital 1 tahun' });
    await setQr(orderId, qrUrl, transactionId);
    return NextResponse.json({ ok: true, status: 'pending', orderId, amount: qt.final, qrUrl });
  } catch (e) {
    console.error('Gagal membuat QRIS', e);
    await markStatus(orderId, 'failed');
    return fail('Kode QRIS gagal dibuat. Coba lagi sebentar lagi.', 502);
  }
}
