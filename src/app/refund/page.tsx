import LegalPage, { legalMetadata } from '@/components/LegalPage';

export const metadata = legalMetadata('refund');

export default function Page() {
  return <LegalPage slug="refund" />;
}
