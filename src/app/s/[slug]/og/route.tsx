import { ImageResponse } from 'next/og';
import { getPhoto } from '@/lib/sites';
import { getSiteForSlug } from '@/lib/home';
import { ogPalette } from '@/lib/templates';

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
  const pal = ogPalette(c);

  // satori hanya mendukung JPEG dan PNG. Unggahan dari dashboard selalu JPEG.
  let photo: string | null = null;
  if (c.photoId) {
    const p = await getPhoto(c.photoId);
    if (p && (p.mime === 'image/jpeg' || p.mime === 'image/png')) photo = `data:${p.mime};base64,${p.data}`;
  }

  const nameSize = c.name.length > 26 ? 60 : c.name.length > 16 ? 76 : 92;
  const sub = [c.card.org, c.card.city].filter(Boolean).join(' · ');

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: pal.bg, color: pal.fg, padding: '60px 72px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 690 }}>
          <div style={{ display: 'flex', fontSize: 26, letterSpacing: 4, textTransform: 'uppercase', color: pal.muted }}>{c.card.label || 'Kartu Nama Digital'}</div>
          <div style={{ display: 'flex', width: 96, height: 10, background: pal.accent, marginTop: 28 }} />
          <div style={{ display: 'flex', fontSize: nameSize, fontWeight: 700, lineHeight: 1.05, marginTop: 28 }}>{c.name}</div>
          {c.role ? <div style={{ display: 'flex', fontSize: 36, marginTop: 20, color: pal.muted }}>{c.role}</div> : null}
          {sub ? <div style={{ display: 'flex', fontSize: 28, marginTop: 12, color: pal.muted }}>{sub}</div> : null}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', width: 360, height: 480, borderRadius: 28, background: pal.accent, padding: 16 }}>
          <div style={{ display: 'flex', width: 328, height: 396, borderRadius: 18, overflow: 'hidden', background: pal.bg }}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} width={328} height={396} style={{ objectFit: 'cover' }} alt="" />
            ) : (
              <div style={{ display: 'flex', width: 328, height: 396, alignItems: 'center', justifyContent: 'center', fontSize: 120, fontWeight: 700, color: pal.fg }}>{initials(c.name)}</div>
            )}
          </div>
          <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, marginTop: 14, color: pal.accentFg }}>{c.card.org || c.role || c.name}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } },
  );
}
