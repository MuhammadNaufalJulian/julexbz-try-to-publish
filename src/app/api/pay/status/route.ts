import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOrder, syncOrder } from '@/lib/orders';

export const dynamic = 'force-dynamic';

// Dipolling halaman bayar tiap beberapa detik. Sekaligus jadi cadangan kalau webhook terlambat atau tidak sampai
// (misalnya saat dites di komputer sendiri tanpa alamat publik).
export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ ok: false, error: 'Sesi habis.' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('order') ?? '';
  if (!/^[A-Z0-9-]{8,50}$/.test(id)) return NextResponse.json({ ok: false, error: 'Pesanan tidak valid.' }, { status: 400 });

  const order = await getOrder(id);
  if (!order || order.userId !== userId) return NextResponse.json({ ok: false, error: 'Pesanan tidak ditemukan.' }, { status: 404 });

  try {
    return NextResponse.json({ ok: true, status: await syncOrder(order) });
  } catch (e) {
    console.error('Gagal cek status', e);
    return NextResponse.json({ ok: true, status: order.status });
  }
}
