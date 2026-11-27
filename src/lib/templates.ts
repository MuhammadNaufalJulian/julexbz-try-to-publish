import type { Content, TemplateId } from './content';
import { THEMES } from './themes.ts';

// Metadata template untuk antarmuka (pemilih template) dan gambar pratinjau tautan (OG).
// Gaya visual sebenarnya ada di globals.css, di bawah [data-template="..."].
// Judul bagian dan teks tombol yang disesuaikan dengan profesi. Yang tidak diisi memakai bawaan.
export type SectionLabels = { about: string; projects: string; experience: string; education: string; contact: string; viewProjects: string };
export const DEFAULT_LABELS: SectionLabels = { about: 'Tentang', projects: 'Proyek', experience: 'Pengalaman', education: 'Pendidikan', contact: 'Kontak', viewProjects: 'Lihat proyek' };

export type TemplateGroup = 'umum' | 'playful' | 'profesi';

export type TemplateMeta = {
  id: TemplateId;
  label: string;
  desc: string;
  group: TemplateGroup;
  labels?: Partial<SectionLabels>;
  // true: warna aksen mengikuti pilihan Tema. false: template punya palet sendiri.
  accentable: boolean;
  // Warna contoh untuk kartu pratinjau di pemilih: latar, teks, aksen.
  preview: [string, string, string];
};

export const TEMPLATES: TemplateMeta[] = [
  { id: 'klasik', group: 'umum', label: 'Klasik', desc: 'Bersih dan profesional. Mengikuti mode gelap perangkat.', accentable: true, preview: ['#F3F5F9', '#10141B', '#2845F5'] },
  { id: 'cerah', group: 'umum', label: 'Cerah', desc: 'Latar putih, lega, selalu terang.', accentable: true, preview: ['#FFFFFF', '#0F172A', '#2845F5'] },
  { id: 'pop', group: 'umum', label: 'Pop', desc: 'Kuning mencolok, garis tebal, bayangan keras.', accentable: false, preview: ['#FFE14D', '#111111', '#FF3D81'] },
  { id: 'neon', group: 'umum', label: 'Neon', desc: 'Gelap pekat dengan hijau lemon dan magenta.', accentable: false, preview: ['#07080F', '#EDEFFF', '#B6FF3B'] },
  { id: 'gradasi', group: 'umum', label: 'Gradasi', desc: 'Panel hero gradasi jingga ke merah muda.', accentable: false, preview: ['#FFFFFF', '#1B1030', '#E11D74'] },
  { id: 'permen', group: 'playful', label: 'Permen', desc: 'Playful: pastel permen, serba bulat, tombol empuk.', accentable: false, preview: ['#FFF3F8', '#3A1F4D', '#FF4F9A'] },
  { id: 'stiker', group: 'playful', label: 'Stiker', desc: 'Playful: kertas krem, stiker warna-warni yang miring.', accentable: false, preview: ['#FFF6DC', '#2B1B4B', '#FF7A1A'] },
  { id: 'arcade', group: 'playful', label: 'Arcade', desc: 'Playful: gaya game retro, huruf piksel, ungu pekat.', accentable: false, preview: ['#150B33', '#F4F1FF', '#FFD400'] },
  { id: 'boba', group: 'playful', label: 'Boba', desc: 'Playful: krem susu dan cokelat teh, mutiara tapioka.', accentable: false, preview: ['#FBF1E3', '#4A2C1A', '#B5651D'] },
  { id: 'komik', group: 'playful', label: 'Komik', desc: 'Playful: halftone, garis tebal, bubble ucapan.', accentable: false, preview: ['#FFF9EC', '#111111', '#E63946'] },
  { id: 'awan', group: 'playful', label: 'Awan', desc: 'Playful: langit biru, awan, matahari jingga.', accentable: false, preview: ['#DFF3FF', '#123B5C', '#FF9F1C'] },
  { id: 'senja', group: 'umum', label: 'Senja', desc: 'Gelap hangat, langit senja ungu ke jingga.', accentable: false, preview: ['#1A1024', '#FBEFE6', '#FF8A4C'] },
  { id: 'mint', group: 'umum', label: 'Mint', desc: 'Segar: putih kehijauan, sudut lembut, hijau mint.', accentable: false, preview: ['#EFFBF6', '#0B3B2E', '#12B886'] },
  { id: 'koran', group: 'umum', label: 'Koran', desc: 'Editorial: kertas koran, huruf serif, garis ganda.', accentable: false, preview: ['#F4EFE6', '#161616', '#B3261E'] },
  { id: 'blueprint', group: 'umum', label: 'Blueprint', desc: 'Biru teknik berpetak, garis putih, huruf mono.', accentable: false, preview: ['#0B3D91', '#F2F7FF', '#FFD166'] },
  { id: 'developer', group: 'profesi', label: 'Developer', desc: 'Profesi: tampilan editor kode gelap, huruf mono.', accentable: false, preview: ['#0D1117', '#C9D1D9', '#3FB950'], labels: { projects: 'Proyek', experience: 'Pengalaman', viewProjects: 'Lihat proyek' } },
  { id: 'desainer', group: 'profesi', label: 'Desainer', desc: 'Profesi: studio kreatif, huruf besar, aksen oranye.', accentable: false, preview: ['#F7F5F0', '#141414', '#FF4D2E'], labels: { projects: 'Portofolio', viewProjects: 'Lihat portofolio' } },
  { id: 'fotografer', group: 'profesi', label: 'Fotografer', desc: 'Profesi: galeri gelap, huruf serif, aksen emas.', accentable: false, preview: ['#0B0B0C', '#EDEAE4', '#D9B26F'], labels: { projects: 'Karya', experience: 'Klien & Pameran', viewProjects: 'Lihat karya' } },
  { id: 'kesehatan', group: 'profesi', label: 'Kesehatan', desc: 'Profesi: dokter, perawat, terapis. Bersih, biru-hijau.', accentable: false, preview: ['#F2FAFB', '#0B3A40', '#0E7C86'], labels: { about: 'Profil', projects: 'Layanan', experience: 'Praktik', education: 'Pendidikan & Sertifikasi', viewProjects: 'Lihat layanan' } },
  { id: 'pengajar', group: 'profesi', label: 'Pengajar', desc: 'Profesi: guru dan dosen. Papan tulis hijau, kapur.', accentable: false, preview: ['#1E3B2F', '#F4F1E8', '#F6D55C'], labels: { projects: 'Mata Kuliah & Karya', experience: 'Pengalaman Mengajar', viewProjects: 'Lihat karya' } },
  { id: 'hukum', group: 'profesi', label: 'Hukum', desc: 'Profesi: pengacara dan konsultan. Biru tua, emas, formal.', accentable: false, preview: ['#0F1B2D', '#EEF1F6', '#C9A227'], labels: { projects: 'Bidang Praktik', education: 'Pendidikan & Lisensi', viewProjects: 'Lihat bidang praktik' } },
  { id: 'kuliner', group: 'profesi', label: 'Kuliner', desc: 'Profesi: chef, barista, pemilik usaha makanan. Gaya menu.', accentable: false, preview: ['#FFF6E8', '#2D1B10', '#D6381F'], labels: { projects: 'Menu Andalan', experience: 'Dapur Tempat Bekerja', education: 'Pendidikan & Sertifikat', viewProjects: 'Lihat menu' } },
  { id: 'musisi', group: 'profesi', label: 'Musisi', desc: 'Profesi: musisi, DJ, penyanyi. Panggung gelap, magenta.', accentable: false, preview: ['#120A24', '#F6EEFF', '#FF2E93'], labels: { projects: 'Karya & Rilisan', experience: 'Penampilan', viewProjects: 'Dengar karya' } },
];

export function templateMeta(id: TemplateId): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export function labelsFor(id: TemplateId): SectionLabels {
  return { ...DEFAULT_LABELS, ...(templateMeta(id).labels ?? {}) };
}

// Palet untuk gambar pratinjau tautan (satori tidak mengenal CSS variable, jadi nilainya ditulis langsung).
export type OgPalette = { bg: string; fg: string; muted: string; accent: string; accentFg: string };

export function ogPalette(c: Pick<Content, 'template' | 'theme'>): OgPalette {
  const swatch = THEMES.find((t) => t.id === c.theme)?.swatch ?? '#2845F5';
  switch (c.template) {
    case 'cerah':
      return { bg: '#FFFFFF', fg: '#0F172A', muted: '#5B6475', accent: swatch, accentFg: '#FFFFFF' };
    case 'pop':
      return { bg: '#FFE14D', fg: '#111111', muted: '#2B2B2B', accent: '#FF3D81', accentFg: '#111111' };
    case 'neon':
      return { bg: '#07080F', fg: '#EDEFFF', muted: '#9AA0C8', accent: '#B6FF3B', accentFg: '#07080F' };
    case 'gradasi':
      return { bg: '#FFFFFF', fg: '#1B1030', muted: '#5E5575', accent: '#E11D74', accentFg: '#FFFFFF' };
    case 'permen':
      return { bg: '#FFF3F8', fg: '#3A1F4D', muted: '#7A5C8A', accent: '#FF4F9A', accentFg: '#FFFFFF' };
    case 'stiker':
      return { bg: '#FFF6DC', fg: '#2B1B4B', muted: '#5F4B82', accent: '#FF7A1A', accentFg: '#2B1B4B' };
    case 'arcade':
      return { bg: '#150B33', fg: '#F4F1FF', muted: '#B4A9E6', accent: '#FFD400', accentFg: '#150B33' };
    case 'boba':
      return { bg: '#FBF1E3', fg: '#4A2C1A', muted: '#8A6A52', accent: '#A8571A', accentFg: '#FFFFFF' };
    case 'komik':
      return { bg: '#FFF9EC', fg: '#111111', muted: '#3B3B3B', accent: '#E63946', accentFg: '#FFFFFF' };
    case 'awan':
      return { bg: '#DFF3FF', fg: '#123B5C', muted: '#4E7391', accent: '#FF9F1C', accentFg: '#123B5C' };
    case 'senja':
      return { bg: '#1A1024', fg: '#FBEFE6', muted: '#C9B3C9', accent: '#FF8A4C', accentFg: '#1A1024' };
    case 'mint':
      return { bg: '#EFFBF6', fg: '#0B3B2E', muted: '#4C7A6B', accent: '#0F9F72', accentFg: '#FFFFFF' };
    case 'koran':
      return { bg: '#F4EFE6', fg: '#161616', muted: '#4A4A4A', accent: '#B3261E', accentFg: '#FFFFFF' };
    case 'blueprint':
      return { bg: '#0B3D91', fg: '#F2F7FF', muted: '#B4CBF2', accent: '#FFD166', accentFg: '#0B3D91' };
    case 'developer':
      return { bg: '#0D1117', fg: '#C9D1D9', muted: '#8B949E', accent: '#3FB950', accentFg: '#0D1117' };
    case 'desainer':
      return { bg: '#F7F5F0', fg: '#141414', muted: '#555555', accent: '#FF4D2E', accentFg: '#FFFFFF' };
    case 'fotografer':
      return { bg: '#0B0B0C', fg: '#EDEAE4', muted: '#A39E94', accent: '#D9B26F', accentFg: '#0B0B0C' };
    case 'kesehatan':
      return { bg: '#F2FAFB', fg: '#0B3A40', muted: '#4D7479', accent: '#0E7C86', accentFg: '#FFFFFF' };
    case 'pengajar':
      return { bg: '#1E3B2F', fg: '#F4F1E8', muted: '#B9CBBF', accent: '#F6D55C', accentFg: '#1E3B2F' };
    case 'hukum':
      return { bg: '#0F1B2D', fg: '#EEF1F6', muted: '#A9B4C6', accent: '#C9A227', accentFg: '#0F1B2D' };
    case 'kuliner':
      return { bg: '#FFF6E8', fg: '#2D1B10', muted: '#7A5A44', accent: '#D6381F', accentFg: '#FFFFFF' };
    case 'musisi':
      return { bg: '#120A24', fg: '#F6EEFF', muted: '#BBA8DD', accent: '#FF2E93', accentFg: '#FFFFFF' };
    default:
      return { bg: '#F3F5F9', fg: '#10141B', muted: '#586175', accent: swatch, accentFg: '#FFFFFF' };
  }
}

// Atribut untuk elemen pembungkus .site. Tema (aksen) hanya dipasang pada template yang mengizinkannya.
export function siteAttrs(c: Pick<Content, 'template' | 'theme'>): { 'data-template': TemplateId; 'data-theme'?: Content['theme'] } {
  return templateMeta(c.template).accentable ? { 'data-template': c.template, 'data-theme': c.theme } : { 'data-template': c.template };
}
