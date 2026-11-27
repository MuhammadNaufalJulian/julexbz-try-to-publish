import { redirect } from 'next/navigation';
import { auth, googleEnabled } from '@/auth';
import { MODE } from '@/lib/config';
import { countUsers } from '@/lib/users';
import AuthForm from '@/components/AuthForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Masuk | julexbz.com', robots: { index: false } };

export default async function Page() {
  const session = await auth();
  if (session?.user?.id) redirect('/dashboard');
  const canRegister = MODE === 'multi' || (await countUsers()) === 0;
  return (
    <div className="pad">
      <AuthForm kind="login" google={googleEnabled} canRegister={canRegister} />
    </div>
  );
}
