import { q } from './db';

// Pembatas sederhana berbasis tabel attempts. Cukup untuk menahan tebak password dan pendaftaran massal.
export async function isLimited(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const rows = await q<{ n: number }>(
    `select count(*)::int as n from attempts where key = $1 and created_at > now() - make_interval(secs => $2)`,
    [key, windowSeconds],
  );
  return (rows[0]?.n ?? 0) >= max;
}

export async function recordAttempt(key: string): Promise<void> {
  await q('insert into attempts (key) values ($1)', [key]);
  // Bersih-bersih sesekali agar tabel tidak menumpuk.
  if (Math.random() < 0.02) await q(`delete from attempts where created_at < now() - interval '1 day'`);
}
