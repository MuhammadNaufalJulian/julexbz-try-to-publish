// Paket langganan. Pembayaran lewat QRIS (Midtrans), lihat src/lib/orders.ts.

export type PlanId = 'free' | 'trial' | 'pro';

// Harga dan masa aktif ditentukan di server. Angka dari browser tidak pernah dipercaya.
// amount = harga yang ditagih (promo). listAmount = harga normal yang ditampilkan dicoret.
export const PRO = { id: 'pro' as const, amount: 149_000, listAmount: 299_000, months: 12 };

// Voucher jenis "trial" memberi masa percobaan gratis. Tidak ada masa tenggang, setelah habis situs berhenti tampil.
export const TRIAL = { id: 'trial' as const, maxDays: 90 };

export function rupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

export const PLANS: { id: PlanId; name: string; price: string; was: string; points: string[] }[] = [
  {
    id: 'pro',
    name: 'Situs + Kartu Digital',
    price: `${rupiah(PRO.amount)} / tahun`,
    was: rupiah(PRO.listAmount),
    points: [
      'Situs di nama.julexbz.com, terbit otomatis setelah bayar',
      'Kartu 3D depan dan belakang, bisa dibagikan lewat tautan',
      '23 template (playful dan khusus profesi) dan 6 warna, ekspor CV ke PDF',
      'Dashboard untuk edit kapan saja',
      'Bayar mudah lewat QRIS (GoPay, OVO, DANA, ShopeePay, m-banking)',
    ],
  },
];

// Tanda "Dibuat dengan julexbz.com" hanya untuk situs yang bukan paket pro (misalnya akun gratis milik pemilik).
export function showsBadge(plan: string): boolean {
  return plan !== 'pro';
}
