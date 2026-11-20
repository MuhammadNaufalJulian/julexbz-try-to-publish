import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { MODE } from '@/lib/config';
import { getFirstSite } from '@/lib/sites';
import { homeSite, rootUrl } from '@/lib/home';
import { shareMetadata, personJsonLd } from '@/lib/meta';
import { PRO, rupiah } from '@/lib/plans';
import { getFeaturedPromo } from '@/lib/vouchers';
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

  const [site, promo] = await Promise.all([homeSite(), getFeaturedPromo()]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: personJsonLd(site, rootUrl()) }} />
      <HomeShowcase content={site.content} rootUrl={rootUrl()} promo={promo} href="/mulai" price={`${rupiah(PRO.amount)} / tahun`} was={rupiah(PRO.listAmount)} />
    </>
  );
}
