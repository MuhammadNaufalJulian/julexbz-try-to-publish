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
  constraint vouchers_kind_chk check (kind in ('percent', 'fixed')),
  constraint vouchers_value_chk check (value > 0 and (kind <> 'percent' or value <= 100))
);
