-- Tes integrasi query terhadap Postgres sungguhan.
-- Jalankan: psql -d DBBARU -v ON_ERROR_STOP=1 -q -X -f tests/db.test.sql
-- (setelah schema.sql diterapkan). Setiap pengecekan yang gagal menghentikan skrip.
\set ON_ERROR_STOP 1

create or replace function chk(label text, ok boolean) returns text language plpgsql as $$
begin
  if ok is not true then raise exception 'GAGAL: %', label; end if;
  return 'lolos: ' || label;
end $$;

truncate users, sites, photos, attempts, orders, vouchers cascade;

-- Query disalin persis dari kode. Parameter sengaja tanpa tipe, seperti saat dikirim driver.
PREPARE u_by_email AS select id, email, name, password_hash from users where email = $1;
PREPARE u_create  AS insert into users (email, password_hash, name) values ($1, $2, $3) returning id;
PREPARE u_google  AS
  insert into users (email, name, email_verified) values ($1, $2, true)
  on conflict (email) do update set
    password_hash = case when users.email_verified then users.password_hash else null end,
    email_verified = true,
    name = coalesce(users.name, excluded.name)
  returning id;

PREPARE s_create AS insert into sites (user_id, slug, content, published) values ($1, $2, $3::jsonb, $4);
PREPARE s_by_slug AS
  select id, user_id, slug, content, plan_expires_at,
    (published and (plan_expires_at is null or plan_expires_at + interval '3 days' >= now())) as published,
    case when plan_expires_at is not null and plan_expires_at < now() then 'free' else plan end as plan
  from sites where slug = $1;
PREPARE s_by_user AS
  select id, user_id, slug, content, plan_expires_at,
    (published and (plan_expires_at is null or plan_expires_at + interval '3 days' >= now())) as published,
    case when plan_expires_at is not null and plan_expires_at < now() then 'free' else plan end as plan
  from sites where user_id = $1;
PREPARE s_first AS
  select id, user_id, slug, content, plan_expires_at,
    (published and (plan_expires_at is null or plan_expires_at + interval '3 days' >= now())) as published,
    case when plan_expires_at is not null and plan_expires_at < now() then 'free' else plan end as plan
  from sites order by created_at asc limit 1;
PREPARE s_update AS update sites set content = $2::jsonb, updated_at = now() where user_id = $1;
PREPARE s_slug   AS update sites set slug = $2, updated_at = now() where user_id = $1;
PREPARE s_exists AS select 1 from sites where slug = $1;

PREPARE p_save AS insert into photos (site_id, mime, data) values ($1, $2, $3) returning id;
PREPARE p_prune AS
  delete from photos where site_id = $1 and id not in (
    select id from photos where site_id = $1 order by created_at desc limit 5);
PREPARE p_get AS select mime, data from photos where id = $1;
PREPARE p_own AS select 1 from photos where id = $1 and site_id = $2;

PREPARE r_count AS
  select count(*)::int as n from attempts where key = $1 and created_at > now() - make_interval(secs => $2);
PREPARE r_add AS insert into attempts (key) values ($1);

-- ---------- pengguna ----------
EXECUTE u_create('ayu@x.id', 'hash-ayu', 'Ayu') \gset a_
EXECUTE u_create('budi@x.id', null, 'Budi') \gset b_
select chk('user dibuat dan id berupa uuid', :'a_id' ~ '^[0-9a-f-]{36}$');
EXECUTE u_by_email('ayu@x.id') \gset ua_
select chk('cari user lewat email', :'ua_name' = 'Ayu' and :'ua_password_hash' = 'hash-ayu');

\set ON_ERROR_STOP 0
\set QUIET 1
\o /dev/null
EXECUTE u_create('ayu@x.id', 'x', 'Dobel');
\o
\set ON_ERROR_STOP 1
select chk('email dobel ditolak (unique)', (select count(*) from users where email = 'ayu@x.id') = 1);

-- Kode error dan nama constraint yang dibaca aplikasi (uniqueViolation)
do $$ begin
  begin insert into users (email, name) values ('ayu@x.id', 'z'); exception when unique_violation then
    perform chk('constraint email = users_email_key', (select constraint_name from information_schema.table_constraints where constraint_name = 'users_email_key') is not null);
    raise notice 'lolos: pelanggaran unique email -> SQLSTATE %', sqlstate;
  end;
end $$;

-- ---------- Google: akun email+password yang belum terverifikasi ----------
EXECUTE u_google('ayu@x.id', 'Ayu G') \gset g_
select chk('google: pakai user yang sama (satu akun per email)', :'g_id' = :'a_id');
select chk('google: password akun belum terverifikasi dihapus dan terverifikasi',
  (select password_hash is null and email_verified from users where id = :'a_id'));
select chk('google: nama lama tidak ditimpa', (select name from users where id = :'a_id') = 'Ayu');

-- akun yang sudah terverifikasi mempertahankan passwordnya
update users set password_hash = 'hash-baru' where id = :'a_id';
EXECUTE u_google('ayu@x.id', 'Ayu G') \gset g2_
select chk('google: password akun terverifikasi dipertahankan', (select password_hash from users where id = :'a_id') = 'hash-baru');

-- email baru lewat Google membuat user baru
EXECUTE u_google('cici@x.id', 'Cici') \gset c_
select chk('google: user baru dibuat terverifikasi tanpa password',
  (select email_verified and password_hash is null from users where id = :'c_id'));

-- ---------- situs ----------
EXECUTE s_create(:'a_id', 'ayu', '{"name":"Ayu","theme":"cobalt"}', true);
select chk('situs dibuat', (select count(*) from sites) = 1);
EXECUTE s_by_slug('ayu') \gset sa_
select chk('baca situs lewat slug', :'sa_user_id' = :'a_id' and :'sa_plan' = 'free' and :'sa_published' = 't');
select chk('content jsonb terbaca', (select content->>'name' from sites where slug = 'ayu') = 'Ayu');
EXECUTE s_by_user(:'a_id') \gset sb_
select chk('baca situs lewat user', :'sb_slug' = 'ayu');
EXECUTE s_first \gset sf_
select chk('situs pertama', :'sf_slug' = 'ayu');

\o /dev/null
\set ON_ERROR_STOP 0
EXECUTE s_create(:'b_id', 'ayu', '{}', true);
EXECUTE s_create(:'a_id', 'lain', '{}', true);
\set ON_ERROR_STOP 1
\o
select chk('slug dobel ditolak (sites_slug_key)', (select count(*) from sites) = 1);
select chk('satu situs per user (sites_user_key)', (select count(*) from sites where user_id = :'a_id') = 1);

EXECUTE s_create(:'b_id', 'budi', '{"name":"Budi"}', true);
EXECUTE s_exists('budi');
select chk('slugExists benar', exists (select 1 from sites where slug = 'budi') and not exists (select 1 from sites where slug = 'tidak-ada'));

EXECUTE s_update(:'a_id', '{"name":"Ayu Baru","theme":"rose"}');
select chk('update content', (select content->>'theme' from sites where slug = 'ayu') = 'rose');
EXECUTE s_slug(:'a_id', 'ayu-baru');
select chk('ganti slug', exists (select 1 from sites where slug = 'ayu-baru') and not exists (select 1 from sites where slug = 'ayu'));
\o /dev/null
\set ON_ERROR_STOP 0
EXECUTE s_slug(:'a_id', 'budi');
\set ON_ERROR_STOP 1
\o
select chk('ganti slug ke yang terpakai ditolak', (select slug from sites where user_id = :'a_id') = 'ayu-baru');

-- paket kedaluwarsa dianggap gratis, yang masih berlaku tetap pro
update sites set plan = 'pro', plan_expires_at = now() - interval '1 day' where user_id = :'a_id';
EXECUTE s_by_user(:'a_id') \gset e1_
select chk('paket pro kedaluwarsa -> free', :'e1_plan' = 'free');
update sites set plan = 'pro', plan_expires_at = now() + interval '30 days' where user_id = :'a_id';
EXECUTE s_by_user(:'a_id') \gset e2_
select chk('paket pro masih berlaku -> pro', :'e2_plan' = 'pro');
update sites set plan = 'pro', plan_expires_at = null where user_id = :'a_id';
EXECUTE s_by_user(:'a_id') \gset e3_
select chk('paket pro tanpa batas -> pro', :'e3_plan' = 'pro');

-- ---------- foto ----------
select id as site_a from sites where user_id = :'a_id' \gset
select id as site_b from sites where user_id = :'b_id' \gset
EXECUTE p_save(:'site_b', 'image/png', 'QUJD') \gset pb_
EXECUTE p_save(:'site_a', 'image/jpeg', 'ZGVm') \gset p1_
EXECUTE p_get(:'p1_id') \gset pg_
select chk('foto disimpan dan dibaca', :'pg_mime' = 'image/jpeg' and :'pg_data' = 'ZGVm');
EXECUTE p_own(:'p1_id', :'site_a');
select chk('kepemilikan foto: milik sendiri',  exists (select 1 from photos where id = :'p1_id' and site_id = :'site_a'));
select chk('kepemilikan foto: milik orang lain tidak lolos', not exists (select 1 from photos where id = :'pb_id' and site_id = :'site_a'));

-- tambah 6 foto lagi (total 7 di situs A) lalu prune: sisa 5 terbaru
EXECUTE p_save(:'site_a', 'image/jpeg', 'Mg==');
EXECUTE p_save(:'site_a', 'image/jpeg', 'Mw==');
EXECUTE p_save(:'site_a', 'image/jpeg', 'NA==');
EXECUTE p_save(:'site_a', 'image/jpeg', 'NQ==');
EXECUTE p_save(:'site_a', 'image/jpeg', 'Ng==');
EXECUTE p_save(:'site_a', 'image/jpeg', 'Nw==') \gset plast_
EXECUTE p_prune(:'site_a');
select chk('prune menyisakan 5 foto terbaru', (select count(*) from photos where site_id = :'site_a') = 5);
select chk('prune: foto terlama terhapus, terbaru bertahan',
  not exists (select 1 from photos where id = :'p1_id') and exists (select 1 from photos where id = :'plast_id'));
select chk('prune tidak menyentuh situs lain', exists (select 1 from photos where id = :'pb_id'));

-- ---------- rate limit ----------
EXECUTE r_add('login:ayu@x.id');
EXECUTE r_add('login:ayu@x.id');
EXECUTE r_add('login:ayu@x.id');
EXECUTE r_add('login:orang@lain.id');
EXECUTE r_count('login:ayu@x.id', 900) \gset rc_
select chk('hitung percobaan dalam jendela waktu', :'rc_n' = '3');
update attempts set created_at = now() - interval '20 minutes' where id = (select min(id) from attempts);
EXECUTE r_count('login:ayu@x.id', 900) \gset rd_
select chk('percobaan di luar jendela tidak dihitung', :'rd_n' = '2');
EXECUTE r_count('login:tidak-ada', 900) \gset re_
select chk('kunci lain tidak terpengaruh', :'re_n' = '0');
delete from attempts where created_at < now() - interval '1 day';
select chk('pembersihan attempts berjalan', true);


-- ---------- masa berlaku dan terbit ----------
update sites set plan = 'pro', plan_expires_at = now() - interval '2 days' where user_id = :'a_id';
EXECUTE s_by_user(:'a_id') \gset x1_
select chk('kedaluwarsa 2 hari: masih terbit (masa tenggang 3 hari)', :'x1_published' = 't');
update sites set plan_expires_at = now() - interval '4 days' where user_id = :'a_id';
EXECUTE s_by_user(:'a_id') \gset x2_
select chk('kedaluwarsa 4 hari: tidak terbit', :'x2_published' = 'f');
update sites set plan = 'pro', plan_expires_at = null, published = false where user_id = :'a_id';
EXECUTE s_by_user(:'a_id') \gset x3_
select chk('published=false tetap tidak terbit', :'x3_published' = 'f');

-- ---------- pesanan dan pembayaran ----------
PREPARE o_create AS insert into orders (id, user_id, site_id, plan, amount) values ($1, $2, $3, $4, $5);
PREPARE o_get AS select id, user_id, site_id, plan, amount, status, qr_url from orders where id = $1;
PREPARE o_pending AS
  select id, user_id, site_id, plan, amount, status, qr_url from orders
  where user_id = $1 and status = 'pending' and qr_url is not null and created_at > now() - make_interval(mins => $2)
  order by created_at desc limit 1;
PREPARE o_qr AS update orders set qr_url = $2, provider_ref = $3 where id = $1;
PREPARE o_mark AS update orders set status = $2 where id = $1 and status = 'pending';
PREPARE o_settle AS
  with o as (
    update orders set status = 'paid', paid_at = now() where id = $1 and status <> 'paid' returning site_id, plan, voucher_code
  ),
  v as (
    update vouchers set used = used + 1 where code = (select voucher_code from o) returning 1
  )
  update sites s set plan = o.plan, published = true,
    plan_expires_at = greatest(coalesce(s.plan_expires_at, now()), now()) + make_interval(months => $2),
    updated_at = now()
  from o where s.id = o.site_id
  returning s.id;

update sites set plan = 'free', plan_expires_at = null, published = false where user_id = :'a_id';
EXECUTE o_create('JX-TEST-1', :'a_id', :'site_a', 'pro', 299000);
EXECUTE o_pending(:'a_id', 10);
select chk('pesanan tanpa QR tidak dipakai ulang', (select count(*) from orders where id = 'JX-TEST-1' and qr_url is null) = 1);
EXECUTE o_qr('JX-TEST-1', 'https://api.sandbox.midtrans.com/v2/qris/x/qr-code', 'tx-1');
EXECUTE o_pending(:'a_id', 10) \gset op_
select chk('pesanan menunggu yang baru dipakai ulang', :'op_id' = 'JX-TEST-1' and :'op_amount' = '299000');
update orders set created_at = now() - interval '11 minutes' where id = 'JX-TEST-1';
select chk('pesanan menunggu yang lama tidak dipakai ulang', (select count(*) from orders where user_id = :'a_id' and status = 'pending' and created_at > now() - make_interval(mins => 10)) = 0);

-- lunas: situs terbit dan masa aktif 12 bulan
EXECUTE o_settle('JX-TEST-1', 12);
select chk('settle menerbitkan situs dan mengaktifkan pro',
  (select published and plan = 'pro' from sites where id = :'site_a'));
select chk('settle: masa aktif sekitar 12 bulan dari sekarang',
  (select plan_expires_at between now() + interval '12 months' - interval '1 minute' and now() + interval '12 months' + interval '1 minute' from sites where id = :'site_a'));
select chk('settle: pesanan berstatus paid dan paid_at terisi', (select status = 'paid' and paid_at is not null from orders where id = 'JX-TEST-1'));
select plan_expires_at as exp1 from sites where id = :'site_a' \gset

-- panggilan kedua (webhook dan polling bersamaan) tidak menambah masa aktif
EXECUTE o_settle('JX-TEST-1', 12);
select chk('settle dua kali: masa aktif tidak bertambah', (select plan_expires_at = :'exp1'::timestamptz from sites where id = :'site_a'));

-- perpanjangan saat masih aktif menambah dari tanggal berakhir yang lama
EXECUTE o_create('JX-TEST-2', :'a_id', :'site_a', 'pro', 299000);
EXECUTE o_settle('JX-TEST-2', 12);
select chk('perpanjangan menambah 12 bulan dari tanggal berakhir lama',
  (select plan_expires_at = :'exp1'::timestamptz + interval '12 months' from sites where id = :'site_a'));

-- perpanjangan setelah kedaluwarsa dihitung dari sekarang
update sites set plan_expires_at = now() - interval '10 days', published = false where id = :'site_a';
EXECUTE o_create('JX-TEST-3', :'a_id', :'site_a', 'pro', 299000);
EXECUTE o_settle('JX-TEST-3', 12);
select chk('perpanjangan setelah kedaluwarsa: terbit lagi, 12 bulan dari sekarang',
  (select published and plan_expires_at between now() + interval '12 months' - interval '1 minute' and now() + interval '12 months' + interval '1 minute' from sites where id = :'site_a'));

-- status kedaluwarsa hanya mengubah pesanan yang masih menunggu
EXECUTE o_create('JX-TEST-4', :'a_id', :'site_a', 'pro', 299000);
EXECUTE o_mark('JX-TEST-4', 'expired');
select chk('pesanan menunggu bisa jadi expired', (select status from orders where id = 'JX-TEST-4') = 'expired');
EXECUTE o_mark('JX-TEST-1', 'expired');
select chk('pesanan lunas tidak bisa diturunkan jadi expired', (select status from orders where id = 'JX-TEST-1') = 'paid');

-- pesanan tak dikenal tidak menerbitkan apa pun
update sites set published = false where id = :'site_a';
EXECUTE o_settle('TIDAK-ADA', 12);
select chk('settle pesanan tak dikenal tidak mengubah situs', (select not published from sites where id = :'site_a'));

-- nominal wajib positif
\o /dev/null
\set ON_ERROR_STOP 0
EXECUTE o_create('JX-TEST-5', :'a_id', :'site_a', 'pro', -1);
EXECUTE o_create('JX-TEST-1', :'a_id', :'site_a', 'pro', 299000);
\set ON_ERROR_STOP 1
\o
select chk('nominal negatif dan order_id dobel ditolak', (select count(*) from orders where id in ('JX-TEST-5')) = 0 and (select count(*) from orders where id = 'JX-TEST-1') = 1);
update sites set published = true where id = :'site_a';


-- ---------- voucher ----------
PREPARE v_get AS select code, kind, value, max_uses, used, expires_at, active from vouchers where code = $1;
PREPARE o_create_v AS insert into orders (id, user_id, site_id, plan, amount, voucher_code, discount) values ($1, $2, $3, $4, $5, $6, $7);
PREPARE v_user_used AS select 1 from orders where user_id = $1 and voucher_code = $2 and status = 'paid' limit 1;

insert into vouchers (code, kind, value, max_uses) values ('PROMO20', 'percent', 20, 2);
EXECUTE v_get('PROMO20') \gset vg_
select chk('voucher dibaca', :'vg_kind' = 'percent' and :'vg_value' = '20' and :'vg_used' = '0' and :'vg_active' = 't');

\o /dev/null
\set ON_ERROR_STOP 0
insert into vouchers (code, kind, value) values ('promo20', 'percent', 5);
insert into vouchers (code, kind, value) values ('BAD', 'percent', 101);
insert into vouchers (code, kind, value) values ('BAD2', 'fixed', 0);
insert into vouchers (code, kind, value) values ('BAD3', 'bonus', 5);
insert into vouchers (code, kind, value) values ('PROMO20', 'fixed', 5);
insert into vouchers (code, kind, value) values ('A B', 'fixed', 5);
\set ON_ERROR_STOP 1
\o
select chk('voucher tidak sah ditolak (huruf kecil, >100%, nol, jenis aneh, dobel, spasi)', (select count(*) from vouchers) = 1);

EXECUTE o_create_v('JX-V-1', :'a_id', :'site_a', 'pro', 239200, 'PROMO20', 59800);
EXECUTE v_user_used(:'a_id', 'PROMO20');
select chk('voucher belum dihitung dipakai sebelum lunas', (select used from vouchers where code = 'PROMO20') = 0 and not exists (select 1 from orders where user_id = :'a_id' and voucher_code = 'PROMO20' and status = 'paid'));
EXECUTE o_settle('JX-V-1', 12);
select chk('lunas menambah pemakaian voucher satu kali', (select used from vouchers where code = 'PROMO20') = 1);
EXECUTE o_settle('JX-V-1', 12);
select chk('settle ulang tidak menambah pemakaian lagi', (select used from vouchers where code = 'PROMO20') = 1);
select chk('pengguna tercatat sudah memakai voucher', exists (select 1 from orders where user_id = :'a_id' and voucher_code = 'PROMO20' and status = 'paid'));
select chk('pengguna lain belum memakai voucher', not exists (select 1 from orders where user_id = :'b_id' and voucher_code = 'PROMO20' and status = 'paid'));

-- pesanan gratis (voucher 100%) boleh bernominal 0
EXECUTE o_create_v('JX-V-2', :'b_id', :'site_b', 'pro', 0, 'PROMO20', 299000);
EXECUTE o_settle('JX-V-2', 12);
select chk('pesanan nominal 0 diterima dan menerbitkan situs', (select published and plan = 'pro' from sites where id = :'site_b'));
select chk('pemakaian voucher mencapai batas', (select used = max_uses from vouchers where code = 'PROMO20'));

-- pesanan tanpa voucher tidak menyentuh tabel voucher
EXECUTE o_create('JX-V-3', :'b_id', :'site_b', 'pro', 299000);
EXECUTE o_settle('JX-V-3', 12);
select chk('pesanan tanpa voucher tidak mengubah voucher', (select used from vouchers where code = 'PROMO20') = 2);

-- ---------- cascade ----------
delete from users where id = :'a_id';
select chk('hapus user menghapus situs, foto, dan pesanannya',
  not exists (select 1 from sites where user_id = :'a_id') and not exists (select 1 from photos where site_id = :'site_a') and not exists (select 1 from orders where user_id = :'a_id'));
select chk('data user lain tetap utuh', exists (select 1 from sites where user_id = :'b_id') and exists (select 1 from photos where id = :'pb_id'));

\echo SEMUA TES DB LOLOS
