import { NextResponse, type NextRequest } from 'next/server';
import { slugFromHost } from '@/lib/slug';

// Halaman tambahan sebuah situs. Di mode single alamatnya langsung di domain utama.
const EXTRA_PATHS = new Set(['/kartu', '/cv', '/kontak.vcf', '/og', '/sitemap.xml']);

// Mengarahkan nama.domain.com ke halaman situs milik "nama". Tidak memakai database di sini (edge runtime).
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Folder /s hanya untuk rewrite internal. Akses langsung dari luar ditolak.
  if (pathname === '/s' || pathname.startsWith('/s/')) {
    return new NextResponse('Tidak ditemukan', { status: 404 });
  }

  if (process.env.MODE === 'single') {
    if (!EXTRA_PATHS.has(pathname)) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = `/s/main${pathname}`; // situs mode single selalu bernama "main" (lihat claimSite)
    return NextResponse.rewrite(url);
  }

  const root = process.env.ROOT_DOMAIN || 'localhost:3000';
  const host = req.headers.get('host') || '';
  const slug = slugFromHost(host, root);
  if (!slug) {
    // Domain utama: kartu, CV, kontak, dan gambar pratinjau milik situs beranda (lihat src/lib/home.ts).
    if (EXTRA_PATHS.has(pathname)) {
      const u = req.nextUrl.clone();
      u.pathname = `/s/_home${pathname}`;
      return NextResponse.rewrite(u);
    }
    return NextResponse.next();
  }

  // Foto dan API tetap dilayani dari host mana pun.
  if (pathname.startsWith('/api/')) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = pathname === '/' ? `/s/${slug}` : `/s/${slug}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)'],
};
