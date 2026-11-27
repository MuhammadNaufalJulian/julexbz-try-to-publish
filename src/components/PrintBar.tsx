'use client';

import { useEffect } from 'react';
import type { CvStyle } from '@/lib/content';

export default function PrintBar({ style, auto }: { style: CvStyle; auto: boolean }) {
  // ?cetak=1 membuka dialog cetak otomatis setelah huruf selesai dimuat.
  useEffect(() => {
    if (!auto) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const ready = document.fonts?.ready ?? Promise.resolve();
    ready.then(() => {
      t = setTimeout(() => window.print(), 300);
    });
    return () => clearTimeout(t);
  }, [auto]);

  return (
    <>
      <div className="cv-bar">
        <div className="grp">
          <a className="btn" href="/">Kembali ke situs</a>
        </div>
        <div className="grp">
          <a className="btn" href="?gaya=ringkas" aria-current={style === 'ringkas' ? 'true' : undefined}>Gaya ringkas</a>
          <a className="btn" href="?gaya=modern" aria-current={style === 'modern' ? 'true' : undefined}>Gaya modern</a>
          <button type="button" className="btn primary" onClick={() => window.print()}>Unduh PDF</button>
        </div>
      </div>
      <p className="cv-hint">Di dialog cetak, pilih tujuan &quot;Simpan sebagai PDF&quot;. Aktifkan &quot;Grafik latar belakang&quot; agar warna ikut tersimpan.</p>
    </>
  );
}
