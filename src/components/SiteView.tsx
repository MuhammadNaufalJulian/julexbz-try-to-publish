import { safeUrl, type Content } from '@/lib/content';
import { showsBadge } from '@/lib/plans';
import { siteAttrs } from '@/lib/templates';
import LanyardCard from './LanyardCard';
import NavBar from './NavBar';
import CopyButton from './CopyButton';
import ShareButton from './ShareButton';

type Props = { content: Content; plan: string; rootUrl: string; embedded?: boolean };

function Section({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <section className="sec" id={id}>
      <h2 className="label">{label}</h2>
      <div className="body">{children}</div>
    </section>
  );
}

export default function SiteView({ content: c, plan, rootUrl, embedded }: Props) {
  const paras = c.about.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const links = c.contact.links.map((l) => ({ label: l.label, href: safeUrl(l.url) })).filter((l): l is { label: string; href: string } => !!l.href);
  const hasAbout = paras.length > 0 || c.skills.length > 0;
  const hasContact = !!c.contact.email || !!c.contact.phone || links.length > 0;
  const telHref = c.contact.phone ? `tel:${c.contact.phone.replace(/[^0-9+]/g, '')}` : null;

  const nav: [string, string][] = [];
  if (hasAbout) nav.push(['tentang', 'Tentang']);
  if (c.projects.length) nav.push(['proyek', 'Proyek']);
  if (c.experience.length) nav.push(['pengalaman', 'Pengalaman']);
  if (c.education.length) nav.push(['pendidikan', 'Pendidikan']);
  if (hasContact) nav.push(['kontak', 'Kontak']);

  return (
    <div className={`site${embedded ? ' embedded' : ''}`} {...siteAttrs(c)}>
      <div className="pad">
        <div className="wrap">
          <NavBar brand={c.name} items={nav} />

          <header className="hero" id="atas">
            <div className="hero-text">
              {c.status ? (
                <p className="status">
                  <span className="dot" aria-hidden="true" />
                  {c.status}
                </p>
              ) : null}
              <h1 className="name">{c.name}</h1>
              {c.role ? <p className="role">{c.role}</p> : null}
              {c.tagline ? <p className="tagline">{c.tagline}</p> : null}
              {/* Di pratinjau dashboard tombol ini tidak aktif karena alamatnya milik dashboard, bukan situs. */}
              <div className="cta" inert={embedded}>
                <a className="btn primary lg" href="/kontak.vcf">Simpan kontak</a>
                <ShareButton name={c.name} />
                {c.projects.length ? <a className="btn lg" href="#proyek">Lihat proyek</a> : null}
                {c.cv.enabled ? <a className="btn lg" href="/cv">Lihat CV</a> : null}
              </div>
              <p className="hint">Tarik kartu untuk mengayunkannya. Ketuk untuk membalik.</p>
            </div>
            <LanyardCard c={c} />
          </header>

          {hasAbout ? (
            <Section id="tentang" label="Tentang">
              <div className="prose">
                {paras.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {c.skills.length ? (
                <ul className="skills">
                  {c.skills.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              ) : null}
            </Section>
          ) : null}

          {c.projects.length ? (
            <Section id="proyek" label="Proyek">
              {c.projects.map((p, i) => {
                const link = safeUrl(p.url);
                const title = p.title || 'Tanpa judul';
                return (
                  <article className="item" key={i}>
                    <div className="item-head">
                      <h3>
                        {link ? (
                          <a href={link} target="_blank" rel="noopener noreferrer">{title}</a>
                        ) : (
                          title
                        )}
                      </h3>
                      {p.year ? <span className="meta">{p.year}</span> : null}
                    </div>
                    {p.desc ? <p>{p.desc}</p> : null}
                    {p.tags.length ? <p className="tags">{p.tags.join(' / ')}</p> : null}
                    {link ? (
                      <a className="go" href={link} target="_blank" rel="noopener noreferrer">Lihat proyek {'↗'}</a>
                    ) : null}
                  </article>
                );
              })}
            </Section>
          ) : null}

          {c.experience.length ? (
            <Section id="pengalaman" label="Pengalaman">
              {c.experience.map((x, i) => (
                <article className="item" key={i}>
                  <div className="item-head">
                    <h3>{x.role || 'Peran'}</h3>
                    {x.period ? <span className="meta">{x.period}</span> : null}
                  </div>
                  {x.org ? <p className="org">{x.org}</p> : null}
                  {x.desc ? <p>{x.desc}</p> : null}
                </article>
              ))}
            </Section>
          ) : null}

          {c.education.length ? (
            <Section id="pendidikan" label="Pendidikan">
              {c.education.map((x, i) => (
                <article className="item" key={i}>
                  <div className="item-head">
                    <h3>{x.school || 'Institusi'}</h3>
                    {x.period ? <span className="meta">{x.period}</span> : null}
                  </div>
                  {x.degree ? <p className="org">{x.degree}</p> : null}
                  {x.desc ? <p>{x.desc}</p> : null}
                </article>
              ))}
            </Section>
          ) : null}

          {hasContact ? (
            <Section id="kontak" label="Kontak">
              {c.contact.email ? (
                <div className="mail">
                  <code>{c.contact.email}</code>
                  <CopyButton text={c.contact.email} />
                </div>
              ) : null}
              {c.contact.phone ? (
                <p className="mail" style={{ marginTop: c.contact.email ? '.5rem' : 0 }}>
                  <code>{telHref ? <a href={telHref}>{c.contact.phone}</a> : c.contact.phone}</code>
                </p>
              ) : null}
              {links.length ? (
                <ul className="links">
                  {links.map((l, i) => (
                    <li key={i}>
                      <a href={l.href} target="_blank" rel="noopener noreferrer">{l.label || l.href}</a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Section>
          ) : null}

          <footer className="foot">
            <span>{'©'} {c.name}</span>
            {showsBadge(plan) ? <a href={rootUrl}>Dibuat dengan julexbz.com</a> : null}
          </footer>
        </div>
      </div>
    </div>
  );
}
