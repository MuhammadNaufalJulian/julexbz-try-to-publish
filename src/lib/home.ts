import { ownerContent } from './owner';
import { freeEmails, homeSlug } from './config';
import { getSiteByOwnerEmails, getSiteBySlug, type Site } from './sites';

// Kunci internal untuk situs beranda. middleware mengarahkan julexbz.com/kartu, /cv, dll ke /s/_home/...
export const HOME_KEY = '_home';

export const rootUrl = () => process.env.NEXT_PUBLIC_ROOT_URL || 'http://localhost:3000';

// Isi awal beranda kalau situs pemilik belum dibuat di dashboard (lihat src/lib/owner.ts).
export const ownerFallback = ownerContent;

// Situs yang tampil di julexbz.com. Urutan: HOME_SLUG, lalu situs milik email di FREE_EMAILS, lalu isi awal di atas.
export async function homeSite(): Promise<Site> {
  const slug = homeSlug();
  if (slug) {
    const s = await getSiteBySlug(slug);
    if (s && s.published) return s;
  }
  const own = await getSiteByOwnerEmails(freeEmails());
  if (own && own.published) return own;
  return { id: 'home', userId: '', slug: 'home', plan: 'pro', published: true, planExpiresAt: null, content: ownerFallback() };
}

export async function getSiteForSlug(slug: string): Promise<Site | null> {
  return slug === HOME_KEY ? homeSite() : getSiteBySlug(slug);
}
