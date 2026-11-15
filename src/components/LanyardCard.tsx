'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent } from 'react';
import { safeUrl, type Content } from '@/lib/content';
import CopyButton from './CopyButton';
import { photoSrc } from '@/lib/photo';

const K = 24; // kekakuan ayunan
const C = 1.3; // redaman
const RAD = 57.2958;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function Barcode({ seed }: { seed: string }) {
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  const s = (seed || 'ID').slice(0, 16);
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    for (let b = 0; b < 6; b++) {
      const w = 1 + ((c >> b) & 1);
      bars.push({ x, w });
      x += w + 1;
    }
  }
  return (
    <svg viewBox={`0 0 ${x} 10`} preserveAspectRatio="none" aria-hidden="true">
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={10} fill="currentColor" />
      ))}
    </svg>
  );
}

function initials(n: string) {
  return n.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('') || '?';
}

export default function LanyardCard({ c }: { c: Content }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);
  const startRef = useRef<() => void>(() => {});
  const s = useRef({ theta: 0, omega: 0, dragging: false, raf: 0, last: 0, hx: 0, hy: 0, px: 0, py: 0, grab: 0, sx: 0, sy: 0, moved: 0, lastTh: 0, lastMt: 0, reduced: false });

  const draw = useCallback(() => {
    const st = s.current;
    // Sudut dibalik: tarik ke kanan, kartu ikut ke kanan.
    if (rigRef.current) rigRef.current.style.transform = `rotate(${(-st.theta).toFixed(2)}deg)`;
    if (tiltRef.current) {
      const ty = clamp(st.omega * 0.07, -18, 18) + st.hy;
      tiltRef.current.style.transform = `rotateX(${st.hx.toFixed(2)}deg) rotateY(${ty.toFixed(2)}deg)`;
    }
  }, []);

  useEffect(() => {
    const st = s.current;
    st.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick = (t: number) => {
      st.raf = 0;
      const dt = Math.min((t - st.last) / 1000, 0.033);
      st.last = t;
      if (!st.dragging) {
        const a = -K * Math.sin((st.theta * Math.PI) / 180) * RAD - C * st.omega;
        st.omega += a * dt;
        st.theta += st.omega * dt;
        if (Math.abs(st.theta) < 0.12 && Math.abs(st.omega) < 3) {
          st.theta = 0;
          st.omega = 0;
          draw();
          return;
        }
      }
      draw();
      st.raf = requestAnimationFrame(tick);
    };
    startRef.current = () => {
      if (!st.raf) {
        st.last = performance.now();
        st.raf = requestAnimationFrame(tick);
      }
    };
    if (!st.reduced) {
      st.theta = 14;
      startRef.current();
    }
    draw();
    return () => {
      if (st.raf) cancelAnimationFrame(st.raf);
      st.raf = 0;
    };
  }, [draw]);

  const ang = (e: RPointerEvent) => Math.atan2(e.clientX - s.current.px, Math.max(e.clientY - s.current.py, 60)) * RAD;

  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    const st = s.current;
    if (e.button > 0 || (e.target as HTMLElement).closest('a,button,input')) return;
    const r = stageRef.current!.getBoundingClientRect();
    st.px = r.left + r.width / 2;
    st.py = r.top + 6;
    st.dragging = true;
    st.moved = 0;
    st.sx = e.clientX;
    st.sy = e.clientY;
    st.grab = ang(e) - st.theta;
    st.omega = 0;
    st.lastTh = st.theta;
    st.lastMt = performance.now();
    stageRef.current?.classList.add('drag');
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const st = s.current;
    if (st.dragging) {
      st.moved = Math.max(st.moved, Math.abs(e.clientX - st.sx) + Math.abs(e.clientY - st.sy));
      if (st.moved < 6) return;
      const th = clamp(ang(e) - st.grab, -55, 55);
      const now = performance.now();
      const dt = (now - st.lastMt) / 1000;
      if (dt > 0) st.omega = st.omega * 0.6 + ((th - st.lastTh) / dt) * 0.4;
      st.lastTh = th;
      st.lastMt = now;
      st.theta = th;
      draw();
    } else if (e.pointerType === 'mouse') {
      const r = e.currentTarget.getBoundingClientRect();
      st.hy = clamp(((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * 8, -8, 8);
      st.hx = clamp(-((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * 6, -6, 6);
      if (!st.raf) draw();
    }
  };

  const onEnd = (e: RPointerEvent<HTMLDivElement>, cancel: boolean) => {
    const st = s.current;
    if (!st.dragging) return;
    st.dragging = false;
    stageRef.current?.classList.remove('drag');
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (!cancel && st.moved < 6) {
      setFlipped((f) => !f);
      st.omega = 0;
    }
    if (st.reduced) {
      st.theta = 0;
      st.omega = 0;
      draw();
    } else {
      startRef.current();
    }
  };

  const onLeave = () => {
    const st = s.current;
    st.hx = 0;
    st.hy = 0;
    if (!st.raf) draw();
  };

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setFlipped((f) => !f);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (!s.current.reduced) {
        s.current.omega += (e.key === 'ArrowLeft' ? -1 : 1) * 140;
        startRef.current();
      }
    }
  };

  const links = c.contact.links.map((l) => ({ label: l.label, href: safeUrl(l.url) })).filter((l): l is { label: string; href: string } => !!l.href);
  const place = [c.card.org, c.card.city].filter(Boolean).join(' · ');
  const strapText = `${(c.name || 'NAMA KAMU').toUpperCase()}  ·  `.repeat(4);

  return (
    <div className="stagecol">
      <div className="stage" ref={stageRef}>
        <span className="mount" aria-hidden="true" />
        <div className="rig" ref={rigRef}>
          <div className="strap" aria-hidden="true">
            <span>{strapText}</span>
          </div>
          <div className="clip" aria-hidden="true" />
          <div
            className="cardwrap"
            tabIndex={0}
            role="group"
            aria-label="Kartu nama digital. Tekan Enter untuk membalik, panah kiri atau kanan untuk mengayun."
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={(e) => onEnd(e, false)}
            onPointerCancel={(e) => onEnd(e, true)}
            onPointerLeave={onLeave}
            onKeyDown={onKey}
          >
            <div className="tilt" ref={tiltRef}>
              <div className="card3d" style={{ transform: `rotateY(${flipped ? 180 : 0}deg)` }}>
                <div className="face front" inert={flipped} aria-hidden={flipped}>
                  <span className="slot" aria-hidden="true" />
                  <div className="cl">
                    <span>{c.card.label}</span>
                  </div>
                  <div className="cphoto">
                    {c.photoId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoSrc(c.photoId)} alt={`Foto ${c.name}`} draggable={false} />
                    ) : (
                      <div className="initials" aria-hidden="true">
                        {initials(c.name)}
                      </div>
                    )}
                  </div>
                  <p className="cname">{c.name}</p>
                  {c.role ? <p className="crole">{c.role}</p> : null}
                  {place ? <p className="corg">{place}</p> : null}
                  <div className="bar">
                    <Barcode seed={c.name} />
                  </div>
                </div>
                <div className="face back" inert={!flipped} aria-hidden={!flipped}>
                  <span className="slot" aria-hidden="true" />
                  <div className="cl">
                    <span>Kontak</span>
                    <span>{c.card.label}</span>
                  </div>
                  <h3>{c.name}</h3>
                  {c.contact.email ? (
                    <div className="bmail">
                      <code>{c.contact.email}</code>
                      <CopyButton text={c.contact.email} />
                    </div>
                  ) : null}
                  {c.contact.phone ? <p className="bphone">{c.contact.phone}</p> : null}
                  {links.length ? (
                    <ul className="blinks">
                      {links.slice(0, 4).map((l, i) => (
                        <li key={i}>
                          <a href={l.href} target="_blank" rel="noopener noreferrer">
                            <span>{l.label || l.href}</span>
                            <span aria-hidden="true">{'↗'}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {c.skills.length ? (
                    <ul className="bskills">
                      {c.skills.slice(0, 6).map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="bar">
                    <Barcode seed={c.contact.email || c.name} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <span className="pivot" aria-hidden="true" />
      </div>
      <button type="button" className="btn" onClick={() => setFlipped((f) => !f)}>
        {flipped ? 'Lihat sisi depan' : 'Balik kartu'}
      </button>
    </div>
  );
}
