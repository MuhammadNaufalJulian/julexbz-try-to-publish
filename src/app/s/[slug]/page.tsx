import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSiteForSlug, HOME_KEY, rootUrl } from '@/lib/home';
import { shareMetadata } from '@/lib/meta';
import SiteView from '@/components/SiteView';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteForSlug(slug);
  if (!site || !site.published) return { title: 'Tidak ditemukan' };
  return shareMetadata(site, { base: slug === HOME_KEY ? rootUrl() : undefined });
}

export default async function Page({ params }: Ctx) {
  const { slug } = await params;
  const site = await getSiteForSlug(slug);
  if (!site || !site.published) notFound();
  return <SiteView content={site.content} plan={site.plan} rootUrl={process.env.NEXT_PUBLIC_ROOT_URL || '/'} />;
}
