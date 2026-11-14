'use client';

import { useState } from 'react';

// Membagikan tautan kartu (/kartu di alamat situs ini). Memakai menu bagikan bawaan HP jika ada, kalau tidak menyalin tautan.
export default function ShareButton({ name, path = '/kartu', label = 'Bagikan kartu', className = 'btn lg' }: { name: string; path?: string; label?: string; className?: string }) {
  const [msg, setMsg] = useState('');

  async function share() {
    const url = new URL(path, window.location.href).href;
    const data = { title: `Kartu nama ${name}`, text: `Kartu nama digital ${name}`, url };
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share(data);
        return;
      }
    } catch (e) {
      if ((e as { name?: string } | null)?.name === 'AbortError') return; // pengguna menutup menu bagikan
    }
    try {
      await navigator.clipboard.writeText(url);
      setMsg('Tautan tersalin');
    } catch {
      setMsg(url);
    }
    setTimeout(() => setMsg(''), 3500);
  }

  return (
    <>
      <button type="button" className={className} onClick={share}>
        {label}
      </button>
      {msg ? (
        <span className="note" role="status" style={{ overflowWrap: 'anywhere' }}>
          {msg}
        </span>
      ) : null}
    </>
  );
}
