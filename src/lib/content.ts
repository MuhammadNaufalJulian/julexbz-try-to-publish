// Bentuk data satu situs, nilai awal, dan pembersih input dari klien.
// Tanpa dependensi supaya mudah diuji.

export const THEME_IDS = ['cobalt', 'emerald', 'sunset', 'violet', 'rose', 'graphite'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

// Template = tampilan lengkap situs (warna dasar, huruf, gaya komponen). Tema = warna aksen untuk template yang mengizinkannya.
export const TEMPLATE_IDS = ['klasik', 'cerah', 'pop', 'neon', 'gradasi', 'permen', 'stiker', 'arcade', 'boba', 'komik', 'awan'] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const CV_STYLES = ['ringkas', 'modern'] as const;
export type CvStyle = (typeof CV_STYLES)[number];

export type Link = { label: string; url: string };
export type Project = { title: string; year: string; desc: string; tags: string[]; url: string };
export type Experience = { role: string; org: string; period: string; desc: string };
export type Education = { school: string; degree: string; period: string; desc: string };

export type Content = {
  template: TemplateId;
  theme: ThemeId;
  siteTitle: string;
  name: string;
  status: string;
  role: string;
  tagline: string;
  photoId: string | null;
  card: { label: string; org: string; city: string };
  about: string;
  skills: string[];
  projects: Project[];
  experience: Experience[];
  education: Education[];
  contact: { email: string; phone: string; links: Link[] };
  cv: { enabled: boolean; showPhoto: boolean; style: CvStyle };
};

export const LIMITS = {
  projects: 12,
  experience: 10,
  education: 8,
  links: 8,
  skills: 20,
  tags: 6,
};

export function defaultContent(name = 'Nama Kamu'): Content {
  return {
    template: 'klasik',
    theme: 'cobalt',
    siteTitle: name,
    name,
    status: 'Terbuka untuk proyek baru',
    role: 'Profesi kamu',
    tagline: 'Tulis perkenalan singkat di sini. Satu atau dua kalimat sudah cukup.',
    photoId: null,
    card: { label: 'Kartu Nama Digital', org: '', city: '' },
    about: 'Ceritakan apa yang kamu kerjakan, bidang yang kamu sukai, dan apa yang kamu cari sekarang.',
    skills: [],
    projects: [],
    experience: [],
    education: [],
    contact: { email: '', phone: '', links: [] },
    cv: { enabled: true, showPhoto: true, style: 'ringkas' },
  };
}

export function sampleContent(): Content {
  return {
    template: 'klasik',
    theme: 'cobalt',
    siteTitle: 'Contoh Situs',
    name: 'Sari Wulandari',
    status: 'Terbuka untuk proyek freelance',
    role: 'Product Designer & Front-end Developer',
    tagline: 'Saya merancang dan membangun produk digital yang mudah dipakai.',
    photoId: null,
    card: { label: 'Kartu Nama Digital', org: 'Studio Lepas', city: 'Bandung' },
    about: 'Contoh isi situs. Kamu bisa mengganti semua teks, foto, proyek, dan tema warna dari dashboard.',
    skills: ['Desain antarmuka', 'Prototyping', 'HTML & CSS', 'JavaScript', 'Riset pengguna'],
    projects: [
      { title: 'Aplikasi Kasir UMKM', year: '2025', desc: 'Mencatat penjualan, stok, dan laporan harian dari satu layar.', tags: ['Produk', 'Front-end'], url: '' },
    ],
    experience: [{ role: 'Front-end Developer', org: 'Studio Lepas', period: '2024 - sekarang', desc: 'Membangun antarmuka aplikasi web untuk pelanggan bisnis.' }],
    education: [{ school: 'Universitas Contoh', degree: 'S1 Desain Komunikasi Visual', period: '2018 - 2022', desc: '' }],
    contact: { email: 'halo@contoh.id', phone: '', links: [{ label: 'LinkedIn', url: 'https://www.linkedin.com/' }] },
    cv: { enabled: true, showPhoto: true, style: 'ringkas' },
  };
}

type Res<T> = { ok: true; value: T } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[0-9(][0-9 ()\-.]{4,28}[0-9]$/;

function text(v: unknown, max: number, label: string): Res<string> {
  if (v == null) return { ok: true, value: '' };
  if (typeof v !== 'string') return { ok: false, error: `${label} harus berupa teks.` };
  const s = v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
  if (s.length > max) return { ok: false, error: `${label} maksimal ${max} karakter.` };
  return { ok: true, value: s };
}

function url(v: unknown, label: string): Res<string> {
  const t = text(v, 300, label);
  if (!t.ok) return t;
  if (!t.value) return t;
  let u = t.value;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return { ok: false, error: `${label} harus diawali http atau https.` };
    return { ok: true, value: parsed.href };
  } catch {
    return { ok: false, error: `${label} bukan alamat yang valid.` };
  }
}

// Dipakai saat menampilkan: hanya tautan http/https yang dirender sebagai link.
export function safeUrl(v: string): string | null {
  const r = url(v, 'Tautan');
  return r.ok && r.value ? r.value : null;
}

function list<T>(v: unknown, max: number, label: string, each: (item: unknown, i: number) => Res<T>): Res<T[]> {
  if (v == null) return { ok: true, value: [] };
  if (!Array.isArray(v)) return { ok: false, error: `${label} tidak valid.` };
  if (v.length > max) return { ok: false, error: `${label} maksimal ${max} item.` };
  const out: T[] = [];
  for (let i = 0; i < v.length; i++) {
    const r = each(v[i], i);
    if (!r.ok) return r;
    out.push(r.value);
  }
  return { ok: true, value: out };
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

export function sanitizeContent(input: unknown): Res<Content> {
  const r = obj(input);
  const fields: [string, Res<string>][] = [];
  const f = (key: string, max: number, label: string) => {
    const res = text(r[key], max, label);
    fields.push([key, res]);
    return res;
  };

  const theme = r.theme;
  if (typeof theme !== 'string' || !(THEME_IDS as readonly string[]).includes(theme)) return { ok: false, error: 'Tema warna tidak dikenal.' };

  // Data lama tanpa template jatuh ke "klasik". Nilai yang diisi tapi tidak dikenal ditolak.
  let template: TemplateId = 'klasik';
  if (r.template != null) {
    if (typeof r.template !== 'string' || !(TEMPLATE_IDS as readonly string[]).includes(r.template)) return { ok: false, error: 'Template tidak dikenal.' };
    template = r.template as TemplateId;
  }

  const siteTitle = f('siteTitle', 80, 'Judul tab');
  const name = f('name', 80, 'Nama');
  const status = f('status', 80, 'Status');
  const role = f('role', 100, 'Profesi');
  const tagline = f('tagline', 300, 'Perkenalan singkat');
  const about = f('about', 3000, 'Tentang');
  for (const [, res] of fields) if (!res.ok) return res;
  if (!name.ok || !name.value) return { ok: false, error: 'Nama tidak boleh kosong.' };

  let photoId: string | null = null;
  if (r.photoId != null && r.photoId !== '') {
    if (typeof r.photoId !== 'string' || !UUID.test(r.photoId)) return { ok: false, error: 'Foto tidak valid.' };
    photoId = r.photoId.toLowerCase();
  }

  const c = obj(r.card);
  const cLabel = text(c.label, 40, 'Judul kartu');
  const cOrg = text(c.org, 80, 'Perusahaan');
  const cCity = text(c.city, 80, 'Kota');
  for (const res of [cLabel, cOrg, cCity]) if (!res.ok) return res;

  const skills = list<string>(r.skills, LIMITS.skills, 'Keahlian', (x) => {
    const t = text(x, 40, 'Keahlian');
    return t;
  });
  if (!skills.ok) return skills;

  const projects = list<Project>(r.projects, LIMITS.projects, 'Proyek', (x) => {
    const p = obj(x);
    const title = text(p.title, 100, 'Judul proyek');
    const year = text(p.year, 20, 'Tahun');
    const desc = text(p.desc, 400, 'Deskripsi proyek');
    const tags = list<string>(p.tags, LIMITS.tags, 'Label proyek', (t) => text(t, 30, 'Label proyek'));
    const u = url(p.url, 'Tautan proyek');
    if (!title.ok) return title;
    if (!year.ok) return year;
    if (!desc.ok) return desc;
    if (!tags.ok) return tags;
    if (!u.ok) return u;
    return { ok: true, value: { title: title.value, year: year.value, desc: desc.value, tags: tags.value.filter(Boolean), url: u.value } };
  });
  if (!projects.ok) return projects;

  const experience = list<Experience>(r.experience, LIMITS.experience, 'Pengalaman', (x) => {
    const e = obj(x);
    const role2 = text(e.role, 100, 'Peran');
    const org = text(e.org, 100, 'Organisasi');
    const period = text(e.period, 40, 'Periode');
    const desc = text(e.desc, 400, 'Deskripsi pengalaman');
    if (!role2.ok) return role2;
    if (!org.ok) return org;
    if (!period.ok) return period;
    if (!desc.ok) return desc;
    return { ok: true, value: { role: role2.value, org: org.value, period: period.value, desc: desc.value } };
  });
  if (!experience.ok) return experience;

  const education = list<Education>(r.education, LIMITS.education, 'Pendidikan', (x) => {
    const e = obj(x);
    const school = text(e.school, 120, 'Institusi');
    const degree = text(e.degree, 120, 'Jurusan atau gelar');
    const period = text(e.period, 40, 'Periode');
    const desc = text(e.desc, 300, 'Deskripsi pendidikan');
    if (!school.ok) return school;
    if (!degree.ok) return degree;
    if (!period.ok) return period;
    if (!desc.ok) return desc;
    return { ok: true, value: { school: school.value, degree: degree.value, period: period.value, desc: desc.value } };
  });
  if (!education.ok) return education;

  const ct = obj(r.contact);
  const email = text(ct.email, 120, 'Email');
  if (!email.ok) return email;
  if (email.value && !EMAIL.test(email.value)) return { ok: false, error: 'Email tidak valid.' };
  const phone = text(ct.phone, 30, 'Nomor telepon');
  if (!phone.ok) return phone;
  if (phone.value && !PHONE.test(phone.value)) return { ok: false, error: 'Nomor telepon tidak valid. Pakai angka, spasi, tanda hubung, atau awalan +.' };

  const cvIn = obj(r.cv);
  let cvStyle: CvStyle = 'ringkas';
  if (cvIn.style != null) {
    if (typeof cvIn.style !== 'string' || !(CV_STYLES as readonly string[]).includes(cvIn.style)) return { ok: false, error: 'Gaya CV tidak dikenal.' };
    cvStyle = cvIn.style as CvStyle;
  }
  const flag = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
  const links = list<Link>(ct.links, LIMITS.links, 'Tautan', (x) => {
    const l = obj(x);
    const label = text(l.label, 40, 'Nama tautan');
    const u = url(l.url, 'Alamat tautan');
    if (!label.ok) return label;
    if (!u.ok) return u;
    return { ok: true, value: { label: label.value, url: u.value } };
  });
  if (!links.ok) return links;

  return {
    ok: true,
    value: {
      template,
      theme: theme as ThemeId,
      siteTitle: siteTitle.ok && siteTitle.value ? siteTitle.value : name.value,
      name: name.value,
      status: status.ok ? status.value : '',
      role: role.ok ? role.value : '',
      tagline: tagline.ok ? tagline.value : '',
      photoId,
      card: { label: cLabel.ok ? cLabel.value : '', org: cOrg.ok ? cOrg.value : '', city: cCity.ok ? cCity.value : '' },
      about: about.ok ? about.value : '',
      skills: skills.value.filter(Boolean),
      projects: projects.value,
      experience: experience.value,
      education: education.value,
      contact: { email: email.value, phone: phone.value, links: links.value.filter((l) => l.url) },
      cv: { enabled: flag(cvIn.enabled, true), showPhoto: flag(cvIn.showPhoto, true), style: cvStyle },
    },
  };
}

// Data dari database dianggap tepercaya, tapi bentuknya dirapikan agar komponen tidak error.
export function normalizeStored(raw: unknown, fallbackName = 'Nama Kamu'): Content {
  const r = sanitizeContent(raw);
  return r.ok ? r.value : defaultContent(fallbackName);
}
