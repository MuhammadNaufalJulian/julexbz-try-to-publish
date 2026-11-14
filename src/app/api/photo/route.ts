import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSiteByUserId, savePhoto } from '@/lib/sites';
import { isLimited, recordAttempt } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 700_000;

// Mengenali jenis gambar dari isi file, bukan dari header yang dikirim klien.
function sniff(b: Uint8Array): string | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return null;
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ ok: false, error: 'Sesi habis. Masuk lagi.' }, { status: 401 });

  const declared = Number(req.headers.get('content-length') ?? '0');
  if (declared > MAX_BYTES) return NextResponse.json({ ok: false, error: 'Foto terlalu besar.' }, { status: 413 });

  const key = `photo:${userId}`;
  if (await isLimited(key, 20, 3600)) return NextResponse.json({ ok: false, error: 'Terlalu banyak unggahan. Coba lagi nanti.' }, { status: 429 });

  const site = await getSiteByUserId(userId);
  if (!site) return NextResponse.json({ ok: false, error: 'Situs belum dibuat.' }, { status: 404 });

  const buf = new Uint8Array(await req.arrayBuffer());
  if (buf.length === 0 || buf.length > MAX_BYTES) return NextResponse.json({ ok: false, error: 'Foto terlalu besar.' }, { status: 413 });
  const mime = sniff(buf);
  if (!mime) return NextResponse.json({ ok: false, error: 'Format foto harus JPG, PNG, atau WebP.' }, { status: 415 });

  await recordAttempt(key);
  const id = await savePhoto(site.id, mime, Buffer.from(buf).toString('base64'));
  return NextResponse.json({ ok: true, id });
}
