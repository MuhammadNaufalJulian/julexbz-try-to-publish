import type { Metadata, Viewport } from 'next';
import './globals.css';
import './templates.css';

export const metadata: Metadata = {
  title: { default: 'julexbz.com', template: '%s' },
  description: 'Kartu nama digital 3D yang sekaligus jadi situs pribadimu.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;700;800&family=Unbounded:wght@500;700&family=Fredoka:wght@500;600;700&family=Bagel+Fat+One&family=Press+Start+2P&family=Bangers&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
