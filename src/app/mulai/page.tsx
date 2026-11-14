import type { Metadata } from 'next';
import Marketing from '@/components/Marketing';

export const metadata: Metadata = {
  title: 'julexbz.com | Kartu nama digital 3D',
  description: 'Bikin situs pribadi berbentuk kartu nama digital 3D di alamat namamu.julexbz.com. Edit kapan saja dari dashboard.',
};

export default function Page() {
  return <Marketing />;
}
