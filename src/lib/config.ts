export const MODE: 'multi' | 'single' = process.env.MODE === 'single' ? 'single' : 'multi';
export const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'localhost:3000';

// Alamat publik sebuah situs. Dipakai di server, hasilnya dikirim ke komponen klien sebagai teks.
export function siteUrl(slug: string): string {
  const root = process.env.NEXT_PUBLIC_ROOT_URL || 'http://localhost:3000';
  if (MODE === 'single') return root;
  const u = new URL(root);
  return `${u.protocol}//${slug}.${u.host}`;
}

// Email yang boleh menerbitkan situs tanpa bayar (misalnya milikmu sendiri). Pisahkan dengan koma di FREE_EMAILS.
export function freeEmails(): string[] {
  return (process.env.FREE_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export function isFreeEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return freeEmails().includes(email.trim().toLowerCase());
}

// Alamat (slug) situs yang tampil sebagai beranda julexbz.com di mode langganan. Kosong = tampil halaman pemasaran.
export function homeSlug(): string | null {
  const v = (process.env.HOME_SLUG || '').trim().toLowerCase();
  return /^[a-z0-9-]{3,30}$/.test(v) ? v : null;
}
