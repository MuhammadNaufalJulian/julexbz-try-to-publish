import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSiteForSlug, HOME_KEY, rootUrl } from '@/lib/home';
import { CV_STYLES, type CvStyle } from '@/lib/content';
import CvView from '@/components/CvView';
import PrintBar from '@/components/PrintBar';

export const dynamic = 'force-dynamic';

type Ctx = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteForSlug(slug);
  if (!site || !site.published || !site.content.cv.enabled) return { title: 'Tidak ditemukan' };
  // CV memuat nomor telepon dan riwayat kerja, jadi tidak perlu muncul di mesin pencari.
  return { title: `CV ${site.content.name}`, robots: { index: false, follow: false } };
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Page({ params, searchParams }: Ctx) {
  const { slug } = await params;
  const sp = await searchParams;
  const site = await getSiteForSlug(slug);
  if (!site || !site.published || !site.content.cv.enabled) notFound();

  const c = site.content;
  const wanted = first(sp.gaya);
  const style: CvStyle = wanted && (CV_STYLES as readonly string[]).includes(wanted) ? (wanted as CvStyle) : c.cv.style;

  return (
    <div className="cv-root" data-theme={c.theme}>
      <div className="pad">
        <PrintBar style={style} auto={first(sp.cetak) === '1'} />
      </div>
      <CvView c={c} style={style} />
    </div>
  );
}
