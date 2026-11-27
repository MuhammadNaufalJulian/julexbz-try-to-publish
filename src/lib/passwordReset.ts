import { createHash, randomBytes } from 'node:crypto';
import { q } from './db';

export const RESET_TTL_MINUTES = 60;

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Membuat token baru (token lama milik user dibatalkan). Mengembalikan token asli untuk dikirim lewat email.
export async function createResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  await q('delete from password_resets where user_id = $1', [userId]);
  await q(`insert into password_resets (user_id, token_hash, expires_at) values ($1, $2, now() + make_interval(mins => $3))`, [
    userId,
    hashToken(token),
    RESET_TTL_MINUTES,
  ]);
  return token;
}

export async function isResetTokenValid(token: string): Promise<boolean> {
  const rows = await q(`select 1 from password_resets where token_hash = $1 and used_at is null and expires_at > now()`, [hashToken(token)]);
  return rows.length > 0;
}

// Satu pernyataan SQL: token hanya bisa dipakai sekali. Mengembalikan true bila password berhasil diganti.
// Membuat email dianggap terverifikasi (pemilik email terbukti menerima tautan) dan menghapus semua token user.
export async function consumeResetToken(token: string, passwordHash: string): Promise<boolean> {
  const rows = await q<{ user_id: string }>(
    `with t as (
       update password_resets set used_at = now()
       where token_hash = $1 and used_at is null and expires_at > now()
       returning user_id
     )
     update users u set password_hash = $2, email_verified = true from t where u.id = t.user_id returning u.id as user_id`,
    [hashToken(token), passwordHash],
  );
  if (!rows[0]) return false;
  await q('delete from password_resets where user_id = $1', [rows[0].user_id]);
  return true;
}
