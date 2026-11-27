import { NextResponse } from 'next/server';
import { isRefCode } from '@/lib/referralCore';

export const dynamic = 'force-dynamic';

// Tautan undangan: julexbz.com/r/REF-XXXXXX. Menyimpan kode 7 hari lalu mengarahkan ke pendaftaran.
// Kode baru diperiksa di halaman bayar, jadi kode palsu tidak berbahaya.
export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  let c = '';
  try {
    c = decodeURIComponent(code).trim().toUpperCase();
  } catch {
    c = ''; // %-escape rusak: abaikan kodenya, jangan error
  }
  const res = NextResponse.redirect(new URL('/daftar', req.url), 303);
  if (isRefCode(c)) {
    res.cookies.set('promo_voucher', c, { path: '/', maxAge: 7 * 24 * 3600, sameSite: 'lax', secure: new URL(req.url).protocol === 'https:' });
  }
  return res;
}
