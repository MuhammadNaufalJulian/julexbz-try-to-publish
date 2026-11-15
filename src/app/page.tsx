import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { MODE } from '@/lib/config';
import { getFirstSite } from '@/lib/sites';
import { homeSite, rootUrl } from '@/lib/home';
import { shareMetadata } from '@/lib/meta';
import { PRO, rupiah } from '@/lib/plans';
import SiteView from '@/components/SiteView';
import HomeShowcase from '@/components/HomeShowcase';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  if (MODE === 'single') {
    const site = await getFirstSite();
    if (site) return { title: site.content.siteTitle || site.content.name, description: site.content.tagline || undefined };
    return { title: 'Situs baru' };
  }
  return shareMetadata(await homeSite(), { base: rootUrl() });
}

// Mode langganan: beranda julexbz.com adalah situs pribadi pemilik, lalu muncul popup tawaran.
// Halaman harga dan fitur ada di /mulai.
export default async function Page() {
  if (MODE === 'single') {
    const site = await getFirstSite();
    if (!site) redirect('/daftar');
    return <SiteView content={site.content} plan={site.plan} rootUrl={rootUrl()} />;
  }

  const site = await homeSite();
  return <HomeShowcase content={site.content} rootUrl={rootUrl()} href="/mulai" price={`${rupiah(PRO.amount)} / tahun`} was={rupiah(PRO.listAmount)} />;
}
