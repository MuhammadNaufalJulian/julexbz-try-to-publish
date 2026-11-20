import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { MODE, ROOT_DOMAIN, siteUrl } from '@/lib/config';
import { getSiteByUserId } from '@/lib/sites';
import Editor from '@/components/Editor';
import ClaimSite from '@/components/ClaimSite';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard | julexbz.com', robots: { index: false } };

export default async function Page() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) redirect('/masuk');

  const site = await getSiteByUserId(user.id);
  if (!site) return <ClaimSite single={MODE === 'single'} rootHost={ROOT_DOMAIN} name={user.name || 'kamu'} />;

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
    />
  );
}
