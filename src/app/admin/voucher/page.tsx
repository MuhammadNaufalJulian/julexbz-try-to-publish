import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { isAdminEmail, MODE } from '@/lib/config';
import { PRO } from '@/lib/plans';
import VoucherAdmin from '@/components/VoucherAdmin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Voucher | julexbz.com', robots: { index: false, follow: false } };

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id || !isAdminEmail(session.user.email) || MODE === 'single') notFound();
  return (
    <div className="site" data-template="klasik" data-theme="cobalt">
      <div className="pad">
        <main className="wrap vadm">
          <a href="/dashboard" className="btn sm">Kembali ke dashboard</a>
          <h1>Pembuat voucher</h1>
          <VoucherAdmin price={PRO.amount} rootUrl={process.env.NEXT_PUBLIC_ROOT_URL || ''} />
        </main>
      </div>
    </div>
  );
}
