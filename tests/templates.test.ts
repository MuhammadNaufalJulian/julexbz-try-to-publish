import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeContent, defaultContent, sampleContent, normalizeStored, TEMPLATE_IDS, CV_STYLES } from '../src/lib/content.ts';
import { TEMPLATES, templateMeta, ogPalette } from '../src/lib/templates.ts';
import { buildVcard, vEscape, vcardFilename } from '../src/lib/vcard.ts';

test('template: data lama tanpa field baru tetap valid dan mendapat nilai bawaan', () => {
  const old = defaultContent() as unknown as Record<string, unknown>;
  delete old.template;
  delete old.education;
  delete old.cv;
  (old.contact as Record<string, unknown>) = { email: 'a@b.id', links: [] };
  const r = sanitizeContent(old);
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.template, 'klasik');
    assert.deepEqual(r.value.education, []);
    assert.equal(r.value.contact.phone, '');
    assert.deepEqual(r.value.cv, { enabled: true, showPhoto: true, style: 'ringkas' });
  }
});

test('template: semua id diterima, yang tidak dikenal ditolak', () => {
  for (const t of TEMPLATE_IDS) assert.equal(sanitizeContent({ ...defaultContent(), template: t }).ok, true, t);
  assert.equal(sanitizeContent({ ...defaultContent(), template: 'hacker' }).ok, false);
  assert.equal(sanitizeContent({ ...defaultContent(), template: 5 }).ok, false);
});

test('template: daftar UI cocok dengan daftar id dan punya palet OG untuk semuanya', () => {
  assert.deepEqual(TEMPLATES.map((t) => t.id).sort(), [...TEMPLATE_IDS].sort());
  for (const id of TEMPLATE_IDS) {
    const p = ogPalette({ template: id, theme: 'rose' });
    for (const v of Object.values(p)) assert.match(v, /^#[0-9A-Fa-f]{6}$/);
    assert.equal(templateMeta(id).id, id);
  }
});

test('template: palet OG template beraksen mengikuti tema, yang berpalet sendiri tidak', () => {
  assert.notEqual(ogPalette({ template: 'klasik', theme: 'rose' }).accent, ogPalette({ template: 'klasik', theme: 'emerald' }).accent);
  assert.notEqual(ogPalette({ template: 'cerah', theme: 'rose' }).accent, ogPalette({ template: 'cerah', theme: 'emerald' }).accent);
  for (const id of ['pop', 'neon', 'gradasi', 'permen', 'stiker', 'arcade', 'boba', 'komik', 'awan'] as const) {
    assert.equal(ogPalette({ template: id, theme: 'rose' }).accent, ogPalette({ template: id, theme: 'emerald' }).accent, id);
    assert.equal(templateMeta(id).accentable, false);
  }
});

test('pendidikan: lolos validasi, dibatasi jumlah dan tipe', () => {
  const ok = sanitizeContent({ ...defaultContent(), education: [{ school: ' UI ', degree: 'S1', period: '2018 - 2022', desc: '' }] });
  assert.ok(ok.ok && ok.value.education[0].school === 'UI');
  const many = Array.from({ length: 9 }, () => ({ school: 'x', degree: '', period: '', desc: '' }));
  assert.equal(sanitizeContent({ ...defaultContent(), education: many }).ok, false);
  assert.equal(sanitizeContent({ ...defaultContent(), education: 'x' }).ok, false);
  assert.equal(sanitizeContent({ ...defaultContent(), education: [{ school: 'a'.repeat(121) }] }).ok, false);
});

test('telepon: format wajar diterima, sisanya ditolak', () => {
  const c = (phone: string) => sanitizeContent({ ...defaultContent(), contact: { email: '', phone, links: [] } });
  for (const good of ['', '0812-3456-7890', '+62 812 3456 7890', '(021) 555 1234']) assert.equal(c(good).ok, true, good);
  for (const bad of ['abc', '12', '+', '0812;DROP', '<script>', '0812 3456 7890 1234 5678 9012 3456']) assert.equal(c(bad).ok, false, bad);
});

test('cv: gaya harus dikenal, bendera non-boolean jatuh ke bawaan', () => {
  for (const s of CV_STYLES) assert.equal(sanitizeContent({ ...defaultContent(), cv: { enabled: true, showPhoto: true, style: s } }).ok, true, s);
  assert.equal(sanitizeContent({ ...defaultContent(), cv: { enabled: true, showPhoto: true, style: 'neon' } }).ok, false);
  const r = sanitizeContent({ ...defaultContent(), cv: { enabled: 'ya', showPhoto: 0, style: 'modern' } });
  assert.ok(r.ok && r.value.cv.enabled === true && r.value.cv.showPhoto === true && r.value.cv.style === 'modern');
  const off = sanitizeContent({ ...defaultContent(), cv: { enabled: false, showPhoto: false, style: 'ringkas' } });
  assert.ok(off.ok && off.value.cv.enabled === false && off.value.cv.showPhoto === false);
});

test('normalizeStored: isi contoh tetap utuh', () => {
  const s = sampleContent();
  assert.deepEqual(normalizeStored(s), s);
});

test('vcard: struktur dasar dan akhir baris CRLF', () => {
  const v = buildVcard(sampleContent(), 'https://sari.julexbz.com');
  assert.ok(v.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n'));
  assert.ok(v.endsWith('END:VCARD\r\n'));
  assert.ok(!/[^\r]\n/.test(v), 'tidak boleh ada LF tanpa CR');
  assert.match(v, /FN:Sari Wulandari\r\n/);
  assert.match(v, /N:Wulandari;Sari;;;\r\n/);
  assert.match(v, /EMAIL;TYPE=INTERNET:halo@contoh\.id\r\n/);
  assert.match(v, /URL:https:\/\/sari\.julexbz\.com\/\r\n/);
});

test('vcard: nama satu kata dan nama panjang dipecah benar', () => {
  assert.match(buildVcard({ ...defaultContent('Madonna') }, ''), /N:;Madonna;;;/);
  assert.match(buildVcard({ ...defaultContent('Budi Santoso Putra') }, ''), /N:Putra;Budi Santoso;;;/);
});

test('vcard: karakter khusus di-escape dan tidak bisa menyisipkan baris baru', () => {
  assert.equal(vEscape('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
  assert.equal(vEscape('a\rb\r\nc\nd'), 'a\\nb\\nc\\nd', 'CR tunggal, CRLF, dan LF semuanya di-escape');
  const c = { ...defaultContent('Eve'), role: 'Dev\r\nEND:VCARD\r\nBEGIN:VCARD', tagline: 'x\rEND:VCARD\rBEGIN:VCARD', card: { label: '', org: 'A;B,C', city: '' } };
  const v = buildVcard(c, '');
  // Hitung per BARIS (setelah lipatan dibuka), bukan per kemunculan teks: teks itu boleh ada di dalam nilai.
  const lines = v.replace(/\r\n /g, '').split('\r\n').filter(Boolean);
  assert.equal(lines.filter((l) => l === 'BEGIN:VCARD').length, 1, 'hanya satu BEGIN');
  assert.equal(lines.filter((l) => l === 'END:VCARD').length, 1, 'hanya satu END');
  assert.ok(!/\r(?!\n)/.test(v) && !/(?<!\r)\n/.test(v), 'tidak ada CR atau LF liar');
  assert.match(v, /ORG:A\\;B\\,C\r\n/);
});

test('teks: CR tunggal dinormalkan menjadi baris baru oleh penyaring isi', () => {
  const r = sanitizeContent({ ...defaultContent(), about: 'a\rb\r\nc' });
  assert.ok(r.ok && r.value.about === 'a\nb\nc');
});

test('vcard: tautan berbahaya dibuang, telepon dan kota ikut jika ada', () => {
  const c = {
    ...defaultContent('Eve'),
    card: { label: '', org: '', city: 'Bandung' },
    contact: { email: '', phone: '+62 812 3456', links: [{ label: 'Bad', url: 'javascript:alert(1)' }, { label: 'Web Saya', url: 'https://contoh.com' }] },
  };
  const v = buildVcard(c, '');
  assert.ok(!v.includes('javascript'));
  assert.match(v, /TEL;TYPE=CELL:\+62 812 3456/);
  assert.match(v, /ADR;TYPE=WORK:;;;Bandung;;;/);
  assert.match(v, /URL;TYPE=WebSaya:https:\/\/contoh\.com\//);
});

test('vcard: baris panjang dilipat maksimal 75 byte tanpa memotong huruf UTF-8', () => {
  const c = { ...defaultContent('Eve'), tagline: 'Saya suka membuat produk digital yang rapi ééé dan mudah dipakai oleh banyak orang di mana saja 你好' };
  const v = buildVcard(c, '');
  const enc = new TextEncoder();
  for (const line of v.split('\r\n')) assert.ok(enc.encode(line).length <= 75, `terlalu panjang: ${line}`);
  const unfolded = v.replace(/\r\n /g, '');
  assert.ok(unfolded.includes('你好'));
  assert.ok(!unfolded.includes('�'));
});

test('vcard: nama file aman', () => {
  assert.equal(vcardFilename('Budi-Santoso'), 'budi-santoso.vcf');
  assert.equal(vcardFilename('../../etc'), 'etc.vcf');
  assert.equal(vcardFilename(''), 'kontak.vcf');
});

import { PLANS } from '../src/lib/plans.ts';

test('teks paket menyebut jumlah template yang benar', () => {
  assert.ok(PLANS[0].points.some((p) => p.startsWith(`${TEMPLATE_IDS.length} template`)), 'jumlah template di plans.ts harus sama dengan TEMPLATE_IDS');
});
