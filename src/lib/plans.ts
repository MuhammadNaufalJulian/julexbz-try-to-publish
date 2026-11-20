// Paket langganan. Pembayaran lewat QRIS (Midtrans), lihat src/lib/orders.ts.

export type PlanId = 'free' | 'pro';

// Harga dan masa aktif ditentukan di server. Angka dari browser tidak pernah dipercaya.
export const PRO = { id: 'pro' as const, amount: 299_000, months: 12 };

export function rupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

export const PLANS: { id: PlanId; name: string; price: string; points: string[] }[] = [
  {
    id: 'pro',
    name: 'Situs + Kartu Digital',
    price: `${rupiah(PRO.amount)} / tahun`,
    points: [
      'Situs di nama.julexbz.com, terbit otomatis setelah bayar',
      'Kartu 3D depan dan belakang, bisa dibagikan lewat tautan',
      '5 template dan 6 warna, ekspor CV ke PDF',
      'Dashboard untuk edit kapan saja',
      'Bayar mudah lewat QRIS (GoPay, OVO, DANA, ShopeePay, m-banking)',
    ],
  },
];

// Tanda "Dibuat dengan julexbz.com" hanya untuk situs yang bukan paket pro (misalnya akun gratis milik pemilik).
export function showsBadge(plan: string): boolean {
  return plan !== 'pro';
}
