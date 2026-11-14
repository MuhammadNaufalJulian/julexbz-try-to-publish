'use client';

import { useEffect, useRef, useState } from 'react';

type Props = { brand: string; items: [string, string][] };

// Di layar lebar: daftar tautan sejajar. Di HP: nama di kiri, tombol menu di kanan yang membuka daftar tautan.
export default function NavBar({ brand, items }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  // Menu menutup dengan Esc, atau saat mengetuk di luar menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  return (
    <nav ref={ref} className="nav" data-open={open ? 'true' : 'false'} aria-label="Navigasi halaman">
      <a className="brand" href="#atas" onClick={() => setOpen(false)}>{brand}</a>
      {items.length ? (
        <button type="button" className="nav-btn" aria-expanded={open} aria-controls="nav-menu" onClick={() => setOpen((o) => !o)}>
          <span className="nav-sr">{open ? 'Tutup menu' : 'Buka menu'}</span>
          <span className="bars" aria-hidden="true" />
        </button>
      ) : null}
      <ul id="nav-menu">
        {items.map(([id, label]) => (
          <li key={id}>
            <a href={`#${id}`} onClick={() => setOpen(false)}>{label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
