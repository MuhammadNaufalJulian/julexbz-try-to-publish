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

// Email admin yang boleh membuat voucher di /admin/voucher. Isi ADMIN_EMAILS (pisahkan koma).
// Kosong = tidak ada admin sama sekali (halaman 404 untuk semua orang). Tidak ada fallback ke FREE_EMAILS.
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}

// Kontak bantuan yang tampil di footer dan halaman legal. Atur lewat env; kosong = tidak ditampilkan.
// CONTACT_EMAIL contoh: halo@julexbz.com. CONTACT_WA hanya angka dengan kode negara, contoh: 6281234567890.
export type Contact = { email: string | null; whatsapp: string | null; instagram: string | null };

export function contactInfo(): Contact {
  const email = (process.env.CONTACT_EMAIL || '').trim();
  const wa = (process.env.CONTACT_WA || '').replace(/\D/g, '');
  const ig = (process.env.CONTACT_IG ?? 'julexbz').trim().replace(/^@/, '');
  return {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null,
    whatsapp: /^\d{8,15}$/.test(wa) ? wa : null,
    instagram: /^[A-Za-z0-9._]{1,30}$/.test(ig) ? ig : null,
  };
}
