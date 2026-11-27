import { getSiteForSlug, HOME_KEY, rootUrl } from '@/lib/home';
import { MODE, siteUrl } from '@/lib/config';
import { listPublishedSlugs } from '@/lib/sites';

export const dynamic = 'force-dynamic';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const xml = (urls: string[]) =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${esc(u)}</loc></url>`).join('\n')}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });

// Peta situs. Subdomain: halaman utama dan kartu situs itu. Domain utama (beranda): beranda, /mulai, dan semua situs yang sedang tampil
// supaya Google menemukan situs baru. Alamat subdomain di sitemap domain utama hanya dipakai Google kalau Search Console memakai properti "Domain".
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const site = await getSiteForSlug(slug);
  if (!site || !site.published) return new Response('Tidak ditemukan', { status: 404 });
  if (slug !== HOME_KEY) {
    const base = siteUrl(site.slug);
    return xml([base + '/', base + '/kartu']);
  }
  const root = rootUrl().replace(/\/$/, '');
  const urls = [root + '/', root + '/kartu'];
  if (MODE !== 'single') {
    urls.push(root + '/mulai');
    for (const s of await listPublishedSlugs()) urls.push(siteUrl(s) + '/');
  }
  return xml(urls);
}
