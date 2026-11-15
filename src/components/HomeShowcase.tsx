'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Content, TemplateId, ThemeId } from '@/lib/content';
import { TEMPLATES, templateMeta } from '@/lib/templates';
import { THEMES } from '@/lib/themes';
import SiteView from './SiteView';
import PromoPopup from './PromoPopup';

const STEP_MS = 1000;

// Beranda julexbz.com: situs pemilik yang berganti template tiap 1 detik supaya pengunjung melihat semua tampilan.
// Klik template atau warna di popup menghentikan pergantian dan memakai pilihan itu di halaman ini (hanya di layar pengunjung, tidak disimpan).
export default function HomeShowcase({ content, rootUrl, href, price, was }: { content: Content; rootUrl: string; href: string; price: string; was: string }) {
  const [tpl, setTpl] = useState<TemplateId>(content.template);
  const [theme, setTheme] = useState<ThemeId>(content.theme);
  const [auto, setAuto] = useState(true);
  const [popupOpen, setPopupOpen] = useState(false);

  // Pengguna yang meminta gerakan dikurangi tidak diberi pergantian otomatis.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) setAuto(false);
  }, []);

  useEffect(() => {
    if (!auto) return;
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      setTpl((cur) => {
        const i = TEMPLATES.findIndex((t) => t.id === cur);
        const next = TEMPLATES[(i + 1) % TEMPLATES.length];
        // Tiap kali tiba di template beraksen (Klasik, Cerah), warnanya ikut berganti.
        if (next.accentable) setTheme(THEMES[n % THEMES.length].id);
        return next.id;
      });
    }, STEP_MS);
    return () => clearInterval(id);
  }, [auto]);

  const shown = useMemo<Content>(() => ({ ...content, template: tpl, theme }), [content, tpl, theme]);

  function pickTemplate(id: TemplateId) {
    setAuto(false);
    setTpl(id);
  }
  function pickTheme(id: ThemeId) {
    setAuto(false);
    setTheme(id);
    // Warna hanya terlihat di template beraksen. Dari template berpalet tetap, pindah ke Klasik.
    if (!templateMeta(tpl).accentable) setTpl('klasik');
  }

  return (
    <>
      {/* plan "pro" menyembunyikan tanda "Dibuat dengan julexbz.com": ini situs milik julexbz sendiri */}
      <SiteView content={shown} plan="pro" rootUrl={rootUrl} />
      {/* Popup dan tombol jeda memakai tampilan tetap supaya tidak ikut berganti tiap detik. */}
      <div className="site promo-host" data-template="cerah" data-theme="cobalt">
        <PromoPopup
          href={href}
          price={price}
          was={was}
          current={tpl}
          theme={theme}
          auto={auto}
          onTemplate={pickTemplate}
          onTheme={pickTheme}
          onAuto={setAuto}
          onOpenChange={setPopupOpen}
        />
        {!popupOpen ? (
          <button type="button" className="show-pill" aria-pressed={auto} onClick={() => setAuto((a) => !a)}>
            {auto ? `Jeda tampilan · ${templateMeta(tpl).label}` : 'Putar semua template'}
          </button>
        ) : null}
      </div>
    </>
  );
}
