import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReceipt } from '../src/lib/receiptMail.ts';
import { contactInfo } from '../src/lib/config.ts';
import { LEGAL } from '../src/lib/legal.ts';

const base = { orderId: 'JX-1', email: 'a@b.id', name: null, slug: 'budi', amount: 149000, discount: 0, voucherCode: null, paidAt: new Date('2026-11-28T10:00:00Z'), expiresAt: new Date('2027-11-28T10:00:00Z') };

test('bukti bayar memuat nomor pesanan dan total', () => {
  const m = buildReceipt(base);
  assert.ok(m.subject.includes('JX-1'));
  assert.ok(m.text.includes('No. pesanan: JX-1'));
  assert.ok(m.html.includes('Total dibayar'));
});

test('bukti bayar memberi escape pada nama dan voucher', () => {
  const m = buildReceipt({ ...base, name: '<script>x</script>', voucherCode: 'A"B', discount: 1000 });
  assert.ok(!m.html.includes('<script>'));
  assert.ok(m.html.includes('A&quot;B'));
});

test('contactInfo memvalidasi env', () => {
  const keep = { ...process.env };
  process.env.CONTACT_EMAIL = 'bukan-email';
  process.env.CONTACT_WA = '+62 812-3456-7890';
  process.env.CONTACT_IG = '@julexbz';
  const c = contactInfo();
  assert.equal(c.email, null);
  assert.equal(c.whatsapp, '6281234567890');
  assert.equal(c.instagram, 'julexbz');
  process.env.CONTACT_EMAIL = 'halo@julexbz.com';
  assert.equal(contactInfo().email, 'halo@julexbz.com');
  for (const k of ['CONTACT_EMAIL', 'CONTACT_WA', 'CONTACT_IG']) { if (keep[k] === undefined) delete process.env[k]; else process.env[k] = keep[k]; }
});

test('tiga dokumen legal lengkap', () => {
  for (const d of Object.values(LEGAL)) assert.ok(d.sections.length >= 5 && d.title);
});
