import { telLink } from '@/lib/social';
import { safeUrl, type Content, type CvStyle } from '@/lib/content';
import { photoSrc } from '@/lib/photo';

// Tampilan ringkas dari alamat tautan: "github.com/budi" bukan "https://github.com/budi/".
function shortUrl(u: string): string {
  try {
    const x = new URL(u);
    return x.host.replace(/^www\./, '') + (x.pathname === '/' ? '' : x.pathname.replace(/\/$/, ''));
  } catch {
    return u;
  }
}

function Contact({ c }: { c: Content }) {
  const links = c.contact.links.map((l) => ({ label: l.label, href: safeUrl(l.url) })).filter((l): l is { label: string; href: string } => !!l.href);
  const items: React.ReactNode[] = [];
  if (c.contact.email) items.push(c.contact.email);
  if (c.contact.phone) items.push(telLink(c.contact.phone) ? <a className="cv-link" href={telLink(c.contact.phone) as string}>{c.contact.phone}</a> : c.contact.phone);
  if (c.card.city) items.push(c.card.city);
  for (const l of links) items.push(<a className="cv-link" href={l.href}>{l.label ? `${l.label}: ` : ''}{shortUrl(l.href)}</a>);
  if (!items.length) return null;
  return (
    <ul className="cv-contact">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}

function Para({ text }: { text: string }) {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      {paras.map((p, i) => (
        <p key={i} style={{ margin: '0 0 .4rem', overflowWrap: 'anywhere' }}>{p}</p>
      ))}
    </>
  );
}

function About({ c }: { c: Content }) {
  if (!c.about.trim()) return null;
  return (
    <section className="cv-sec">
      <h2>Ringkasan</h2>
      <Para text={c.about} />
    </section>
  );
}

function Experience({ c }: { c: Content }) {
  if (!c.experience.length) return null;
  return (
    <section className="cv-sec">
      <h2>Pengalaman</h2>
      {c.experience.map((x, i) => (
        <div className="cv-item" key={i}>
          <div className="cv-row">
            <h3>{x.role || 'Peran'}</h3>
            {x.period ? <span className="cv-when">{x.period}</span> : null}
          </div>
          {x.org ? <p className="cv-org">{x.org}</p> : null}
          {x.desc ? <p>{x.desc}</p> : null}
        </div>
      ))}
    </section>
  );
}

function Education({ c }: { c: Content }) {
  if (!c.education.length) return null;
  return (
    <section className="cv-sec">
      <h2>Pendidikan</h2>
      {c.education.map((x, i) => (
        <div className="cv-item" key={i}>
          <div className="cv-row">
            <h3>{x.school || 'Institusi'}</h3>
            {x.period ? <span className="cv-when">{x.period}</span> : null}
          </div>
          {x.degree ? <p className="cv-org">{x.degree}</p> : null}
          {x.desc ? <p>{x.desc}</p> : null}
        </div>
      ))}
    </section>
  );
}

function Projects({ c }: { c: Content }) {
  if (!c.projects.length) return null;
  return (
    <section className="cv-sec">
      <h2>Proyek</h2>
      {c.projects.map((p, i) => {
        const link = safeUrl(p.url);
        return (
          <div className="cv-item" key={i}>
            <div className="cv-row">
              <h3>{p.title || 'Tanpa judul'}</h3>
              {p.year ? <span className="cv-when">{p.year}</span> : null}
            </div>
            {p.desc ? <p>{p.desc}</p> : null}
            {link ? <p className="cv-org">{shortUrl(link)}</p> : null}
          </div>
        );
      })}
    </section>
  );
}

function Skills({ c }: { c: Content }) {
  if (!c.skills.length) return null;
  return (
    <section className="cv-sec">
      <h2>Keahlian</h2>
      <ul className="cv-tags">
        {c.skills.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </section>
  );
}

// Lembar CV A4. Tabel dengan thead/tfoot kosong dipakai agar jarak atas dan bawah berulang di setiap halaman cetak.
function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <table className="cv-sheet">
      <thead>
        <tr>
          <td>
            <div className="cv-spacer" />
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{children}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td>
            <div className="cv-spacer" />
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

export default function CvView({ c, style }: { c: Content; style: CvStyle }) {
  const photo = c.cv.showPhoto && c.photoId ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="cv-photo" src={photoSrc(c.photoId)} alt={`Foto ${c.name}`} />
  ) : null;

  if (style === 'modern') {
    return (
      <div className="cv-page cv-modern">
        <Sheet>
          <div className="cv-grid">
            <aside className="cv-side">
              {photo}
              <h1 className="cv-name">{c.name}</h1>
              {c.role ? <p className="cv-role">{c.role}</p> : null}
              <Contact c={c} />
              <Skills c={c} />
            </aside>
            <div className="cv-main">
              <About c={c} />
              <Experience c={c} />
              <Education c={c} />
              <Projects c={c} />
            </div>
          </div>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="cv-page cv-ringkas">
      <Sheet>
        <div className="cv-inner">
          <header className="cv-head">
            <div style={{ minWidth: 0 }}>
              <h1 className="cv-name">{c.name}</h1>
              {c.role ? <p className="cv-role">{c.role}</p> : null}
              <Contact c={c} />
            </div>
            {photo}
          </header>
          <About c={c} />
          <Experience c={c} />
          <Education c={c} />
          <Projects c={c} />
          <Skills c={c} />
        </div>
      </Sheet>
    </div>
  );
}
