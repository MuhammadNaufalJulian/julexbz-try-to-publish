import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSlug, slugFromHost } from '../src/lib/slug.ts';
import { sanitizeContent, defaultContent, sampleContent, normalizeStored, THEME_IDS } from '../src/lib/content.ts';

test('slug: menerima alamat yang benar dan merapikan huruf besar', () => {
  assert.deepEqual(validateSlug('  Budi-Santoso '), { ok: true, slug: 'budi-santoso' });
  assert.deepEqual(validateSlug('abc'), { ok: true, slug: 'abc' });
});

test('slug: menolak yang tidak valid', () => {
  for (const bad of ['ab', 'a'.repeat(31), '-abc', 'abc-', 'a--b', 'a_b', 'a.b', 'ab c', 'ünal', '', null, undefined]) {
    assert.equal(validateSlug(bad).ok, false, String(bad));
  }
});

test('slug: menolak nama yang dicadangkan', () => {
  for (const r of ['www', 'admin', 'api', 'julexbz', 'WWW']) assert.equal(validateSlug(r).ok, false, r);
});

test('slugFromHost: membaca subdomain', () => {
  assert.equal(slugFromHost('budi.julexbz.com', 'julexbz.com'), 'budi');
  assert.equal(slugFromHost('BUDI.julexbz.com:443', 'julexbz.com'), 'budi');
  assert.equal(slugFromHost('budi.localhost:3000', 'localhost:3000'), 'budi');
});

test('slugFromHost: domain utama dan host asing tidak dianggap situs', () => {
  assert.equal(slugFromHost('julexbz.com', 'julexbz.com'), null);
  assert.equal(slugFromHost('www.julexbz.com', 'julexbz.com'), null);
  assert.equal(slugFromHost('localhost:3000', 'localhost:3000'), null);
  assert.equal(slugFromHost('a.b.julexbz.com', 'julexbz.com'), null);
  assert.equal(slugFromHost('evil.com', 'julexbz.com'), null);
  assert.equal(slugFromHost('budi.julexbz.com.evil.com', 'julexbz.com'), null);
  assert.equal(slugFromHost('xjulexbz.com', 'julexbz.com'), null);
});

test('content: isi bawaan dan contoh lolos validasi', () => {
  assert.equal(sanitizeContent(defaultContent()).ok, true);
  assert.equal(sanitizeContent(sampleContent()).ok, true);
});

test('content: tema harus dikenal', () => {
  const c = { ...defaultContent(), theme: 'neon' };
  assert.equal(sanitizeContent(c).ok, false);
  for (const t of THEME_IDS) assert.equal(sanitizeContent({ ...defaultContent(), theme: t }).ok, true, t);
});

test('content: nama wajib diisi dan dipangkas', () => {
  assert.equal(sanitizeContent({ ...defaultContent(), name: '   ' }).ok, false);
  const r = sanitizeContent({ ...defaultContent(), name: '  Budi  ' });
  assert.ok(r.ok && r.value.name === 'Budi');
});

test('content: tautan harus http atau https, dan dilengkapi https bila kosong skema', () => {
  const base = defaultContent();
  const bad = sanitizeContent({ ...base, contact: { email: '', links: [{ label: 'x', url: 'javascript:alert(1)' }] } });
  assert.equal(bad.ok, false);
  const bad2 = sanitizeContent({ ...base, projects: [{ title: 'p', year: '', desc: '', tags: [], url: 'data:text/html,hi' }] });
  assert.equal(bad2.ok, false);
  const good = sanitizeContent({ ...base, contact: { email: '', links: [{ label: 'Web', url: 'contoh.com/budi' }] } });
  assert.ok(good.ok && good.value.contact.links[0].url === 'https://contoh.com/budi');
});

test('content: email harus valid', () => {
  assert.equal(sanitizeContent({ ...defaultContent(), contact: { email: 'bukan-email', links: [] } }).ok, false);
  assert.equal(sanitizeContent({ ...defaultContent(), contact: { email: 'a@b.id', links: [] } }).ok, true);
});

test('content: photoId harus uuid', () => {
  assert.equal(sanitizeContent({ ...defaultContent(), photoId: 'abc' }).ok, false);
  const id = '123e4567-e89b-12d3-a456-426614174000';
  const r = sanitizeContent({ ...defaultContent(), photoId: id.toUpperCase() });
  assert.ok(r.ok && r.value.photoId === id);
});

test('content: batas jumlah dan panjang', () => {
  const many = Array.from({ length: 13 }, () => ({ title: 'p', year: '', desc: '', tags: [], url: '' }));
  assert.equal(sanitizeContent({ ...defaultContent(), projects: many }).ok, false);
  assert.equal(sanitizeContent({ ...defaultContent(), about: 'a'.repeat(3001) }).ok, false);
});

test('content: bidang asing dibuang dan tipe salah ditolak', () => {
  const r = sanitizeContent({ ...defaultContent(), isAdmin: true, __proto__: { x: 1 } });
  assert.ok(r.ok && !('isAdmin' in r.value));
  assert.equal(sanitizeContent({ ...defaultContent(), name: 123 }).ok, false);
  assert.equal(sanitizeContent(null).ok, false);
  assert.equal(sanitizeContent('x').ok, false);
});

test('content: karakter kontrol dibuang, baris baru dipertahankan', () => {
  const r = sanitizeContent({ ...defaultContent(), about: 'a\u0000b\r\nc' });
  assert.ok(r.ok && r.value.about === 'ab\nc');
});

test('normalizeStored: data rusak jatuh ke isi bawaan', () => {
  const c = normalizeStored({ theme: 'x' }, 'Cadangan');
  assert.equal(c.name, 'Cadangan');
});
