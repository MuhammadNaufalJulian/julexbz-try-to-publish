'use client';

import { useEffect, useMemo, useState } from 'react';
import SiteView from './SiteView';
import CopyButton from './CopyButton';
import { logout } from '@/app/actions';
import { THEMES } from '@/lib/themes';
import { LIMITS, CV_STYLES, type Content } from '@/lib/content';
import { TEMPLATES, templateMeta } from '@/lib/templates';

type Props = {
  initial: Content;
  slug: string;
  plan: string;
  publicUrl: string;
  rootUrl: string;
  single: boolean;
  email: string;
  live: boolean;
  expiresAt: string | null;
  admin?: boolean;
};

const TABS = [
  ['profil', 'Profil'],
  ['template', 'Template'],
  ['tentang', 'Tentang'],
  ['proyek', 'Proyek'],
  ['pengalaman', 'Pengalaman'],
  ['pendidikan', 'Pendidikan'],
  ['kontak', 'Kontak'],
  ['bagikan', 'Bagikan & CV'],
  ['alamat', 'Alamat'],
] as const;
type TabId = (typeof TABS)[number][0];

function Field(p: { id: string; label: string; value: string; onChange: (v: string) => void; area?: boolean; rows?: number; hint?: string; placeholder?: string; max?: number }) {
  return (
    <div className="fld">
      <label htmlFor={p.id}>{p.label}</label>
      {p.area ? (
        <textarea id={p.id} rows={p.rows ?? 4} value={p.value} placeholder={p.placeholder} maxLength={p.max} onChange={(e) => p.onChange(e.target.value)} />
      ) : (
        <input id={p.id} type="text" value={p.value} placeholder={p.placeholder} maxLength={p.max} autoComplete="off" onChange={(e) => p.onChange(e.target.value)} />
      )}
      {p.hint ? <p className="note">{p.hint}</p> : null}
    </div>
  );
}

function Controls({ i, n, onMove, onDelete }: { i: number; n: number; onMove: (d: number) => void; onDelete: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <div className="ic">
      <button type="button" className="btn sm" disabled={i === 0} onClick={() => onMove(-1)}>Naik</button>
      <button type="button" className="btn sm" disabled={i === n - 1} onClick={() => onMove(1)}>Turun</button>
      <button
        type="button"
        className="btn sm danger"
        onClick={() => {
          if (!armed) setArmed(true);
          else onDelete();
        }}
      >
        {armed ? 'Yakin hapus?' : 'Hapus'}
      </button>
    </div>
  );
}

// Memperkecil foto di browser supaya unggahan ringan (maks. sisi 800px, JPEG).
async function shrink(file: File): Promise<Blob> {
  const bm = await createImageBitmap(file);
  const sc = Math.min(1, 800 / Math.max(bm.width, bm.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(bm.width * sc);
  cv.height = Math.round(bm.height * sc);
  cv.getContext('2d')!.drawImage(bm, 0, 0, cv.width, cv.height);
  for (const q of [0.86, 0.72, 0.58, 0.45]) {
    const blob: Blob | null = await new Promise((res) => cv.toBlob(res, 'image/jpeg', q));
    if (blob && blob.size <= 650_000) return blob;
  }
  throw new Error('Foto terlalu besar.');
}

function move<T>(arr: T[], i: number, d: number) {
  const j = i + d;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

export default function Editor({ initial, slug: initialSlug, plan, publicUrl, rootUrl, single, email, live, expiresAt, admin }: Props) {
  const [c, setC] = useState<Content>(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [slug, setSlug] = useState(initialSlug);
  const [savedSlug, setSavedSlug] = useState(initialSlug);
  const [tab, setTab] = useState<TabId>('profil');
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const daysLeft = useMemo(() => (expiresAt ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000) : null), [expiresAt]);
  const dirty = useMemo(() => JSON.stringify(c) !== saved || slug !== savedSlug, [c, saved, slug, savedSlug]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const edit = (fn: (d: Content) => void) =>
    setC((prev) => {
      const d = structuredClone(prev);
      fn(d);
      return d;
    });

  async function save() {
    if (saving) return;
    setSaving(true);
    setMsg('Menyimpan...');
    try {
      const res = await fetch('/api/site', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: c, slug: slug !== savedSlug ? slug : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setMsg(data.error || 'Gagal menyimpan. Coba lagi.');
      } else {
        setC(data.content);
        setSaved(JSON.stringify(data.content));
        setSlug(data.slug);
        setSavedSlug(data.slug);
        if (data.needsPayment) {
          // Situs belum terbit: lanjut ke pembayaran QRIS. Setelah dibayar, situs terbit otomatis.
          setMsg('Tersimpan. Mengarahkan ke pembayaran...');
          window.location.assign('/bayar');
          return;
        }
        setMsg(data.slug !== savedSlug ? 'Tersimpan. Alamat situs berubah, bagikan tautan yang baru.' : 'Tersimpan. Situs sudah diperbarui.');
      }
    } catch {
      setMsg('Tidak ada koneksi. Perubahanmu belum tersimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function upload(file: File) {
    setMsg('Menyiapkan foto...');
    try {
      const blob = await shrink(file);
      setMsg('Mengunggah foto...');
      const res = await fetch('/api/photo', { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setMsg(data.error || 'Foto gagal diunggah.');
        return;
      }
      edit((d) => {
        d.photoId = data.id;
      });
      setMsg('Foto siap. Tekan Simpan untuk menerbitkan.');
    } catch {
      setMsg('Foto tidak bisa dibaca. Pakai JPG, PNG, atau WebP.');
    }
  }

  // Alamat publik mengikuti slug yang sudah tersimpan (bisa berubah setelah Simpan).
  const livePublicUrl = useMemo(() => {
    if (single) return publicUrl;
    try {
      const u = new URL(rootUrl);
      return `${u.protocol}//${savedSlug}.${u.host}`;
    } catch {
      return publicUrl;
    }
  }, [single, publicUrl, rootUrl, savedSlug]);

  return (
    <div className="ed" data-view={view}>
      <div className="pad">
        <header className="ed-top">
          <strong>Dashboard</strong>
          <span className="pill">{plan}</span>
          {admin ? <a className="btn" href="/admin/voucher">Voucher</a> : null}
          {live ? <a className="btn" href={livePublicUrl} target="_blank" rel="noopener noreferrer">Buka situs</a> : null}
          <button type="button" className="btn primary" disabled={!dirty || saving} onClick={save}>Simpan</button>
          <form action={logout}>
            <button type="submit" className="btn">Keluar</button>
          </form>
          <p className="ed-msg" aria-live="polite">{msg || (dirty ? 'Ada perubahan yang belum disimpan.' : '')}</p>
        </header>
        {!single && !live && expiresAt ? (
          <div className="banner warn" role="alert">
            <span><strong>Masa percobaan atau langgananmu sudah habis, jadi situsmu ditutup.</strong> Lanjutkan dengan bayar lewat QRIS, situsmu langsung tampil lagi dan semua isinya tetap aman.</span>
            <a className="btn sm primary" href="/bayar">Lanjutkan bayar</a>
          </div>
        ) : null}
        {!single && !live && !expiresAt ? (
          <div className="banner" role="status">
            <span>Situs belum terbit. Pilih template, tekan Simpan, lalu bayar lewat QRIS. Situs langsung terbit setelah dibayar.</span>
            <a className="btn sm primary" href="/bayar">Bayar sekarang</a>
          </div>
        ) : null}
        {!single && live && daysLeft !== null && (daysLeft <= 30 || plan === 'trial') ? (
          <div className="banner" role="status">
            <span>{plan === 'trial'
              ? (daysLeft > 0 ? `Masa percobaan berakhir ${daysLeft} hari lagi. Bayar supaya situs tetap tampil.` : 'Masa percobaan sudah berakhir. Bayar supaya situs tampil lagi.')
              : (daysLeft > 0 ? `Langganan berakhir ${daysLeft} hari lagi.` : 'Langganan sudah berakhir. Situs akan berhenti tampil setelah masa tenggang 3 hari.')}</span>
            <a className="btn sm primary" href="/bayar">{plan === 'trial' ? 'Bayar sekarang' : 'Perpanjang'}</a>
          </div>
        ) : null}
        <div className="ed-switch">
          <button type="button" className={`btn${view === 'edit' ? ' primary' : ''}`} onClick={() => setView('edit')}>Edit</button>
          <button type="button" className={`btn${view === 'preview' ? ' primary' : ''}`} onClick={() => setView('preview')}>Pratinjau</button>
        </div>
      </div>

      <div className="ed-main">
        <section className="ed-edit" aria-label="Pengaturan situs">
          <div className="tabs" role="tablist">
            {TABS.map(([id, label]) => (
              <button key={id} type="button" role="tab" className="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>
          <div className="ed-body pad">
            {tab === 'profil' && (
              <>
                <div className="fld">
                  <label htmlFor="f-photo">Foto profil</label>
                  {c.photoId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="thumb" src={`/api/photo/${c.photoId}`} alt="Foto profil saat ini" />
                  ) : null}
                  <input
                    id="f-photo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) upload(f);
                      e.target.value = '';
                    }}
                  />
                  <p className="note">Foto potret dengan wajah di tengah paling pas. Ukuran diperkecil otomatis.</p>
                  {c.photoId ? (
                    <div className="ic">
                      <button type="button" className="btn sm danger" onClick={() => edit((d) => { d.photoId = null; })}>Hapus foto</button>
                    </div>
                  ) : null}
                </div>
                <Field id="f-name" label="Nama" value={c.name} max={80} onChange={(v) => edit((d) => { d.name = v; })} />
                <Field id="f-role" label="Profesi" value={c.role} max={100} onChange={(v) => edit((d) => { d.role = v; })} />
                <Field id="f-org" label="Perusahaan atau afiliasi" value={c.card.org} max={80} hint="Tampil di kartu, di bawah profesi." onChange={(v) => edit((d) => { d.card.org = v; })} />
                <Field id="f-city" label="Kota" value={c.card.city} max={80} onChange={(v) => edit((d) => { d.card.city = v; })} />
                <Field id="f-label" label="Judul kecil di kartu" value={c.card.label} max={40} onChange={(v) => edit((d) => { d.card.label = v; })} />
                <Field id="f-status" label="Status singkat" value={c.status} max={80} hint="Kosongkan jika tidak ingin menampilkan status." onChange={(v) => edit((d) => { d.status = v; })} />
                <Field id="f-tagline" label="Perkenalan singkat" value={c.tagline} area rows={3} max={300} onChange={(v) => edit((d) => { d.tagline = v; })} />
                <Field id="f-title" label="Judul tab browser" value={c.siteTitle} max={80} onChange={(v) => edit((d) => { d.siteTitle = v; })} />
              </>
            )}

            {tab === 'template' && (
              <>
                <div className="fld">
                  <span className="note">Pilih tampilan situs, kartu, dan CV. Perubahan langsung terlihat di pratinjau.</span>
                  <div className="tplgrid" role="group" aria-label="Template">
                    {TEMPLATES.map((t) => (
                      <button key={t.id} type="button" className="tplbtn" aria-pressed={c.template === t.id} onClick={() => edit((d) => { d.template = t.id; })}>
                        <span className="tplprev" style={{ background: t.preview[0] }} aria-hidden="true">
                          <i style={{ background: t.preview[1] }} />
                          <i style={{ background: t.preview[1] }} />
                          <i style={{ background: t.preview[2] }} />
                        </span>
                        {t.label}
                        <small>{t.desc}</small>
                      </button>
                    ))}
                  </div>
                </div>
                {templateMeta(c.template).accentable ? (
                  <div className="fld">
                    <label>Warna utama</label>
                    <div className="themes" role="group" aria-label="Warna utama">
                      {THEMES.map((t) => (
                        <button key={t.id} type="button" className="themebtn" aria-pressed={c.theme === t.id} onClick={() => edit((d) => { d.theme = t.id; })}>
                          <i style={{ background: t.swatch }} aria-hidden="true" />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="note">Template ini punya palet warna sendiri. Pilih Klasik atau Cerah jika ingin mengganti warna utama.</p>
                )}
              </>
            )}

            {tab === 'tentang' && (
              <>
                <Field id="f-about" label="Tentang kamu" value={c.about} area rows={9} max={3000} hint="Pisahkan paragraf dengan satu baris kosong." onChange={(v) => edit((d) => { d.about = v; })} />
                <Field
                  id="f-skills"
                  label="Keahlian"
                  value={c.skills.join(', ')}
                  hint={`Pisahkan dengan koma, maksimal ${LIMITS.skills}. Enam yang pertama tampil di belakang kartu.`}
                  onChange={(v) => edit((d) => { d.skills = v.split(',').map((x) => x.trim()).filter(Boolean).slice(0, LIMITS.skills); })}
                />
              </>
            )}

            {tab === 'proyek' && (
              <>
                {c.projects.map((p, i) => (
                  <div className="box" key={i}>
                    <Field id={`p${i}-title`} label="Judul" value={p.title} max={100} onChange={(v) => edit((d) => { d.projects[i].title = v; })} />
                    <Field id={`p${i}-year`} label="Tahun" value={p.year} max={20} onChange={(v) => edit((d) => { d.projects[i].year = v; })} />
                    <Field id={`p${i}-desc`} label="Deskripsi" value={p.desc} area rows={3} max={400} onChange={(v) => edit((d) => { d.projects[i].desc = v; })} />
                    <Field id={`p${i}-tags`} label="Label" value={p.tags.join(', ')} hint="Pisahkan dengan koma." onChange={(v) => edit((d) => { d.projects[i].tags = v.split(',').map((x) => x.trim()).filter(Boolean).slice(0, LIMITS.tags); })} />
                    <Field id={`p${i}-url`} label="Tautan proyek" value={p.url} placeholder="https://" hint="Opsional." onChange={(v) => edit((d) => { d.projects[i].url = v; })} />
                    <Controls i={i} n={c.projects.length} onMove={(dir) => edit((d) => move(d.projects, i, dir))} onDelete={() => edit((d) => { d.projects.splice(i, 1); })} />
                  </div>
                ))}
                <button type="button" className="btn" disabled={c.projects.length >= LIMITS.projects} onClick={() => edit((d) => { d.projects.push({ title: '', year: '', desc: '', tags: [], url: '' }); })}>Tambah proyek</button>
              </>
            )}

            {tab === 'pengalaman' && (
              <>
                {c.experience.map((x, i) => (
                  <div className="box" key={i}>
                    <Field id={`x${i}-role`} label="Peran" value={x.role} max={100} onChange={(v) => edit((d) => { d.experience[i].role = v; })} />
                    <Field id={`x${i}-org`} label="Organisasi" value={x.org} max={100} onChange={(v) => edit((d) => { d.experience[i].org = v; })} />
                    <Field id={`x${i}-period`} label="Periode" value={x.period} max={40} placeholder="2022 - 2024" onChange={(v) => edit((d) => { d.experience[i].period = v; })} />
                    <Field id={`x${i}-desc`} label="Deskripsi" value={x.desc} area rows={3} max={400} onChange={(v) => edit((d) => { d.experience[i].desc = v; })} />
                    <Controls i={i} n={c.experience.length} onMove={(dir) => edit((d) => move(d.experience, i, dir))} onDelete={() => edit((d) => { d.experience.splice(i, 1); })} />
                  </div>
                ))}
                <button type="button" className="btn" disabled={c.experience.length >= LIMITS.experience} onClick={() => edit((d) => { d.experience.push({ role: '', org: '', period: '', desc: '' }); })}>Tambah pengalaman</button>
              </>
            )}

            {tab === 'pendidikan' && (
              <>
                {c.education.map((x, i) => (
                  <div className="box" key={i}>
                    <Field id={`e${i}-school`} label="Institusi" value={x.school} max={100} onChange={(v) => edit((d) => { d.education[i].school = v; })} />
                    <Field id={`e${i}-degree`} label="Jurusan atau gelar" value={x.degree} max={100} onChange={(v) => edit((d) => { d.education[i].degree = v; })} />
                    <Field id={`e${i}-period`} label="Periode" value={x.period} max={40} placeholder="2018 - 2022" onChange={(v) => edit((d) => { d.education[i].period = v; })} />
                    <Field id={`e${i}-desc`} label="Keterangan" value={x.desc} area rows={3} max={400} hint="Opsional, misalnya IPK atau organisasi." onChange={(v) => edit((d) => { d.education[i].desc = v; })} />
                    <Controls i={i} n={c.education.length} onMove={(dir) => edit((d) => move(d.education, i, dir))} onDelete={() => edit((d) => { d.education.splice(i, 1); })} />
                  </div>
                ))}
                <button type="button" className="btn" disabled={c.education.length >= LIMITS.education} onClick={() => edit((d) => { d.education.push({ school: '', degree: '', period: '', desc: '' }); })}>Tambah pendidikan</button>
              </>
            )}

            {tab === 'kontak' && (
              <>
                <Field id="f-email" label="Email" value={c.contact.email} max={120} hint="Tampil di belakang kartu dan di bagian Kontak, dengan tombol salin." onChange={(v) => edit((d) => { d.contact.email = v; })} />
                <Field id="f-phone" label="Nomor telepon" value={c.contact.phone} max={30} placeholder="+62 812 0000 0000" hint="Tampil publik di situs, di belakang kartu, di CV, dan di berkas kontak. Kosongkan jika tidak mau dipublikasikan." onChange={(v) => edit((d) => { d.contact.phone = v; })} />
                {c.contact.links.map((l, i) => (
                  <div className="box" key={i}>
                    <Field id={`l${i}-label`} label="Nama tautan" value={l.label} max={40} placeholder="Instagram" onChange={(v) => edit((d) => { d.contact.links[i].label = v; })} />
                    <Field id={`l${i}-url`} label="Alamat" value={l.url} placeholder="https://" onChange={(v) => edit((d) => { d.contact.links[i].url = v; })} />
                    <Controls i={i} n={c.contact.links.length} onMove={(dir) => edit((d) => move(d.contact.links, i, dir))} onDelete={() => edit((d) => { d.contact.links.splice(i, 1); })} />
                  </div>
                ))}
                <button type="button" className="btn" disabled={c.contact.links.length >= LIMITS.links} onClick={() => edit((d) => { d.contact.links.push({ label: '', url: '' }); })}>Tambah tautan</button>
              </>
            )}

            {tab === 'bagikan' && (
              <>
                <div className="fld">
                  <label>Tautan kartu</label>
                  <div className="linkrow">
                    <code>{livePublicUrl}/kartu</code>
                    <CopyButton text={`${livePublicUrl}/kartu`} />
                  </div>
                  <div className="ic">
                    <a className="btn sm" href={`https://wa.me/?text=${encodeURIComponent(`Kartu nama digital ${c.name}: ${livePublicUrl}/kartu`)}`} target="_blank" rel="noopener noreferrer">Kirim lewat WhatsApp</a>
                    <a className="btn sm" href={`${livePublicUrl}/kontak.vcf`}>Unduh kontak (.vcf)</a>
                  </div>
                  <p className="note">Tautan ini menampilkan kartu 3D saja, dengan tombol simpan kontak. Pratinjau gambar muncul otomatis saat dibagikan di chat. Perubahan baru terlihat di tautan setelah kamu menekan Simpan.</p>
                </div>
                <div className="fld">
                  <label>CV</label>
                  <div className="check">
                    <input id="cv-on" type="checkbox" checked={c.cv.enabled} onChange={(e) => edit((d) => { d.cv.enabled = e.target.checked; })} />
                    <label htmlFor="cv-on">Aktifkan halaman CV</label>
                  </div>
                  <div className="check">
                    <input id="cv-photo" type="checkbox" checked={c.cv.showPhoto} onChange={(e) => edit((d) => { d.cv.showPhoto = e.target.checked; })} />
                    <label htmlFor="cv-photo">Tampilkan foto di CV</label>
                  </div>
                  <label htmlFor="cv-style">Gaya CV</label>
                  <select id="cv-style" value={c.cv.style} onChange={(e) => edit((d) => { d.cv.style = e.target.value as Content['cv']['style']; })}>
                    {CV_STYLES.map((s) => (
                      <option key={s} value={s}>{s === 'ringkas' ? 'Ringkas (satu kolom)' : 'Modern (dua kolom)'}</option>
                    ))}
                  </select>
                  {c.cv.enabled ? (
                    <>
                      <div className="linkrow">
                        <code>{livePublicUrl}/cv</code>
                        <CopyButton text={`${livePublicUrl}/cv`} />
                      </div>
                      <div className="ic">
                        <a className="btn sm" href={`${livePublicUrl}/cv`} target="_blank" rel="noopener noreferrer">Lihat CV</a>
                        <a className="btn sm" href={`${livePublicUrl}/cv?cetak=1`} target="_blank" rel="noopener noreferrer">Unduh PDF</a>
                      </div>
                    </>
                  ) : null}
                  <p className="note">CV dibuat dari isi situsmu dan memuat nomor telepon serta email jika kamu isi. Di dialog cetak pilih &quot;Simpan sebagai PDF&quot;, ukuran A4, dan aktifkan grafik latar belakang.</p>
                </div>
              </>
            )}

            {tab === 'alamat' && (
              <>
                <div className="fld">
                  <label htmlFor="f-slug">Alamat situs</label>
                  {single ? (
                    <code className="mono">{publicUrl}</code>
                  ) : (
                    <>
                      <input id="f-slug" type="text" value={slug} maxLength={30} autoComplete="off" autoCapitalize="none" spellCheck={false} onChange={(e) => setSlug(e.target.value.toLowerCase())} />
                      <p className="note">Huruf kecil, angka, dan tanda hubung, 3 sampai 30 karakter. Jika diganti, tautan lama berhenti berfungsi.</p>
                    </>
                  )}
                </div>
                <div className="fld">
                  <label>Tautan untuk dibagikan</label>
                  <div className="mail">
                    <code className="mono" style={{ overflowWrap: 'anywhere' }}>{livePublicUrl}</code>
                    <CopyButton text={livePublicUrl} />
                  </div>
                </div>
                <div className="fld">
                  <label>Akun</label>
                  <p className="note">Masuk sebagai {email}. Paket: {plan}.</p>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="ed-prev" aria-label="Pratinjau">
          <SiteView content={c} plan={plan} rootUrl={rootUrl} embedded />
        </section>
      </div>
    </div>
  );
}
