// Tautan sosial media dan nomor telepon. Murni (tanpa database) supaya mudah dites.
// Pengguna boleh menulis @username atau nomor saja. Tautan lengkap dibentuk di sini.

export type Platform = { id: string; label: string; match: RegExp; domain: string; placeholder: string; build: (h: string) => string };

const HANDLE = /^[A-Za-z0-9._-]{1,60}$/;

export const PLATFORMS: Platform[] = [
  { id: 'instagram', label: 'Instagram', match: /^(instagram|ig)$/i, domain: 'instagram.', placeholder: '@username', build: (h) => `https://instagram.com/${h}` },
  { id: 'whatsapp', label: 'WhatsApp', match: /^(whatsapp|wa|whats app)$/i, domain: 'wa.me', placeholder: '0812 3456 7890', build: (h) => `https://wa.me/${h}` },
  { id: 'tiktok', label: 'TikTok', match: /^tiktok$/i, domain: 'tiktok.', placeholder: '@username', build: (h) => `https://www.tiktok.com/@${h}` },
  { id: 'linkedin', label: 'LinkedIn', match: /^linkedin$/i, domain: 'linkedin.', placeholder: 'nama-kamu (bagian akhir tautan profil)', build: (h) => `https://www.linkedin.com/in/${h}` },
  { id: 'github', label: 'GitHub', match: /^github$/i, domain: 'github.', placeholder: 'username', build: (h) => `https://github.com/${h}` },
  { id: 'youtube', label: 'YouTube', match: /^(youtube|yt)$/i, domain: 'youtu', placeholder: '@namakanal', build: (h) => `https://www.youtube.com/@${h}` },
  { id: 'x', label: 'X', match: /^(x|twitter)$/i, domain: 'x.com', placeholder: '@username', build: (h) => `https://x.com/${h}` },
  { id: 'facebook', label: 'Facebook', match: /^(facebook|fb)$/i, domain: 'facebook.', placeholder: 'username atau nama halaman', build: (h) => `https://facebook.com/${h}` },
  { id: 'telegram', label: 'Telegram', match: /^telegram$/i, domain: 't.me', placeholder: '@username', build: (h) => `https://t.me/${h}` },
  { id: 'threads', label: 'Threads', match: /^threads$/i, domain: 'threads.', placeholder: '@username', build: (h) => `https://www.threads.net/@${h}` },
];

export function platformFor(label: string): Platform | null {
  const l = label.trim();
  return PLATFORMS.find((p) => p.match.test(l)) ?? null;
}

// Nomor telepon ke bentuk internasional tanpa tanda (untuk wa.me). Mengembalikan null bila bukan nomor yang masuk akal.
export function waDigits(phone: string): string | null {
  let d = phone.replace(/[^0-9]/g, '');
  if (!d) return null;
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d;
  return d.length >= 9 && d.length <= 15 ? d : null;
}

export function waLink(phone: string): string | null {
  const d = waDigits(phone);
  return d ? `https://wa.me/${d}` : null;
}

export function telLink(phone: string): string | null {
  const t = phone.replace(/[^0-9+]/g, '');
  return t ? `tel:${t}` : null;
}

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

// Mengubah isian "Alamat" menjadi tautan. Kalau isiannya sudah tautan, dibiarkan. Kalau hanya @username atau nomor
// dan nama tautannya dikenal (Instagram, WhatsApp, dst.), tautan profilnya dibentuk. Selain itu dikembalikan apa adanya.
export function resolveLink(label: string, raw: string): string {
  const v = raw.trim();
  if (!v) return v;
  const p = platformFor(label);
  if (!p) return v;
  if (HAS_SCHEME.test(v) || v.includes('/') || /^www\./i.test(v) || v.toLowerCase().includes(p.domain)) return v;
  if (p.id === 'whatsapp') {
    const d = waDigits(v);
    return d ? p.build(d) : v;
  }
  const h = v.replace(/^@/, '');
  return HANDLE.test(h) ? p.build(h) : v;
}
