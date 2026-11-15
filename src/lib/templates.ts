import type { Content, TemplateId } from './content';
import { THEMES } from './themes.ts';

// Metadata template untuk antarmuka (pemilih template) dan gambar pratinjau tautan (OG).
// Gaya visual sebenarnya ada di globals.css, di bawah [data-template="..."].
export type TemplateMeta = {
  id: TemplateId;
  label: string;
  desc: string;
  // true: warna aksen mengikuti pilihan Tema. false: template punya palet sendiri.
  accentable: boolean;
  // Warna contoh untuk kartu pratinjau di pemilih: latar, teks, aksen.
  preview: [string, string, string];
};

export const TEMPLATES: TemplateMeta[] = [
  { id: 'klasik', label: 'Klasik', desc: 'Bersih dan profesional. Mengikuti mode gelap perangkat.', accentable: true, preview: ['#F3F5F9', '#10141B', '#2845F5'] },
  { id: 'cerah', label: 'Cerah', desc: 'Latar putih, lega, selalu terang.', accentable: true, preview: ['#FFFFFF', '#0F172A', '#2845F5'] },
  { id: 'pop', label: 'Pop', desc: 'Kuning mencolok, garis tebal, bayangan keras.', accentable: false, preview: ['#FFE14D', '#111111', '#FF3D81'] },
  { id: 'neon', label: 'Neon', desc: 'Gelap pekat dengan hijau lemon dan magenta.', accentable: false, preview: ['#07080F', '#EDEFFF', '#B6FF3B'] },
  { id: 'gradasi', label: 'Gradasi', desc: 'Panel hero gradasi jingga ke merah muda.', accentable: false, preview: ['#FFFFFF', '#1B1030', '#E11D74'] },
  { id: 'permen', label: 'Permen', desc: 'Playful: pastel permen, serba bulat, tombol empuk.', accentable: false, preview: ['#FFF3F8', '#3A1F4D', '#FF4F9A'] },
  { id: 'stiker', label: 'Stiker', desc: 'Playful: kertas krem, stiker warna-warni yang miring.', accentable: false, preview: ['#FFF6DC', '#2B1B4B', '#FF7A1A'] },
  { id: 'arcade', label: 'Arcade', desc: 'Playful: gaya game retro, huruf piksel, ungu pekat.', accentable: false, preview: ['#150B33', '#F4F1FF', '#FFD400'] },
  { id: 'boba', label: 'Boba', desc: 'Playful: krem susu dan cokelat teh, mutiara tapioka.', accentable: false, preview: ['#FBF1E3', '#4A2C1A', '#B5651D'] },
  { id: 'komik', label: 'Komik', desc: 'Playful: halftone, garis tebal, bubble ucapan.', accentable: false, preview: ['#FFF9EC', '#111111', '#E63946'] },
  { id: 'awan', label: 'Awan', desc: 'Playful: langit biru, awan, matahari jingga.', accentable: false, preview: ['#DFF3FF', '#123B5C', '#FF9F1C'] },
];

export function templateMeta(id: TemplateId): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
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
    default:
      return { bg: '#F3F5F9', fg: '#10141B', muted: '#586175', accent: swatch, accentFg: '#FFFFFF' };
  }
}

// Atribut untuk elemen pembungkus .site. Tema (aksen) hanya dipasang pada template yang mengizinkannya.
export function siteAttrs(c: Pick<Content, 'template' | 'theme'>): { 'data-template': TemplateId; 'data-theme'?: Content['theme'] } {
  return templateMeta(c.template).accentable ? { 'data-template': c.template, 'data-theme': c.theme } : { 'data-template': c.template };
}
