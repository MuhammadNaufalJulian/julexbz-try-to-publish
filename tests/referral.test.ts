import test from 'node:test';
import assert from 'node:assert/strict';
import { genRefCode, isRefCode, rewardMonths, REFERRAL } from '../src/lib/referralCore.ts';
import { parseNewVoucher } from '../src/lib/voucher.ts';

test('kode referral: bentuk dan pengenalan', () => {
  const c = genRefCode((n) => Math.floor(Math.random() * n));
  assert.match(c, /^REF-[A-Z2-9]{6}$/);
  assert.ok(isRefCode(c));
  assert.ok(!isRefCode('REF-ABC'));
  assert.ok(!isRefCode('TEMANJUL'));
  assert.ok(!isRefCode('REF-0OIL12'));
});

test('hadiah dibatasi total maksimal', () => {
  assert.equal(rewardMonths(0, 2, 24), 2);
  assert.equal(rewardMonths(22, 2, 24), 2);
  assert.equal(rewardMonths(23, 2, 24), 1);
  assert.equal(rewardMonths(24, 2, 24), 0);
  assert.equal(rewardMonths(30, 2, 24), 0);
});

test('angka bawaan program referral', () => {
  assert.equal(REFERRAL.discountPct, 20);
  assert.equal(REFERRAL.monthsPer, 2);
  assert.equal(REFERRAL.capMonths, 24);
  assert.equal(REFERRAL.enabled, true);
});

test('admin tidak bisa membuat voucher yang meniru kode referral', () => {
  const base = { kind: 'percent', value: 10, count: 1 };
  assert.equal(parseNewVoucher({ ...base, prefix: 'REF' }).ok, false);
  assert.equal(parseNewVoucher({ ...base, code: 'REF-ABCDEF' }).ok, false);
  assert.equal(parseNewVoucher({ ...base, prefix: 'TEMAN' }).ok, true);
});
