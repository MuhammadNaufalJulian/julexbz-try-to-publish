import { ImageResponse } from 'next/og';
import { getPhoto } from '@/lib/sites';
import { getSiteForSlug, HOME_KEY } from '@/lib/home';
import { ogPalette } from '@/lib/templates';
import { OWNER_PHOTO } from '@/lib/photo';
import { OWNER_PHOTO_JPEG_BASE64 } from '@/lib/ownerPhoto';

export const dynamic = 'force-dynamic';

function initials(n: string) {
  return n.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('') || '?';
}

// Gambar pratinjau 1200x630 yang muncul saat tautan situs dibagikan di WhatsApp, Telegram, X, dan sebagainya.
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const site = await getSiteForSlug(slug);
  if (!site || !site.published) return new Response('Tidak ditemukan', { status: 404 });

  const c = site.content;
  // Beranda julexbz.com tampil bergaya neon gelap, jadi pratinjaunya ikut sama.
  const pal = ogPalette(slug === HOME_KEY ? { ...c, template: 'neon' } : c);

  // satori hanya mendukung JPEG dan PNG. Unggahan dari dashboard selalu JPEG.
  let photo: string | null = null;
  if (c.photoId === OWNER_PHOTO) {
    photo = `data:image/jpeg;base64,${OWNER_PHOTO_JPEG_BASE64}`;
  } else if (c.photoId) {
    const p = await getPhoto(c.photoId);
    if (p && (p.mime === 'image/jpeg' || p.mime === 'image/png')) photo = `data:${p.mime};base64,${p.data}`;
  }

  const nameSize = c.name.length > 26 ? 62 : c.name.length > 16 ? 78 : 96;
  const tag = (c.tagline || '').length > 120 ? `${c.tagline.slice(0, 117)}...` : c.tagline || '';
  const org = c.card.org || c.role || c.name;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: pal.bg, color: pal.fg, padding: '0 0 0 72px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', display: 'flex', right: -120, top: -140, width: 640, height: 640, borderRadius: 640, background: pal.accent, opacity: 0.16 }} />
        <div style={{ position: 'absolute', display: 'flex', left: -200, bottom: -260, width: 520, height: 520, borderRadius: 520, background: pal.accent, opacity: 0.07 }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 24, letterSpacing: 4, textTransform: 'uppercase', color: pal.accent }}>
            <div style={{ display: 'flex', width: 44, height: 6, background: pal.accent, marginRight: 16 }} />
            {c.card.label || 'Kartu Nama Digital'}
          </div>
          <div style={{ display: 'flex', fontSize: nameSize, fontWeight: 800, lineHeight: 1.02, marginTop: 26 }}>{c.name}</div>
          {c.role ? <div style={{ display: 'flex', fontSize: 38, fontWeight: 700, marginTop: 22, color: pal.accent }}>{c.role}</div> : null}
          {tag ? <div style={{ display: 'flex', fontSize: 27, lineHeight: 1.35, marginTop: 18, color: pal.muted }}>{tag}</div> : null}
        </div>
        <div style={{ position: 'absolute', display: 'flex', right: 96, top: 0, width: 22, height: 150, background: pal.accent, opacity: 0.55 }} />
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', right: 56, top: 140, width: 340, height: 470, borderRadius: 28, background: pal.fg, padding: 14, transform: 'rotate(5deg)', boxShadow: `0 0 70px ${pal.accent}66` }}>
          <div style={{ display: 'flex', alignSelf: 'center', width: 70, height: 12, borderRadius: 12, background: pal.bg, marginBottom: 12 }} />
          <div style={{ display: 'flex', width: 312, height: 340, borderRadius: 18, overflow: 'hidden', background: pal.accent }}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} width={312} height={340} style={{ objectFit: 'cover' }} alt="" />
            ) : (
              <div style={{ display: 'flex', width: 312, height: 340, alignItems: 'center', justifyContent: 'center', fontSize: 120, fontWeight: 800, color: pal.accentFg }}>{initials(c.name)}</div>
            )}
          </div>
          <div style={{ display: 'flex', fontSize: 24, fontWeight: 800, marginTop: 12, color: pal.bg }}>{org.length > 24 ? `${org.slice(0, 22)}..` : org}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } },
  );
}
