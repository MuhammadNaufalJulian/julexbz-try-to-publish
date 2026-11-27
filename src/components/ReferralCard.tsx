import CopyButton from './CopyButton';
import type { ReferralInfo } from '@/lib/referral';
import { rupiah, PRO } from '@/lib/plans';

// Kartu "Undang teman" di dashboard. Hanya untuk pengguna dengan langganan pro yang aktif.
export default function ReferralCard({ info, rootUrl }: { info: ReferralInfo; rootUrl: string }) {
  const link = `${rootUrl.replace(/\/$/, '')}/r/${info.code}`;
  const price = rupiah(PRO.amount - Math.floor((PRO.amount * info.pct) / 100));
  const text = `Bikin personal website + kartu nama digital 3D di julexbz.com. Pakai link ini, diskon ${info.pct}% (jadi ${price}): ${link}`;
  const left = Math.max(0, info.cap - info.months);
  return (
    <section className="banner ref" aria-label="Undang teman">
      <div>
        <strong>Undang teman, dapat perpanjangan gratis</strong>
        <p>
          Teman yang daftar lewat link kamu dapat diskon {info.pct}%. Setiap teman yang berhasil bayar, langgananmu bertambah {info.monthsPer} bulan gratis
          ({info.invited} teman berhasil, {info.months} bulan didapat, sisa jatah {left} bulan).
        </p>
        <p className="ref-link"><code>{link}</code></p>
      </div>
      <div className="ref-act">
        <CopyButton text={link} />
        <a className="btn sm primary" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">Bagikan ke WhatsApp</a>
      </div>
    </section>
  );
}
