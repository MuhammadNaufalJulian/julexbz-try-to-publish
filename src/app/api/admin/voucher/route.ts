import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { auth } from '@/auth';
import { isAdminEmail } from '@/lib/config';
import { normalizeCode, parseNewVoucher } from '@/lib/voucher';
import { createVouchers, listVouchers, setFeatured, setVoucherActive } from '@/lib/vouchers';

export const dynamic = 'force-dynamic';

// Hanya admin. Yang lain mendapat 404 supaya halaman ini tidak ketahuan ada.
async function admin() {
  const s = await auth();
  return s?.user?.id && isAdminEmail(s.user.email) ? s.user : null;
}
const notFound = () => new NextResponse('Tidak ditemukan', { status: 404 });
const isJson = (req: Request) => (req.headers.get('content-type') || '').toLowerCase().startsWith('application/json');

export async function GET() {
  if (!(await admin())) return notFound();
  return NextResponse.json({ ok: true, vouchers: await listVouchers() });
}

// Buat voucher (satu atau banyak).
export async function POST(req: Request) {
  if (!(await admin())) return notFound();
  if (!isJson(req)) return NextResponse.json({ ok: false, error: 'Format tidak valid.' }, { status: 415 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const p = parseNewVoucher(body);
  if (!p.ok) return NextResponse.json({ ok: false, error: p.error }, { status: 400 });
  const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 100) : null;
  const res = await createVouchers(p.v, note);
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 409 });
  return NextResponse.json({ ok: true, codes: res.codes });
}

// Nyalakan/matikan voucher, atau pilih voucher unggulan untuk popup beranda ({ code, featured: true|false }).
export async function PATCH(req: Request) {
  if (!(await admin())) return notFound();
  if (!isJson(req)) return NextResponse.json({ ok: false, error: 'Format tidak valid.' }, { status: 415 });
  const body = (await req.json().catch(() => ({}))) as { code?: unknown; active?: unknown; featured?: unknown };
  const code = normalizeCode(body.code);
  if (!code) return NextResponse.json({ ok: false, error: 'Permintaan tidak valid.' }, { status: 400 });
  if (typeof body.featured === 'boolean') {
    const ok = await setFeatured(body.featured ? code : null);
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, error: 'Voucher tidak ditemukan atau sedang mati.' }, { status: 404 });
  }
  if (typeof body.active !== 'boolean') return NextResponse.json({ ok: false, error: 'Permintaan tidak valid.' }, { status: 400 });
  const ok = await setVoucherActive(code, body.active);
  if (ok && !body.active) await q('update vouchers set featured = false where code = $1', [code]);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, error: 'Voucher tidak ditemukan.' }, { status: 404 });
}
