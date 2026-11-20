import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkVoucher, computeDiscount, normalizeCode, MIN_CHARGE, type Voucher } from '../src/lib/voucher.ts';

const base: Voucher = { code: 'PROMO20', kind: 'percent', value: 20, maxUses: null, used: 0, expiresAt: null, active: true };
const P = 299000;

test('normalizeCode: rapikan dan tolak yang aneh', () => {
  assert.equal(normalizeCode('  promo20 '), 'PROMO20');
  assert.equal(normalizeCode('hemat-50_k'), 'HEMAT-50_K');
  for (const x of ['ab', 'a'.repeat(31), 'PROMO 20', "x';--", '', 123, null, undefined]) assert.equal(normalizeCode(x), null, String(x));
});

test('computeDiscount: persen dibulatkan ke bawah, tidak melebihi harga', () => {
  assert.deepEqual(computeDiscount(P, 'percent', 20), { discount: 59800, final: 239200 });
  assert.deepEqual(computeDiscount(P, 'percent', 33), { discount: 98670, final: 200330 });
  assert.deepEqual(computeDiscount(P, 'percent', 100), { discount: P, final: 0 });
  assert.deepEqual(computeDiscount(P, 'percent', 150), { discount: P, final: 0 });
  assert.deepEqual(computeDiscount(P, 'fixed', 50000), { discount: 50000, final: 249000 });
  assert.deepEqual(computeDiscount(P, 'fixed', 999999), { discount: P, final: 0 });
  assert.deepEqual(computeDiscount(P, 'fixed', -5), { discount: 0, final: P });
});

test('checkVoucher: aktif, kedaluwarsa, habis, nonaktif', () => {
  const now = new Date('2026-11-10T00:00:00Z');
  assert.deepEqual(checkVoucher(base, P, now), { ok: true, discount: 59800, final: 239200 });
  assert.deepEqual(checkVoucher({ ...base, active: false }, P, now), { ok: false, reason: 'inactive' });
  assert.deepEqual(checkVoucher({ ...base, expiresAt: new Date('2026-11-09T00:00:00Z') }, P, now), { ok: false, reason: 'expired' });
  assert.deepEqual(checkVoucher({ ...base, expiresAt: now }, P, now), { ok: false, reason: 'expired' }, 'tepat di batas = sudah habis');
  assert.equal(checkVoucher({ ...base, expiresAt: new Date('2026-11-11T00:00:00Z') }, P, now).ok, true);
  assert.deepEqual(checkVoucher({ ...base, maxUses: 5, used: 5 }, P, now), { ok: false, reason: 'exhausted' });
  assert.equal(checkVoucher({ ...base, maxUses: 5, used: 4 }, P, now).ok, true);
});

test('checkVoucher: gratis penuh boleh, sisa terlalu kecil ditolak', () => {
  const full = checkVoucher({ ...base, value: 100 }, P);
  assert.deepEqual(full, { ok: true, discount: P, final: 0 });
  const tiny = checkVoucher({ ...base, kind: 'fixed', value: P - 500 }, P);
  assert.deepEqual(tiny, { ok: false, reason: 'too_small' });
  const edge = checkVoucher({ ...base, kind: 'fixed', value: P - MIN_CHARGE }, P);
  assert.deepEqual(edge, { ok: true, discount: P - MIN_CHARGE, final: MIN_CHARGE });
});
