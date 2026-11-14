import { redirect } from 'next/navigation';
import { auth, googleEnabled } from '@/auth';
import { MODE } from '@/lib/config';
import { countUsers } from '@/lib/users';
import AuthForm from '@/components/AuthForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Daftar | julexbz.com', robots: { index: false } };

export default async function Page() {
  const session = await auth();
  if (session?.user?.id) redirect('/dashboard');
  if (MODE === 'single' && (await countUsers()) > 0) redirect('/masuk');
  return (
    <div className="pad">
      <AuthForm kind="register" google={googleEnabled} canRegister />
    </div>
  );
}
