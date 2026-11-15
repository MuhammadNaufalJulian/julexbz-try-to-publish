'use client';

import { useEffect, useState } from 'react';
import type { TemplateId, ThemeId } from '@/lib/content';
import { TEMPLATES } from '@/lib/templates';
import { THEMES } from '@/lib/themes';

const DELAY_MS = 3000;

type Props = {
  href: string;
  price: string;
  was: string;
  current: TemplateId;
  theme: ThemeId;
  auto: boolean;
  onTemplate: (id: TemplateId) => void;
  onTheme: (id: ThemeId) => void;
  onAuto: (on: boolean) => void;
  onOpenChange: (open: boolean) => void;
};

export default function PromoPopup({ href, price, was, current, theme, auto, onTemplate, onTheme, onAuto, onOpenChange }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    onOpenChange(open);
  }, [open, onOpenChange]);

  // Muncul 3 detik setiap kali halaman dibuka atau di-refresh. Kalau ditutup, tidak muncul lagi sampai halaman dimuat ulang.
  useEffect(() => {
    const id = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  function close() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open]);

  if (!open) return null;
  return (
    <aside className="promo" role="dialog" aria-labelledby="promo-t" aria-describedby="promo-d">
      <button type="button" className="promo-x" aria-label="Tutup" onClick={close}>&times;</button>
      <h2 id="promo-t">Mau punya personal website seperti ini?</h2>
      <ul className="promo-tpls" aria-label="Template yang tersedia">
        {TEMPLATES.map((t) => (
          <li key={t.id}>
            <button type="button" aria-pressed={current === t.id} aria-label={`Coba template ${t.label}`} onClick={() => onTemplate(t.id)}>
              <span className="promo-tpl" style={{ background: t.preview[0], borderColor: t.preview[1] + '33' }} aria-hidden="true">
                <i style={{ background: t.preview[1], width: '62%' }} />
                <i style={{ background: t.preview[1], width: '86%', opacity: 0.45 }} />
                <i style={{ background: t.preview[2], width: '38%' }} />
              </span>
              {t.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="promo-sw" role="group" aria-label="Pilihan warna utama">
        {THEMES.map((t) => (
          <button key={t.id} type="button" style={{ background: t.swatch }} title={t.label} aria-label={`Coba warna ${t.label}`} aria-pressed={theme === t.id} onClick={() => onTheme(t.id)} />
        ))}
        <span>{TEMPLATES.length} template, 6 warna</span>
      </div>
      <p className="promo-hint">Klik template atau warna untuk mencobanya di halaman ini. Warna berlaku untuk Klasik dan Cerah.{' '}
        <button type="button" className="promo-link" aria-pressed={auto} onClick={() => onAuto(!auto)}>{auto ? 'Jeda pergantian otomatis' : 'Putar semua template'}</button>
      </p>
      <p id="promo-d">Kartu 3D, situs, dan CV dalam satu alamat namamu.julexbz.com. Terbit otomatis setelah bayar QRIS, <s className="was">{was}</s> <strong>{price}</strong>.</p>
      <div className="promo-act">
        <a className="btn primary" href={href} onClick={close}>Lihat paket</a>
        <button type="button" className="btn" onClick={close}>Nanti saja</button>
      </div>
    </aside>
  );
}
