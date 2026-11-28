import { LEGAL, LEGAL_UPDATED, type LegalDoc } from '@/lib/legal';
import SiteFooter from './SiteFooter';

export function legalMetadata(slug: LegalDoc['slug']) {
  return { title: `${LEGAL[slug].title} | julexbz.com`, description: LEGAL[slug].intro };
}

export default function LegalPage({ slug }: { slug: LegalDoc['slug'] }) {
  const d = LEGAL[slug];
  return (
    <div className="site" data-template="klasik" data-theme="cobalt">
      <div className="pad">
        <main className="wrap legal">
          <a href="/" className="btn sm">Beranda</a>
          <h1>{d.title}</h1>
          <p className="sub">Terakhir diperbarui: {LEGAL_UPDATED}</p>
          <p>{d.intro}</p>
          {d.sections.map((s) => (
            <section key={s.h}>
              <h2>{s.h}</h2>
              {s.p.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </section>
          ))}
          <SiteFooter label="Pertanyaan atau permintaan data?" />
        </main>
      </div>
    </div>
  );
}
