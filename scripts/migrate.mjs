// Menjalankan schema.sql ke database. Pakai: npm run migrate
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL belum diatur. Isi di .env lalu jalankan: node --env-file=.env scripts/migrate.mjs');
  process.exit(1);
}

const dir = dirname(fileURLToPath(import.meta.url));
const sql = neon(url);
const statements = readFileSync(join(dir, '..', 'schema.sql'), 'utf8')
  .split(/^-- split\s*$/m)
  .map((s) => s.replace(/^--.*$/gm, '').trim())
  .filter(Boolean);

for (const stmt of statements) {
  await sql.query(stmt);
}
console.log(`Selesai: ${statements.length} pernyataan dijalankan.`);
