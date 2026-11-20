import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { quote } from '@/lib/vouchers';
import { isLimited, recordAttempt } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

// Cek voucher dan hitung harga akhir. Dibatasi supaya kode tidak bisa ditebak dengan coba-coba.
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ ok: false, error: 'Sesi habis. Masuk lagi.' }, { status: 401 });

  const key = `voucher:${userId}`;
  if (await isLimited(key, 15, 600)) return NextResponse.json({ ok: false, error: 'Terlalu banyak percobaan. Tunggu beberapa menit.' }, { status: 429 });
  await recordAttempt(key);

  const body = (await req.json().catch(() => ({}))) as { voucher?: unknown };
  const qt = await quote(userId, body.voucher);
  if (!qt.ok) return NextResponse.json({ ok: false, error: qt.error }, { status: 400 });
  return NextResponse.json({ ok: true, code: qt.code, price: qt.price, discount: qt.discount, final: qt.final });
}
