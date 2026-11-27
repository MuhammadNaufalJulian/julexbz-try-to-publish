import test from 'node:test';
import assert from 'node:assert/strict';
import { esc, layout, emailEnabled } from '../src/lib/email.ts';

test('esc menetralkan HTML', () => {
  assert.equal(esc(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
});

test('layout memberi escape pada judul dan tombol', () => {
  const h = layout('<b>', '<p>isi</p>', { href: 'https://x.id/?a=1&b="2"', label: '<go>' });
  assert.ok(!h.includes('<b>'));
  assert.ok(h.includes('&lt;go&gt;'));
  assert.ok(h.includes('&amp;b=&quot;2&quot;'));
});

test('emailEnabled butuh key dan alamat pengirim', () => {
  const k = process.env.RESEND_API_KEY, f = process.env.EMAIL_FROM;
  delete process.env.RESEND_API_KEY; delete process.env.EMAIL_FROM;
  assert.equal(emailEnabled(), false);
  process.env.RESEND_API_KEY = 'x';
  assert.equal(emailEnabled(), false);
  process.env.EMAIL_FROM = 'a <a@b.id>';
  assert.equal(emailEnabled(), true);
  if (k === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = k;
  if (f === undefined) delete process.env.EMAIL_FROM; else process.env.EMAIL_FROM = f;
});
