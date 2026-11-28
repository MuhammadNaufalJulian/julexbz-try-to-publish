import SiteFooter from './SiteFooter';
import Link from 'next/link';
import { ROOT_DOMAIN } from '@/lib/config';
import { sampleContent } from '@/lib/content';
import { THEMES } from '@/lib/themes';
import { PLANS } from '@/lib/plans';
import LanyardCard from '@/components/LanyardCard';

export default function Marketing() {
  const demo = sampleContent();
  return (
    <div className="site" data-template="klasik" data-theme="cobalt">
      <div className="pad">
        <div className="wrap">
          <nav className="mk-nav" aria-label="Utama">
            <Link className="mk-logo" href="/mulai">julexbz.com</Link>
            <div className="mk-actions">
              <Link className="btn" href="/masuk">Masuk</Link>
              <Link className="btn primary" href="/daftar">Daftar</Link>
            </div>
          </nav>

          <header className="hero">
            <div className="hero-text">
              <p className="status"><span className="dot" aria-hidden="true" />Terbit otomatis setelah bayar QRIS</p>
              <h1 className="name">Kartu nama digitalmu, jadi situs.</h1>
              <p className="tagline">Satu alamat <span className="mono">namamu.{ROOT_DOMAIN}</span> berisi kartu 3D yang bisa ditarik dan dibalik, lengkap dengan proyek, pengalaman, dan kontakmu. Edit kapan saja dari dashboard.</p>
              <div className="cta">
                <Link className="btn primary lg" href="/daftar">Buat situsku</Link>
                <Link className="btn lg" href="#harga">Lihat paket</Link>
              </div>
              <p className="hint">Coba tarik kartu di samping.</p>
            </div>
            <LanyardCard c={demo} />
          </header>

          <section className="mk-sec">
            <h2>Semua yang kamu perlukan, tanpa ribet</h2>
            <ul className="feats">
              <li><h3>Rapi di HP</h3><p>Tampilan menyesuaikan layar. Cocok dibuka dari tautan di bio atau kartu nama cetak.</p></li>
              <li><h3>Edit tanpa coding</h3><p>Ganti foto, teks, proyek, dan warna dari dashboard. Pratinjau langsung terlihat.</p></li>
              <li><h3>Enam tema warna</h3><p>Pilih warna yang cocok dengan citramu. Mode gelap mengikuti perangkat pengunjung.</p></li>
            </ul>
            <div className="swatches" aria-label="Tema warna yang tersedia">
              {THEMES.map((t) => (
                <span key={t.id} className="sw" style={{ background: t.swatch }} title={t.label} />
              ))}
            </div>
          </section>

          <section className="mk-sec" id="harga">
            <h2>Paket</h2>
            <div className="plans">
              {PLANS.map((p) => (
                <div key={p.id} className="plan hl">
                  <h3>{p.name}</h3>
                  <p className="price"><s className="was">{p.was}</s> {p.price}</p>
                  <ul>
                    {p.points.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <footer className="foot">
            <span>{'©'} julexbz.com</span>
            <Link href="/masuk">Masuk</Link>
          </footer>
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
