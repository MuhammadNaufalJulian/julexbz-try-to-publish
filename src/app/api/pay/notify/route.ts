import { NextResponse } from 'next/server';
import { verifySignature } from '@/lib/pay';
import { getOrder, syncOrder } from '@/lib/orders';

export const dynamic = 'force-dynamic';

// Webhook dari Midtrans. Daftarkan di Midtrans Dashboard > Settings > Payment > Notification URL:
// https://julexbz.com/api/pay/notify
// Tanda tangan diperiksa, lalu status dikonfirmasi ulang langsung ke Midtrans sebelum situs diterbitkan.
export async function POST(req: Request) {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) return new NextResponse('Belum dikonfigurasi', { status: 503 });

  let body: Record<string, unknown> | null = null;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return new NextResponse('Data tidak terbaca', { status: 400 });
  }
  if (!verifySignature(body, key)) return new NextResponse('Tanda tangan salah', { status: 403 });

  // Pesanan tak dikenal (misalnya tombol "test notification" di dashboard Midtrans) cukup dijawab 200.
  const order = await getOrder(String(body.order_id));
  if (order) {
    try {
      await syncOrder(order);
    } catch (e) {
      console.error('Gagal memproses notifikasi', e);
      return new NextResponse('Gagal, coba lagi', { status: 500 }); // Midtrans akan mengirim ulang
    }
  }
  return new NextResponse('ok');
}
