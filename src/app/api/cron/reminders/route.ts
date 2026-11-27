import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { sendRenewalReminders } from '@/lib/reminders';

export const dynamic = 'force-dynamic';

// Dipanggil Vercel Cron setiap hari. Vercel mengirim header Authorization: Bearer <CRON_SECRET>.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const got = req.headers.get('authorization') ?? '';
  const want = `Bearer ${secret ?? ''}`;
  const ok = Boolean(secret) && got.length === want.length && timingSafeEqual(Buffer.from(got), Buffer.from(want));
  if (!ok) return new NextResponse('Not found', { status: 404 });
  return NextResponse.json(await sendRenewalReminders());
}
