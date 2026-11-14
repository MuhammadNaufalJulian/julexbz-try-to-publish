import { getSiteForSlug, HOME_KEY, rootUrl } from '@/lib/home';
import { siteUrl } from '@/lib/config';
import { buildVcard, vcardFilename } from '@/lib/vcard';

export const dynamic = 'force-dynamic';

// Berkas kontak (.vcf) yang bisa langsung disimpan ke buku kontak HP atau komputer.
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const site = await getSiteForSlug(slug);
  if (!site || !site.published) return new Response('Tidak ditemukan', { status: 404 });
  return new Response(buildVcard(site.content, slug === HOME_KEY ? rootUrl() : siteUrl(site.slug)), {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${vcardFilename(site.slug)}"`,
      'Cache-Control': 'public, max-age=60',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
