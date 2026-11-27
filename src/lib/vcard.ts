// Membuat file kontak .vcf (vCard 3.0) dari isi situs. Tanpa dependensi supaya mudah diuji.
import type { Content } from './content';
import { safeUrl } from './content.ts';

// Aturan RFC 6350/2426: escape backslash, titik koma, koma, dan baris baru.
export function vEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n');
}

// Baris vCard maksimal 75 oktet; lanjutan dimulai dengan satu spasi. Dipotong per karakter agar UTF-8 tidak terbelah.
function fold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = '';
  let curBytes = 0;
  let limit = 75;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (curBytes + b > limit) {
      out.push(cur);
      cur = '';
      curBytes = 0;
      limit = 74; // satu oktet dipakai spasi awal baris lanjutan
    }
    cur += ch;
    curBytes += b;
  }
  if (cur) out.push(cur);
  return out.join('\r\n ');
}

export function buildVcard(c: Content, siteUrl: string): string {
  const parts = c.name.trim().split(/\s+/);
  const family = parts.length > 1 ? parts[parts.length - 1] : '';
  const given = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] ?? '';

  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${vEscape(c.name)}`, `N:${vEscape(family)};${vEscape(given)};;;`];
  if (c.card.org) lines.push(`ORG:${vEscape(c.card.org)}`);
  if (c.role) lines.push(`TITLE:${vEscape(c.role)}`);
  if (c.contact.email) lines.push(`EMAIL;TYPE=INTERNET:${vEscape(c.contact.email)}`);
  if (c.contact.phone) lines.push(`TEL;TYPE=CELL:${vEscape(c.contact.phone)}`);
  if (c.card.city) lines.push(`ADR;TYPE=WORK:;;;${vEscape(c.card.city)};;;`);
  const web = safeUrl(siteUrl);
  if (web) lines.push(`URL:${vEscape(web)}`);
  for (const l of c.contact.links) {
    const u = safeUrl(l.url);
    if (u) lines.push(`URL;TYPE=${vEscape(l.label || 'link').replace(/[^A-Za-z0-9-]/g, '') || 'link'}:${vEscape(u)}`);
  }
  if (c.tagline) lines.push(`NOTE:${vEscape(c.tagline)}`);
  lines.push('END:VCARD');
  return lines.map(fold).join('\r\n') + '\r\n';
}

// Nama file aman: huruf kecil ASCII, angka, tanda hubung.
export function vcardFilename(slug: string): string {
  const s = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
  return `${s || 'kontak'}.vcf`;
}
