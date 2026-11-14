import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { MODE, siteUrl } from '@/lib/config';
import { getSiteByUserId } from '@/lib/sites';
import { PRO, rupiah } from '@/lib/plans';
import { midtransConfigured } from '@/lib/midtrans';
import PayPanel from '@/components/PayPanel';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Bayar | julexbz.com', robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const v = Array.isArray(sp.voucher) ? sp.voucher[0] : sp.voucher;
  const session = await auth();
  const user = session?.user;
  if (!user?.id) redirect('/masuk');
  if (MODE === 'single') redirect('/dashboard');

  const site = await getSiteByUserId(user.id);
  if (!site) redirect('/dashboard');

  return (
    <div className="site" data-template="klasik" data-theme="cobalt">
      <div className="pad">
        <main className="wrap pay">
          <a href="/dashboard" className="btn sm">Kembali ke dashboard</a>
          <h1>{site.published ? 'Perpanjang langganan' : 'Bayar untuk menerbitkan situs'}</h1>
          <p className="sub">
            Situs + Kartu Digital, {PRO.months} bulan, <s className="was">{rupiah(PRO.listAmount)}</s> <strong>{rupiah(PRO.amount)}</strong>. Setelah dibayar, {siteUrl(site.slug).replace(/^https?:\/\//, '')} langsung terbit. Punya voucher? Masukkan di bawah.
          </p>
          {midtransConfigured() ? (
            <PayPanel price={PRO.amount} listPrice={PRO.listAmount} siteHref={siteUrl(site.slug)} initialVoucher={(v ?? '').slice(0, 30)} />
          ) : (
            <p className="box" role="alert">Pembayaran belum dikonfigurasi di server (MIDTRANS_SERVER_KEY kosong).</p>
          )}
        </main>
      </div>
    </div>
  );
}
