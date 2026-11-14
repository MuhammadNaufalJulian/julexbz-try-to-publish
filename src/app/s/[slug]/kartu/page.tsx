import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSiteForSlug, HOME_KEY, rootUrl } from '@/lib/home';
import { shareMetadata } from '@/lib/meta';
import { siteAttrs } from '@/lib/templates';
import LanyardCard from '@/components/LanyardCard';
import ShareButton from '@/components/ShareButton';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteForSlug(slug);
  if (!site || !site.published) return { title: 'Tidak ditemukan' };
  return shareMetadata(site, { title: `Kartu nama ${site.content.name}`, path: '/kartu', base: slug === HOME_KEY ? rootUrl() : undefined });
}

// Halaman khusus kartu: hanya kartu 3D dan tombol aksi. Ini tautan yang enak dibagikan lewat chat atau dicetak sebagai QR.
export default async function Page({ params }: Ctx) {
  const { slug } = await params;
  const site = await getSiteForSlug(slug);
  if (!site || !site.published) notFound();
  const c = site.content;
  const sub = [c.role, c.card.org].filter(Boolean).join(' · ');

  return (
    <div className="site" {...siteAttrs(c)}>
      <div className="pad">
        <main className="kartu wrap">
          <LanyardCard c={c} />
          <h1>{c.name}</h1>
          {sub ? <p className="sub">{sub}</p> : null}
          <div className="cta">
            <a className="btn primary lg" href="/kontak.vcf">Simpan kontak</a>
            <ShareButton name={c.name} />
            <a className="btn lg" href="/">Lihat situs lengkap</a>
            {c.cv.enabled ? <a className="btn lg" href="/cv">Lihat CV</a> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
