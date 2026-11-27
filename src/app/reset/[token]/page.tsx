import Link from 'next/link';
import { isResetTokenValid } from '@/lib/passwordReset';
import ResetForm from '@/components/ResetForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Password baru | julexbz.com', robots: { index: false }, referrer: 'no-referrer' };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = token.length <= 100 && (await isResetTokenValid(token));
  return (
    <div className="pad">
      {valid ? (
        <ResetForm token={token} />
      ) : (
        <div className="authbox">
          <h1>Tautan tidak berlaku</h1>
          <p className="note">Tautan ini sudah dipakai atau kedaluwarsa.</p>
          <p className="note"><Link href="/lupa">Minta tautan baru</Link></p>
        </div>
      )}
    </div>
  );
}
