import type { Metadata } from 'next';
import type { Site } from './sites';
import { siteUrl } from './config';

// Metadata bersama untuk halaman publik sebuah situs. Gambar pratinjau (/og) dibuat otomatis per situs,
// jadi saat tautan dibagikan di WhatsApp, Telegram, atau X, muncul kartu dengan nama dan foto pemiliknya.
export function shareMetadata(site: Site, o: { title?: string; description?: string; path?: string; base?: string } = {}): Metadata {
  const c = site.content;
  // Nama lengkap selalu ada di judul supaya mesin pencari mencocokkannya dengan orang yang mencari nama itu.
  const named = c.siteTitle && c.siteTitle.toLowerCase().includes(c.name.toLowerCase()) ? c.siteTitle : [c.name, c.role].filter(Boolean).join(' | ');
  const title = o.title ?? (named || c.name);
  const description = o.description ?? ([c.name, c.role, c.tagline].filter(Boolean).join('. ') || undefined);
  return {
    metadataBase: new URL(o.base ?? siteUrl(site.slug)),
    title,
    description,
    keywords: [c.name, c.role, ...c.skills.slice(0, 6)].filter(Boolean),
    alternates: { canonical: o.path ?? '/' },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
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

// Data terstruktur schema.org/Person. Membantu Google memahami bahwa halaman ini adalah situs pribadi orang bernama itu.
export function personJsonLd(site: Site, url: string): string {
  const c = site.content;
  const same = c.contact.links.map((l) => l.url).filter((u) => /^https?:\/\//i.test(u));
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: c.name,
      url,
      ...(c.role ? { jobTitle: c.role } : {}),
      ...(c.tagline ? { description: c.tagline } : {}),
      image: `${url.replace(/\/$/, '')}/og`,
      ...(same.length ? { sameAs: same } : {}),
      ...(c.skills.length ? { knowsAbout: c.skills.slice(0, 10) } : {}),
    },
  };
  // Cegah "</script>" di isian pengguna menutup tag lebih awal.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
