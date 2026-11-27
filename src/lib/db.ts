import { neon } from '@neondatabase/serverless';

let cached: ReturnType<typeof neon> | null = null;

function client() {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL belum diatur.');
    cached = neon(url);
  }
  return cached;
}

// Menjalankan satu query berparameter ($1, $2, ...) dan mengembalikan baris-barisnya.
export async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const rows = await client().query(text, params);
  return rows as unknown as T[];
}

// Kode error Postgres untuk pelanggaran unique constraint.
export function uniqueViolation(err: unknown): string | null {
  const e = err as { code?: string; constraint?: string } | null;
  if (e && e.code === '23505') return e.constraint ?? 'unique';
  return null;
}
