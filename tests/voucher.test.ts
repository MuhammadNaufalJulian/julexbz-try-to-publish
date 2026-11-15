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

test('checkVoucher: voucher percobaan tidak mengurangi harga dan membawa jumlah hari', () => {
  const trial: Voucher = { ...base, code: 'TRIAL7', kind: 'trial', value: 7 };
  assert.deepEqual(checkVoucher(trial, P), { ok: true, discount: 0, final: P, trialDays: 7 });
  assert.deepEqual(checkVoucher({ ...trial, active: false }, P), { ok: false, reason: 'inactive' });
  assert.deepEqual(checkVoucher({ ...trial, maxUses: 1, used: 1 }, P), { ok: false, reason: 'exhausted' });
});

import { parseNewVoucher, randomCode } from '../src/lib/voucher.ts';

test('randomCode: awalan, panjang, dan huruf yang dipakai', () => {
  let i = 0;
  const rand = (n: number) => (i++ * 7) % n;
  const c = randomCode('TEMAN', rand);
  assert.match(c, /^TEMAN-[A-HJKMNP-Z2-9]{5}$/);
  assert.equal(normalizeCode(c), c, 'harus lolos aturan kode voucher');
  assert.match(randomCode('', rand), /^[A-HJKMNP-Z2-9]{5}$/);
  for (let k = 0; k < 200; k++) assert.ok(normalizeCode(randomCode('P', (n) => Math.floor(Math.random() * n))));
});

test('parseNewVoucher: isian valid dirapikan', () => {
  const r = parseNewVoucher({ kind: 'percent', value: 80, count: 5, prefix: 'teman', maxUses: 1, validDays: '', code: '' });
  assert.deepEqual(r, { ok: true, v: { kind: 'percent', value: 80, maxUses: 1, validDays: null, count: 5, prefix: 'TEMAN', code: '' } });
  const t = parseNewVoucher({ kind: 'trial', value: 7, maxUses: null });
  assert.equal(t.ok && t.v.count, 1);
  const own = parseNewVoucher({ kind: 'fixed', value: 50000, code: 'hemat50k' });
  assert.equal(own.ok && own.v.code, 'HEMAT50K');
});

test('parseNewVoucher: isian tidak valid ditolak', () => {
  const bad: unknown[] = [
    null, {}, { kind: 'bonus', value: 5 }, { kind: 'percent', value: 0 }, { kind: 'percent', value: 101 }, { kind: 'percent', value: 1.5 }, { kind: 'percent', value: '20' },
    { kind: 'trial', value: 91 }, { kind: 'fixed', value: 99_999_999 },
    { kind: 'percent', value: 20, count: 0 }, { kind: 'percent', value: 20, count: 51 },
    { kind: 'percent', value: 20, maxUses: 0 }, { kind: 'percent', value: 20, validDays: 4000 },
    { kind: 'percent', value: 20, prefix: 'a b' }, { kind: 'percent', value: 20, prefix: 'X'.repeat(17) },
    { kind: 'percent', value: 20, code: 'ab' }, { kind: 'percent', value: 20, code: 'ABC', count: 2 },
  ];
  for (const b of bad) assert.equal(parseNewVoucher(b).ok, false, JSON.stringify(b));
});
