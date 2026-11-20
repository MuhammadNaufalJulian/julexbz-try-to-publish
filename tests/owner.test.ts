import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ownerContent } from '../src/lib/owner.ts';
import { sanitizeContent, LIMITS } from '../src/lib/content.ts';
import { buildVcard } from '../src/lib/vcard.ts';

test('isi pemilik lolos validasi server (batas panjang, tautan, jumlah)', () => {
  const r = sanitizeContent(ownerContent());
  assert.equal(r.ok, true, r.ok ? '' : r.error);
  if (r.ok) {
    assert.equal(r.value.name, 'Muhammad Naufal Julian');
    assert.equal(r.value.projects.length, 10);
    assert.equal(r.value.skills.length, 20);
    assert.equal(r.value.contact.links.length, 6, 'semua tautan lolos safeUrl');
    assert.equal(r.value.experience.length, 2);
  }
});

test('isi pemilik: tidak ada data yang tidak pasti dan batas jumlah dipatuhi', () => {
  const c = ownerContent();
  assert.equal(c.contact.email, '');
  assert.equal(c.contact.phone, '');
  assert.equal(c.card.city, '');
  assert.ok(c.projects.length <= LIMITS.projects && c.skills.length <= LIMITS.skills && c.experience.length <= LIMITS.experience);
  assert.match(buildVcard(c, 'https://julexbz.com'), /FN:Muhammad Naufal Julian/);
});
