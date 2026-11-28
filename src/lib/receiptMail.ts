import { esc, layout, sendEmail } from './email.ts';
import { contactInfo } from './config.ts';
import { rupiah } from './plans.ts';

export type ReceiptData = {
  orderId: string;
  email: string;
  name: string | null;
  slug: string;
  amount: number;
  discount: number;
  voucherCode: string | null;
  paidAt: Date;
  expiresAt: Date | null;
};

const TANGGAL = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
const fmtDate = (d: Date) => TANGGAL.format(d);

// Isi email bukti bayar (murni, tanpa database supaya mudah dites). Semua nilai dari pengguna lewat esc().
export function buildReceipt(d: ReceiptData, root: string = 'https://julexbz.com'): { subject: string; html: string; text: string } {
  const c = contactInfo();
  const help = c.email ? c.email : c.instagram ? `instagram.com/${c.instagram}` : 'kontak di julexbz.com';
  const rows: [string, string][] = [
    ['No. pesanan', d.orderId],
    ['Tanggal bayar', fmtDate(d.paidAt)],
    ['Item', 'Situs + Kartu Digital, 12 bulan'],
    ['Situs', d.slug],
  ];
  if (d.voucherCode && d.discount > 0) rows.push(['Voucher', `${d.voucherCode} (-${rupiah(d.discount)})`]);
  rows.push(['Total dibayar', rupiah(d.amount)]);
  if (d.expiresAt) rows.push(['Aktif sampai', fmtDate(d.expiresAt)]);

  const table = `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#666">${esc(k)}</td><td style="padding:6px 0;text-align:right"><b>${esc(v)}</b></td></tr>`)
    .join('')}</table>`;
  const hi = d.name ? `Halo ${esc(d.name)},` : 'Halo,';
  const html = layout(
    'Pembayaran berhasil',
    `<p>${hi} terima kasih. Pembayaranmu sudah kami terima dan situsmu aktif.</p>${table}<p style="font-size:13px;color:#666">Simpan email ini sebagai bukti pembayaran. Butuh bantuan atau refund? Hubungi ${esc(help)} dan sebutkan nomor pesanan.</p>`,
    { href: `${root.replace(/\/$/, '')}/dashboard`, label: 'Buka dashboard' },
  );
  const text = `${d.name ? `Halo ${d.name},` : 'Halo,'} pembayaranmu berhasil dan situsmu aktif.\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nSimpan email ini sebagai bukti pembayaran. Bantuan: ${help}`;
  return { subject: `Bukti pembayaran ${d.orderId}`, html, text };
}

