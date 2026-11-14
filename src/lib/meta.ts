import type { Metadata } from 'next';
import type { Site } from './sites';
import { siteUrl } from './config';

// Metadata bersama untuk halaman publik sebuah situs. Gambar pratinjau (/og) dibuat otomatis per situs,
// jadi saat tautan dibagikan di WhatsApp, Telegram, atau X, muncul kartu dengan nama dan foto pemiliknya.
export function shareMetadata(site: Site, o: { title?: string; description?: string; path?: string; base?: string } = {}): Metadata {
  const c = site.content;
  const title = o.title ?? (c.siteTitle || c.name);
  const description = o.description ?? (c.tagline || c.role || undefined);
  return {
    metadataBase: new URL(o.base ?? siteUrl(site.slug)),
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: o.path ?? '/',
      images: [{ url: '/og', width: 1200, height: 630, alt: `Kartu nama ${c.name}` }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/og'] },
  };
}
