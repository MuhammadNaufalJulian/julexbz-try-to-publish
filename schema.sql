-- Setiap pernyataan dipisah baris "-- split" agar bisa dijalankan satu per satu oleh scripts/migrate.mjs

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text,
  name text,
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  constraint users_email_key unique (email)
);

-- split

create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  slug text not null,
  content jsonb not null,
  plan text not null default 'free',
  plan_expires_at timestamptz,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sites_slug_key unique (slug),
  constraint sites_user_key unique (user_id)
);

-- split

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  mime text not null,
  data text not null,
  created_at timestamptz not null default now()
);

-- split

create index if not exists photos_site_idx on photos(site_id);

-- split

create table if not exists attempts (
  id bigserial primary key,
  key text not null,
  created_at timestamptz not null default now()
);

-- split

create index if not exists attempts_key_idx on attempts(key, created_at);

-- split

create table if not exists orders (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  site_id uuid not null references sites(id) on delete cascade,
  plan text not null,
  amount integer not null check (amount >= 0),
  status text not null default 'pending',
  qr_url text,
  provider_ref text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- split

create index if not exists orders_user_idx on orders(user_id, created_at desc);

-- split

alter table orders add column if not exists voucher_code text;

-- split

alter table orders add column if not exists discount integer not null default 0;

-- split

alter table orders drop constraint if exists orders_amount_check;

-- split

alter table orders drop constraint if exists orders_amount_nonneg;

-- split

alter table orders add constraint orders_amount_nonneg check (amount >= 0);

-- split

create table if not exists vouchers (
  code text primary key,
  kind text not null,
  value integer not null,
  max_uses integer,
  used integer not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  constraint vouchers_code_fmt check (code ~ '^[A-Z0-9_-]{3,30}$'),
  constraint vouchers_kind_chk check (kind in ('percent', 'fixed', 'trial')),
  constraint vouchers_value_chk check (value > 0 and (kind <> 'percent' or value <= 100) and (kind <> 'trial' or value <= 90))
);

-- split

alter table vouchers drop constraint if exists vouchers_kind_chk;

-- split

alter table vouchers add constraint vouchers_kind_chk check (kind in ('percent', 'fixed', 'trial'));

-- split

alter table vouchers drop constraint if exists vouchers_value_chk;

-- split

alter table vouchers add constraint vouchers_value_chk check (value > 0 and (kind <> 'percent' or value <= 100) and (kind <> 'trial' or value <= 90));

-- split

-- Voucher unggulan: satu voucher yang tampil di popup beranda. Dipilih admin di /admin/voucher.
alter table vouchers add column if not exists featured boolean not null default false;

-- split

-- Program referral: tiap pengguna punya satu kode unik (REF-XXXXXX).
alter table users add column if not exists ref_code text;

-- split

create unique index if not exists users_ref_code_key on users (ref_code) where ref_code is not null;

-- split

-- Satu pembeli hanya menghasilkan satu hadiah (referred_id unik). months = bulan gratis untuk pengundang (bisa 0 bila batas tercapai).
create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references users(id) on delete cascade,
  referred_id uuid not null references users(id) on delete cascade,
  order_id text not null references orders(id) on delete cascade,
  months integer not null check (months >= 0),
  created_at timestamptz not null default now(),
  constraint referrals_referred_key unique (referred_id)
);

-- split

create index if not exists referrals_referrer_idx on referrals (referrer_id);

-- split

-- Token reset password. Yang disimpan hanya hash SHA-256, token asli cuma ada di email.
create table if not exists password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint password_resets_hash_key unique (token_hash)
);

-- split

create index if not exists password_resets_user_idx on password_resets (user_id);

-- split

-- Catatan pengingat perpanjangan yang sudah terkirim, supaya satu masa aktif tidak dikirimi pengingat yang sama dua kali.
create table if not exists renewal_reminders (
  site_id uuid not null references sites(id) on delete cascade,
  expires_at timestamptz not null,
  days_before integer not null,
  sent_at timestamptz not null default now(),
  primary key (site_id, expires_at, days_before)
);
