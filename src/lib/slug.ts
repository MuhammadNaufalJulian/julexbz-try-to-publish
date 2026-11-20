// Aturan alamat situs (subdomain). Tanpa dependensi supaya mudah diuji.

export const RESERVED_SLUGS = new Set([
  'www', 'admin', 'api', 'app', 'dashboard', 'login', 'logout', 'signup', 'daftar', 'masuk',
  'mail', 'smtp', 'imap', 'pop', 'ftp', 'ns', 'ns1', 'ns2', 'static', 'assets', 'cdn', 'img',
  'help', 'support', 'bantuan', 'blog', 'docs', 'status', 'dev', 'test', 'staging', 'demo',
  'root', 'julexbz', 'digibo', 'digiprod', 'billing', 'pay', 'payment', 'auth', 'oauth', 'sites', 'site', 'web',
  'about', 'contact', 'kontak', 'terms', 'privacy', 'pricing', 'harga', 'template', 'templates',
  'null', 'undefined', 'localhost', 'security', 'abuse', 'postmaster', 'webmaster', 'hostmaster',
]);

export type SlugResult = { ok: true; slug: string } | { ok: false; error: string };

export function validateSlug(raw: unknown): SlugResult {
  const slug = String(raw ?? '').trim().toLowerCase();
  if (slug.length < 3) return { ok: false, error: 'Alamat minimal 3 karakter.' };
  if (slug.length > 30) return { ok: false, error: 'Alamat maksimal 30 karakter.' };
  if (!/^[a-z0-9-]+$/.test(slug)) return { ok: false, error: 'Alamat hanya boleh berisi huruf kecil, angka, dan tanda hubung.' };
  if (slug.startsWith('-') || slug.endsWith('-')) return { ok: false, error: 'Alamat tidak boleh diawali atau diakhiri tanda hubung.' };
  if (slug.includes('--')) return { ok: false, error: 'Alamat tidak boleh memuat dua tanda hubung berurutan.' };
  if (RESERVED_SLUGS.has(slug)) return { ok: false, error: 'Alamat ini tidak tersedia. Pilih yang lain.' };
  return { ok: true, slug };
}

// Mengambil slug dari header Host. Mengembalikan null jika host adalah domain utama.
export function slugFromHost(host: string, rootDomain: string): string | null {
  const h = host.toLowerCase().split(':')[0];
  const root = rootDomain.toLowerCase().split(':')[0];
  if (!root || h === root || h === 'www.' + root) return null;
  if (!h.endsWith('.' + root)) return null;
  const sub = h.slice(0, h.length - root.length - 1);
  if (!sub || sub.includes('.')) return null;
  return sub;
}
