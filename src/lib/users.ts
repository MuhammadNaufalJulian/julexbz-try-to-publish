import { q } from './db';

export type User = { id: string; email: string; name: string | null; passwordHash: string | null };

type Row = { id: string; email: string; name: string | null; password_hash: string | null };

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await q<Row>('select id, email, name, password_hash from users where email = $1', [email.toLowerCase()]);
  const r = rows[0];
  return r ? { id: r.id, email: r.email, name: r.name, passwordHash: r.password_hash } : null;
}

export async function countUsers(): Promise<number> {
  const rows = await q<{ n: number }>('select count(*)::int as n from users');
  return rows[0]?.n ?? 0;
}

export async function createUser(email: string, passwordHash: string, name: string): Promise<string> {
  const rows = await q<{ id: string }>('insert into users (email, password_hash, name) values ($1, $2, $3) returning id', [
    email.toLowerCase(),
    passwordHash,
    name,
  ]);
  return rows[0].id;
}

// Login Google: email sudah diverifikasi Google. Jika akun email+password dengan email yang sama
// belum terverifikasi, passwordnya dihapus supaya orang yang mendaftar duluan dengan email orang lain
// tidak bisa ikut masuk ke akun ini.
export async function upsertGoogleUser(email: string, name: string | null): Promise<string> {
  const rows = await q<{ id: string }>(
    `insert into users (email, name, email_verified) values ($1, $2, true)
     on conflict (email) do update set
       password_hash = case when users.email_verified then users.password_hash else null end,
       email_verified = true,
       name = coalesce(users.name, excluded.name)
     returning id`,
    [email.toLowerCase(), name],
  );
  return rows[0].id;
}
