import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MODE } from '@/lib/config';
import { uniqueViolation } from '@/lib/db';
import { sanitizeContent } from '@/lib/content';
import { validateSlug } from '@/lib/slug';
import { getSiteByUserId, photoBelongsTo, updateSite, updateSlug } from '@/lib/sites';
import { isLimited, recordAttempt } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function PUT(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return fail('Sesi habis. Masuk lagi untuk menyimpan.', 401);

  const len = Number(req.headers.get('content-length') ?? '0');
  if (len > 200_000) return fail('Data terlalu besar.', 413);

  const key = `save:${userId}`;
  if (await isLimited(key, 60, 60)) return fail('Terlalu sering menyimpan. Tunggu sebentar.', 429);
  await recordAttempt(key);

  let body: { content?: unknown; slug?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail('Data tidak terbaca.');
  }

  const site = await getSiteByUserId(userId);
  if (!site) return fail('Situs belum dibuat.', 404);

  const parsed = sanitizeContent(body.content);
  if (!parsed.ok) return fail(parsed.error);
  const content = parsed.value;

  if (content.photoId && !(await photoBelongsTo(content.photoId, site.id))) return fail('Foto tidak ditemukan. Unggah ulang.');

  let slug = site.slug;
  if (MODE !== 'single' && typeof body.slug === 'string' && body.slug.trim().toLowerCase() !== site.slug) {
    const v = validateSlug(body.slug);
    if (!v.ok) return fail(v.error);
    try {
      await updateSlug(userId, v.slug);
      slug = v.slug;
    } catch (e) {
      if (uniqueViolation(e)) return fail('Alamat ini sudah dipakai. Pilih yang lain.', 409);
      throw e;
    }
  }

  await updateSite(userId, content);
  return NextResponse.json({ ok: true, content, slug, needsPayment: MODE !== 'single' && !site.published });
}
