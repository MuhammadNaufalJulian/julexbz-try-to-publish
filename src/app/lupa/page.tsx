import ResetForm from '@/components/ResetForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Lupa password | julexbz.com', robots: { index: false } };

export default function Page() {
  return (
    <div className="pad">
      <ResetForm />
    </div>
  );
}
