import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mapStatus, newOrderId, notificationSignature, parseAmount, verifySignature } from '../src/lib/pay.ts';

const KEY = 'SB-Mid-server-contoh';

test('order id: format aman untuk Midtrans (<=50 karakter, huruf/angka/-)', () => {
  const a = newOrderId();
  assert.match(a, /^JX-[A-Z0-9]+-[A-Z0-9]{10}$/);
  assert.ok(a.length <= 50);
  assert.notEqual(newOrderId(), newOrderId());
});

test('signature: SHA512 dari order_id + status_code + gross_amount + server key', () => {
  const sig = notificationSignature('JX-1', '200', '299000.00', KEY);
  assert.equal(sig, createHash('sha512').update('JX-1200299000.00' + KEY).digest('hex'));
  assert.equal(sig.length, 128);
});

test('verifySignature: terima yang benar, tolak yang salah atau cacat', () => {
  const n = { order_id: 'JX-1', status_code: '200', gross_amount: '299000.00', signature_key: notificationSignature('JX-1', '200', '299000.00', KEY) };
  assert.equal(verifySignature(n, KEY), true);
  assert.equal(verifySignature({ ...n, signature_key: n.signature_key.toUpperCase() }, KEY), true);
  assert.equal(verifySignature({ ...n, gross_amount: '1000.00' }, KEY), false, 'nominal diubah');
  assert.equal(verifySignature({ ...n, order_id: 'JX-2' }, KEY), false, 'order diubah');
  assert.equal(verifySignature(n, 'kunci-lain'), false, 'kunci lain');
  assert.equal(verifySignature({ ...n, signature_key: 'abc' }, KEY), false, 'panjang beda');
  assert.equal(verifySignature({ ...n, signature_key: 123 }, KEY), false, 'bukan string');
  assert.equal(verifySignature({ ...n, gross_amount: 299000 }, KEY), false, 'gross_amount harus string');
  assert.equal(verifySignature({}, KEY), false);
  assert.equal(verifySignature(null, KEY), false);
  assert.equal(verifySignature(n, ''), false, 'kunci kosong');
});

test('mapStatus: hanya settlement (dan capture+accept) yang dianggap lunas', () => {
  assert.equal(mapStatus('settlement'), 'paid');
  assert.equal(mapStatus('capture', 'accept'), 'paid');
  assert.equal(mapStatus('capture', 'challenge'), 'pending');
  assert.equal(mapStatus('capture'), 'pending');
  assert.equal(mapStatus('pending'), 'pending');
  assert.equal(mapStatus('expire'), 'expired');
  for (const x of ['deny', 'cancel', 'failure']) assert.equal(mapStatus(x), 'failed');
  for (const x of [undefined, null, '', 'refund', 'authorize', 'SETTLEMENT', 1]) assert.equal(mapStatus(x), 'pending', String(x));
});

test('parseAmount: nominal bulat dari Midtrans', () => {
  assert.equal(parseAmount('299000.00'), 299000);
  assert.equal(parseAmount('299000'), 299000);
  assert.equal(parseAmount(299000), 299000);
  assert.equal(parseAmount('299000.50'), null);
  assert.equal(parseAmount('0'), null);
  assert.equal(parseAmount('-5'), null);
  assert.equal(parseAmount('1e6'), null);
  assert.equal(parseAmount(''), null);
  assert.equal(parseAmount(undefined), null);
  assert.equal(parseAmount('299000.00abc'), null);
});
