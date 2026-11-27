import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { MODE, ROOT_DOMAIN, siteUrl, isAdminEmail } from '@/lib/config';
import { getSiteByUserId } from '@/lib/sites';
import Editor from '@/components/Editor';
import ClaimSite from '@/components/ClaimSite';
import ReferralCard from '@/components/ReferralCard';
import { getReferralInfo } from '@/lib/referral';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard | julexbz.com', robots: { index: false } };

export default async function Page() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) redirect('/masuk');

  const site = await getSiteByUserId(user.id);
  if (!site) return <ClaimSite single={MODE === 'single'} rootHost={ROOT_DOMAIN} name={user.name || 'kamu'} />;

  // Kartu undangan hanya untuk situs pro yang sedang aktif dan bukan akun tanpa batas waktu.
  const rootUrl = process.env.NEXT_PUBLIC_ROOT_URL || 'http://localhost:3000';
  const proActive = MODE !== 'single' && site.plan === 'pro' && site.published && site.planExpiresAt !== null;
  const info = proActive ? await getReferralInfo(user.id) : null;

  return (
    <Editor
      initial={site.content}
      slug={site.slug}
      plan={site.plan}
      publicUrl={siteUrl(site.slug)}
      rootUrl={process.env.NEXT_PUBLIC_ROOT_URL || 'http://localhost:3000'}
      single={MODE === 'single'}
      email={user.email || ''}
      live={site.published}
      expiresAt={site.planExpiresAt}
      admin={MODE !== 'single' && isAdminEmail(user.email)}
      referral={info ? <ReferralCard info={info} rootUrl={rootUrl} /> : null}
    />
  );
}
