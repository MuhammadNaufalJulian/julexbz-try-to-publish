import { getPhoto } from '@/lib/sites';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return new Response('Tidak ditemukan', { status: 404 });
  const photo = await getPhoto(id);
  if (!photo) return new Response('Tidak ditemukan', { status: 404 });
  return new Response(new Uint8Array(Buffer.from(photo.data, 'base64')), {
    headers: {
      'Content-Type': photo.mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; sandbox",
    },
  });
}
