import LegalPage, { legalMetadata } from '@/components/LegalPage';

export const metadata = legalMetadata('privasi');

export default function Page() {
  return <LegalPage slug="privasi" />;
}
