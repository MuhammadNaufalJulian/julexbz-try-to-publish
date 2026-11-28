import { contactInfo } from '@/lib/config';
import { rootUrl } from '@/lib/home';

// Footer bersama: tautan legal selalu menuju domain utama (bukan subdomain situs orang) + kontak bantuan.
export default function SiteFooter({ label }: { label?: string }) {
  const root = rootUrl().replace(/\/$/, '');
  const c = contactInfo();
  return (
    <div className="legal-foot">
      <nav aria-label="Tautan legal">
        <a href={`${root}/privasi`}>Privasi</a>
        <a href={`${root}/syarat`}>Syarat</a>
        <a href={`${root}/refund`}>Refund</a>
      </nav>
      <p>
        <span>{label ?? 'Butuh bantuan?'}</span>
        {c.whatsapp ? <a href={`https://wa.me/${c.whatsapp}`}>WhatsApp</a> : null}
        {c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : null}
        {c.instagram ? <a href={`https://instagram.com/${c.instagram}`}>@{c.instagram}</a> : null}
      </p>
    </div>
  );
}
