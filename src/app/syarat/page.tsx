import LegalPage, { legalMetadata } from '@/components/LegalPage';

export const metadata = legalMetadata('syarat');

export default function Page() {
  return <LegalPage slug="syarat" />;
}
