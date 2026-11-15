import { q } from './db';
import { normalizeStored, type Content } from './content';

export type Site = {
  id: string;
  userId: string;
  slug: string;
  plan: string;
  published: boolean;
  planExpiresAt: string | null;
  content: Content;
};

type Row = { id: string; user_id: string; slug: string; plan: string; published: boolean; plan_expires_at: Date | string | null; content: unknown };

// Paket yang sudah lewat masa berlaku dianggap kembali ke gratis. Situs berbayar yang kedaluwarsa lebih dari 3 hari
// (masa tenggang) berhenti tampil sampai diperpanjang. Situs tanpa tanggal kedaluwarsa tidak terpengaruh.
const COLS = `id, user_id, slug, content, plan_expires_at,
  (published and (plan_expires_at is null or plan_expires_at + (case when plan = 'trial' then interval '0' else interval '3 days' end) >= now())) as published,
  case when plan_expires_at is not null and plan_expires_at < now() then 'free' else plan end as plan`;

function toSite(r: Row): Site {
  return { id: r.id, userId: r.user_id, slug: r.slug, plan: r.plan, published: r.published, planExpiresAt: r.plan_expires_at ? new Date(r.plan_expires_at).toISOString() : null, content: normalizeStored(r.content) };
}

export async function getSiteBySlug(slug: string): Promise<Site | null> {
  const rows = await q<Row>(`select ${COLS} from sites where slug = $1`, [slug]);
  return rows[0] ? toSite(rows[0]) : null;
}

export async function getSiteByUserId(userId: string): Promise<Site | null> {
  const rows = await q<Row>(`select ${COLS} from sites where user_id = $1`, [userId]);
  return rows[0] ? toSite(rows[0]) : null;
}

// Situs pertama milik pengguna dengan email tertentu (dipakai untuk menemukan situs pemilik di beranda).
export async function getSiteByOwnerEmails(emails: string[]): Promise<Site | null> {
  if (!emails.length) return null;
  const rows = await q<Row>(
    `select ${COLS} from sites where user_id in (select id from users where lower(email) = any($1::text[])) order by created_at asc limit 1`,
    [emails],
  );
  return rows[0] ? toSite(rows[0]) : null;
}

export async function getFirstSite(): Promise<Site | null> {
  const rows = await q<Row>(`select ${COLS} from sites order by created_at asc limit 1`);
  return rows[0] ? toSite(rows[0]) : null;
}

// published=false: situs baru di mode langganan baru terbit setelah dibayar.
export async function createSite(userId: string, slug: string, content: Content, published = true): Promise<void> {
  await q('insert into sites (user_id, slug, content, published) values ($1, $2, $3::jsonb, $4)', [userId, slug, JSON.stringify(content), published]);
}

export async function updateSite(userId: string, content: Content): Promise<void> {
  await q('update sites set content = $2::jsonb, updated_at = now() where user_id = $1', [userId, JSON.stringify(content)]);
}

export async function updateSlug(userId: string, slug: string): Promise<void> {
  await q('update sites set slug = $2, updated_at = now() where user_id = $1', [userId, slug]);
}

export async function slugExists(slug: string): Promise<boolean> {
  const rows = await q('select 1 from sites where slug = $1', [slug]);
  return rows.length > 0;
}

// ---- foto ----

export async function savePhoto(siteId: string, mime: string, base64: string): Promise<string> {
  const rows = await q<{ id: string }>('insert into photos (site_id, mime, data) values ($1, $2, $3) returning id', [siteId, mime, base64]);
  // Simpan hanya 5 foto terbaru per situs agar penyimpanan tidak membengkak.
  await q(
    `delete from photos where site_id = $1 and id not in (
       select id from photos where site_id = $1 order by created_at desc limit 5)`,
    [siteId],
  );
  return rows[0].id;
}

export async function getPhoto(id: string): Promise<{ mime: string; data: string } | null> {
  const rows = await q<{ mime: string; data: string }>('select mime, data from photos where id = $1', [id]);
  return rows[0] ?? null;
}

export async function photoBelongsTo(photoId: string, siteId: string): Promise<boolean> {
  const rows = await q('select 1 from photos where id = $1 and site_id = $2', [photoId, siteId]);
  return rows.length > 0;
}
