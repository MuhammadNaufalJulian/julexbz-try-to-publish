'use client';

import { useState } from 'react';

export default function CopyButton({ text }: { text: string }) {
  const [label, setLabel] = useState('Salin');

  async function copy(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setLabel('Tersalin');
    } catch {
      setLabel('Salin manual');
    }
    setTimeout(() => setLabel('Salin'), 2000);
  }

  return (
    <button type="button" className="btn sm" onClick={copy}>
      {label}
    </button>
  );
}
