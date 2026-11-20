import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

// robots.txt untuk domain utama dan semua subdomain. Halaman akun tidak diindeks, sisanya boleh.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host') || '';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/admin', '/bayar', '/masuk', '/daftar', '/api/'] }],
    ...(host ? { sitemap: `${proto}://${host}/sitemap.xml` } : {}),
  };
}
