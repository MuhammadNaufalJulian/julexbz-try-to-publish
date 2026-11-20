// Mengelola voucher diskon tanpa menulis SQL.
// Pakai (dari folder proyek, DATABASE_URL ada di .env):
//   node --env-file=.env scripts/voucher.mjs buat PROMO20 persen 20 [maks_pakai] [hari_berlaku]
//   node --env-file=.env scripts/voucher.mjs buat HEMAT50K rupiah 50000 100 30
//   node --env-file=.env scripts/voucher.mjs daftar
//   node --env-file=.env scripts/voucher.mjs matikan PROMO20
//   node --env-file=.env scripts/voucher.mjs nyalakan PROMO20
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL belum diatur. Jalankan dengan: node --env-file=.env scripts/voucher.mjs ...');
  process.exit(1);
}
const sql = neon(url);
const [cmd, ...a] = process.argv.slice(2);

function bad(msg) {
  console.error(msg);
  process.exit(1);
}

if (cmd === 'buat') {
  const code = String(a[0] ?? '').trim().toUpperCase();
  const kind = { persen: 'percent', rupiah: 'fixed' }[a[1]];
  const value = Number(a[2]);
  const max = a[3] ? Number(a[3]) : null;
  const days = a[4] ? Number(a[4]) : null;
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) bad('Kode: 3-30 karakter, huruf besar/angka/-/_. Contoh: PROMO20');
  if (!kind) bad('Jenis harus "persen" atau "rupiah".');
  if (!Number.isInteger(value) || value < 1) bad('Nilai harus bilangan bulat positif.');
  if (kind === 'percent' && value > 100) bad('Persen maksimal 100.');
  if (max !== null && (!Number.isInteger(max) || max < 1)) bad('maks_pakai harus bilangan bulat positif.');
  if (days !== null && (!Number.isInteger(days) || days < 1)) bad('hari_berlaku harus bilangan bulat positif.');
  try {
    await sql.query(
      `insert into vouchers (code, kind, value, max_uses, expires_at) values ($1, $2, $3, $4, case when $5::int is null then null else now() + make_interval(days => $5::int) end)`,
      [code, kind, value, max, days],
    );
  } catch (e) {
    if (e && e.code === '23505') bad(`Kode ${code} sudah ada.`);
    throw e;
  }
  console.log(`Voucher ${code} dibuat: ${kind === 'percent' ? value + '%' : 'Rp ' + value.toLocaleString('id-ID')}${max ? `, maks ${max}x` : ''}${days ? `, berlaku ${days} hari` : ''}.`);
} else if (cmd === 'daftar') {
  const rows = await sql.query(`select code, kind, value, used, max_uses, expires_at, active from vouchers order by created_at desc`);
  if (!rows.length) console.log('Belum ada voucher.');
  for (const r of rows) {
    const val = r.kind === 'percent' ? r.value + '%' : 'Rp ' + r.value.toLocaleString('id-ID');
    const exp = r.expires_at ? new Date(r.expires_at).toLocaleDateString('id-ID') : 'tanpa batas';
    console.log(`${r.code.padEnd(16)} ${val.padEnd(12)} terpakai ${r.used}${r.max_uses ? '/' + r.max_uses : ''}  berlaku s/d ${exp}  ${r.active ? 'aktif' : 'MATI'}`);
  }
} else if (cmd === 'matikan' || cmd === 'nyalakan') {
  const code = String(a[0] ?? '').trim().toUpperCase();
  const rows = await sql.query('update vouchers set active = $2 where code = $1 returning code', [code, cmd === 'nyalakan']);
  console.log(rows.length ? `Voucher ${code} ${cmd === 'nyalakan' ? 'dinyalakan' : 'dimatikan'}.` : `Voucher ${code} tidak ditemukan.`);
} else {
  bad('Perintah: buat | daftar | matikan | nyalakan. Lihat komentar di atas file ini.');
}
