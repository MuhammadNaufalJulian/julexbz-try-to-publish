# julexbz.com

Platform situs pribadi berbentuk kartu nama digital 3D (lanyard, depan dan belakang).
Satu aplikasi Next.js yang bisa jalan dalam dua mode:

- **multi**: platform langganan. Tiap pelanggan punya `nama.julexbz.com`, akun sendiri, dan dashboard sendiri.
- **single**: satu situs milik satu orang. Dipakai untuk template yang dijual sekali bayar (pembeli hosting sendiri).

Isi situs disimpan di Postgres dan diedit dari `/dashboard` (login), tanpa deploy ulang.

## Yang sudah ada

- Daftar dan login dengan email + password, serta login Google (opsional)
- Dashboard dengan pratinjau langsung, unggah foto, 6 tema warna, urutkan proyek/pengalaman/tautan
- Kartu lanyard 3D: ditarik mengikuti arah tarikan, ketuk untuk membalik, tampil rapi di HP
- Subdomain per pelanggan lewat middleware
- Pembatas percobaan login, pendaftaran, unggah foto, dan simpan
- Pembayaran QRIS lewat Midtrans: Simpan, bayar, situs terbit otomatis, plus voucher diskon (lihat bagian Pembayaran)


Beranda julexbz.com berganti template tiap 1 detik (komponen `HomeShowcase`) supaya pengunjung melihat semua tampilan. Di popup tawaran, klik template atau warna untuk menghentikan pergantian dan mencobanya; tombol "Jeda" ada di pojok kiri bawah saat popup tertutup. Pilihan pengunjung hanya berlaku di layar mereka dan tidak disimpan. Pengguna dengan pengaturan "kurangi gerakan" tidak mendapat pergantian otomatis.

Foto bawaan beranda: `public/owner.jpg` (juga ditanam di `src/lib/ownerPhoto.ts` untuk gambar pratinjau link). Dipakai di kartu lanyard, CV, dan pratinjau julexbz.com selama situs pemilik belum punya foto. Foto yang diunggah lewat dashboard otomatis menggantikannya. Untuk mengganti foto bawaan, timpa `public/owner.jpg` lalu perbarui `ownerPhoto.ts`.

## Template, CV, dan tautan kartu

- **23 template** (tab Template di dashboard, dikelompokkan): *Umum* (Klasik, Cerah, Pop, Neon, Gradasi, Senja, Mint, Koran, Blueprint), *Playful* (Permen, Stiker, Arcade, Boba, Komik, Awan), dan *Khusus profesi* (Developer, Desainer, Fotografer, Kesehatan, Pengajar, Hukum & Konsultan, Kuliner, Musisi). Template profesi punya judul bagian sendiri (misalnya Portofolio, Menu Andalan, Praktik, Penampilan) dan tombol **Isi contoh profesi ini** yang mengisi contoh profesi, perkenalan, keahlian, proyek, dan pengalaman tanpa menyentuh nama, foto, kontak, dan warna. Hanya Klasik dan Cerah yang bisa ganti warna utama; yang lain punya palet tetap.
- **Tautan kartu**: `nama.julexbz.com/kartu` menampilkan kartu 3D saja, dengan tombol Simpan kontak, Bagikan (Web Share, cadangan salin tautan) dan Lihat CV.
- **Simpan kontak**: `/kontak.vcf` (vCard 3.0) langsung masuk buku kontak HP.
- **Pratinjau tautan**: `/og` membuat gambar 1200x630 otomatis untuk WhatsApp, Telegram, dan X.
- **CV**: `/cv` (gaya `?gaya=ringkas` atau `?gaya=modern`), dibuat dari isi situs. `/cv?cetak=1` langsung membuka dialog cetak. Pilih "Simpan sebagai PDF", ukuran A4, dan aktifkan "Grafik latar belakang". Halaman CV tidak diindeks mesin pencari.
- Nomor telepon yang kamu isi bersifat publik (situs, kartu, CV, .vcf). Kosongkan jika tidak mau.
- Di mode single, `/kartu`, `/cv`, `/kontak.vcf` dan `/og` otomatis tersedia di domain utama.

## Yang belum ada

- **Faktur atau bukti bayar resmi.** Belum ada. Pembayaran tercatat di tabel `orders`.
- **Verifikasi email pendaftaran.** Tidak ada pengiriman email. Orang bisa mendaftar dengan email siapa pun. Dampaknya diredam: jika pemilik asli email itu masuk lewat Google, password yang didaftarkan orang lain dihapus. Tambahkan verifikasi email sebelum jualan serius.
- **Domain sendiri per pelanggan** (misal `budi.com`).
- **Halaman syarat layanan dan kebijakan privasi.** Wajib disiapkan sebelum menyimpan data pribadi orang lain.

## Menjalankan di lokal

Butuh Node 20+ dan database Postgres (gratis di [Neon](https://neon.tech)).

```bash
npm install
cp .env.example .env        # lalu isi DATABASE_URL dan AUTH_SECRET
node --env-file=.env scripts/migrate.mjs
npm run dev
```

Buka http://localhost:3000. Di lokal, situs pelanggan dibuka di `nama.localhost:3000`
(Chrome dan Firefox otomatis mengarahkan `*.localhost` ke komputermu).
Pastikan `.env` berisi `ROOT_DOMAIN=localhost:3000` dan `NEXT_PUBLIC_ROOT_URL=http://localhost:3000`.

Tes:

```bash
npm test                                   # validasi, slug, tema (Node, tanpa database)
psql "$DATABASE_URL_TES" -v ON_ERROR_STOP=1 -q -X -f tests/db.test.sql   # query SQL (pakai database KOSONG khusus tes, skrip ini menghapus isi tabel)
```

## Deploy ke Vercel

1. Push proyek ke GitHub, lalu **Import** di Vercel.
2. Buat database Postgres (Neon lewat Vercel Marketplace), salin `DATABASE_URL`, lalu jalankan migrasi sekali dari komputermu:
   `node --env-file=.env scripts/migrate.mjs`
3. Isi Environment Variables di Vercel (lihat `.env.example`):
   - `DATABASE_URL`
   - `AUTH_SECRET` (buat dengan `openssl rand -base64 32`)
   - `MODE=multi`
   - `ROOT_DOMAIN=julexbz.com`
   - `NEXT_PUBLIC_ROOT_URL=https://julexbz.com`
   - `AUTH_GOOGLE_ID` dan `AUTH_GOOGLE_SECRET` jika ingin login Google
   - `MIDTRANS_SERVER_KEY` dan `MIDTRANS_ENV` (lihat bagian Pembayaran)
   - `FREE_EMAILS` (emailmu sendiri, supaya situsmu terbit tanpa bayar)
4. **Domain dan subdomain otomatis (domain di Cloudflare, hosting di Vercel).** Lihat bagian "Domain Cloudflare + Vercel" di bawah.
5. **Login Google (opsional).** Di Google Cloud Console buat OAuth Client (Web). Authorized redirect URI:
   `https://julexbz.com/api/auth/callback/google`. Login hanya berlaku di domain utama, bukan di subdomain.
5b. **Email (lupa password + pengingat perpanjangan).** Daftar di Resend, verifikasi domain julexbz.com (tambah record DNS di Cloudflare), lalu isi env `RESEND_API_KEY`, `EMAIL_FROM` (contoh `Julexbz <noreply@julexbz.com>`) dan `CRON_SECRET` (string acak panjang). Jalankan `npm run migrate` untuk tabel baru. Cron harian (`vercel.json`, 09.00 WIB) mengirim pengingat H-30, H-7 dan H-1 sebelum masa aktif habis. Tes manual: `curl -H "Authorization: Bearer $CRON_SECRET" https://julexbz.com/api/cron/reminders`.
6. Buka `https://julexbz.com/daftar`, buat akun, pilih alamat situs, lalu edit.

Catatan harga: paket gratis Vercel (Hobby) ditujukan untuk penggunaan non-komersial. Untuk jualan langganan, cek syarat dan harga terbaru Vercel, Neon, dan Google sebelum meluncur.

## Beranda = situs pribadimu

Di mode langganan, `julexbz.com` menampilkan **situs pribadimu** (kartu 3D, proyek, kontak). 3 detik setelah halaman dibuka atau di-refresh muncul popup "Mau punya personal website seperti ini?" dengan tombol **Lihat paket** (ke `/mulai`, halaman harga dan fitur) dan **Nanti saja**. Popup muncul lagi di setiap refresh, bisa ditutup dengan Esc atau tombol ×, dan tidak muncul di situs pelanggan. Untuk mengubah jeda atau membuatnya tidak muncul berulang, edit `DELAY_MS` di `src/components/PromoPopup.tsx`.

Situs mana yang tampil dipilih otomatis, berurutan:
1. Situs dengan alamat `HOME_SLUG` (opsional, jika diisi dan sudah terbit).
2. Situs milik akun dengan email di `FREE_EMAILS` (cara paling mudah: daftar dengan emailmu, buat situs, edit di dashboard, selesai).
3. Isi awal bawaan (nama Muhammad Naufal Julian) kalau situsmu belum dibuat. Isinya ada di `src/lib/owner.ts`. Akun dengan email di `FREE_EMAILS` yang pertama kali membuat situs juga dimulai dari isi ini, jadi dashboard langsung terisi. Karena itu `FREE_EMAILS` hanya untuk emailmu sendiri.

`/kartu`, `/cv`, `/kontak.vcf` dan `/og` di `julexbz.com` otomatis memakai situs yang sama.

Penting: **daftarkan emailmu sendiri lebih dulu** sebelum situs dibuka untuk umum. Belum ada verifikasi email, jadi email di `FREE_EMAILS` yang belum terdaftar bisa didaftarkan orang lain.

## Pembayaran QRIS (Midtrans)

Alur: pelanggan memilih template, menekan **Simpan**, lalu otomatis diarahkan ke `/bayar`. Di sana muncul kode QRIS. Setelah dibayar, halaman berubah dan situs langsung terbit di `nama.julexbz.com`. Harga dan masa aktif ada di `src/lib/plans.ts` (`PRO`: harga tagih `amount` Rp 149.000 dan harga normal `listAmount` Rp 299.000 yang tampil dicoret, untuk 12 bulan). Nominal selalu ditentukan server.

Cara kerja yang aman:
- Server membuat transaksi QRIS (`/v2/charge`, `payment_type: qris`) dan menyimpannya di tabel `orders`.
- Penerbitan situs hanya terjadi setelah server **bertanya langsung ke Midtrans** (`/v2/{order_id}/status`) dan nominalnya cocok. Isi webhook tidak dipercaya mentah: tanda tangannya (SHA512) diperiksa, lalu status dikonfirmasi ulang.
- Webhook dan polling halaman bayar bisa datang bersamaan. Penerbitan hanya berjalan sekali per pesanan (satu pernyataan SQL), jadi masa aktif tidak dobel.
- Perpanjangan menambah 12 bulan dari tanggal berakhir yang lama (jika masih aktif) atau dari hari ini (jika sudah lewat).
- Setelah masa aktif habis ada **masa tenggang 3 hari**, lalu situs berhenti tampil (404) sampai diperpanjang.

Setup:
1. Daftar di [Midtrans](https://midtrans.com). Mulai dengan **Sandbox**: Settings > Access Keys, salin Server Key (diawali `SB-Mid-server-`) ke `MIDTRANS_SERVER_KEY`, dan isi `MIDTRANS_ENV=sandbox`.
2. Midtrans Dashboard > Settings > Payment: pastikan QRIS (GoPay QRIS) aktif.
3. Settings > Payment > **Notification URL**: `https://julexbz.com/api/pay/notify`. Webhook adalah jalur utama di produksi. Di komputer sendiri (tanpa alamat publik) tidak apa-apa: halaman bayar mengecek status tiap 4 detik, jadi tetap berjalan.
4. Coba di Sandbox: buat akun, isi situs, Simpan, bayar. Di Sandbox uang tidak sungguhan; simulasikan pembayaran lewat Midtrans Mobile Payment Simulator (cari "Midtrans simulator QRIS").
5. Setelah akun Midtrans produksi disetujui: ganti `MIDTRANS_SERVER_KEY` dengan Server Key produksi, `MIDTRANS_ENV=production`, dan isi Notification URL di dashboard produksi.

Catatan: QR dari Midtrans berlaku singkat (sekitar belasan menit). Jika kedaluwarsa, halaman bayar menawarkan kode baru. Biaya QRIS sekitar 0,7% per transaksi sukses (cek tarif terbaru Midtrans).

### Voucher diskon (untuk promo)

Voucher dibuat lewat skrip, tanpa SQL. Jalankan dari folder proyek (butuh `DATABASE_URL` di `.env`):

**Cara termudah: halaman admin.** Login dengan email yang ada di `ADMIN_EMAILS` (wajib diisi; kalau kosong tidak ada admin), lalu buka `https://julexbz.com/admin/voucher` atau tombol **Voucher** di dashboard. Di sana kamu bisa membuat satu atau banyak kode acak sekaligus (misalnya 5 kode diskon 80% untuk teman, kuota 1 per kode), memilih diskon persen, potongan rupiah, atau percobaan gratis, lalu menyalin kode atau tautan `/bayar?voucher=KODE`. Tabel di bawahnya menampilkan pemakaian dan tombol Matikan/Nyalakan. Halaman ini 404 untuk selain admin.

Cara lewat terminal (opsional):

```bash
# 20% untuk 50 orang pertama, berlaku 30 hari
node --env-file=.env scripts/voucher.mjs buat PROMO20 persen 20 50 30

# potongan Rp 50.000, tanpa batas jumlah dan waktu
node --env-file=.env scripts/voucher.mjs buat HEMAT50K rupiah 50000

# gratis penuh untuk 5 orang (misalnya hadiah atau teman)
node --env-file=.env scripts/voucher.mjs buat GRATIS100 persen 100 5

# percobaan gratis 7 hari: situs terbit, setelah 7 hari berhenti tampil sampai pelanggan membayar
# (sekali per pengguna, tanpa masa tenggang)
node --env-file=.env scripts/voucher.mjs buat TRIAL7 trial 7 100 30
node --env-file=.env scripts/voucher.mjs daftar          # lihat semua voucher dan pemakaiannya
node --env-file=.env scripts/voucher.mjs matikan PROMO20  # hentikan promo
node --env-file=.env scripts/voucher.mjs nyalakan PROMO20
```

Cara pelanggan memakainya: di halaman `/bayar` ada kolom **Kode voucher**. Untuk promo lewat tautan, bagikan `https://julexbz.com/bayar?voucher=PROMO20` (kode langsung terisi, tapi pelanggan tetap harus masuk dan punya situs dulu).

Aturan yang dijaga server:
- Harga akhir dihitung di server dan dikirim ke Midtrans. Browser tidak bisa mengubahnya.
- Pemakaian voucher baru dihitung setelah **lunas**, bukan saat QR dibuat, jadi QR yang tidak dibayar tidak menghabiskan kuota.
- Satu akun hanya bisa memakai satu voucher yang sama sekali.
- Voucher 100% (atau potongan yang membuat total Rp 0) langsung menerbitkan situs tanpa lewat Midtrans.
- Sisa tagihan yang lebih kecil dari Rp 1.000 (tapi bukan 0) ditolak. Angka Rp 1.000 ini batas aman dari saya, bukan aturan Midtrans. Ubah `MIN_CHARGE` di `src/lib/voucher.ts` jika perlu.
- Semua alasan penolakan (salah kode, kedaluwarsa, habis, sudah dipakai) dijawab sama, "Kode voucher tidak berlaku", supaya kode tidak bisa ditebak. Pengecekan dibatasi 15 kali per 10 menit per akun.
- Kode: 3-30 karakter huruf besar, angka, `-`, `_`.

### Memberi akses manual

```sql
-- terbitkan situs tanpa bayar selama 1 tahun (misalnya untuk teman atau hadiah)
update sites set plan = 'pro', published = true, plan_expires_at = now() + interval '1 year' where slug = 'budi';

-- nonaktifkan situs (tampil 404)
update sites set published = false where slug = 'budi';

-- lihat pesanan terakhir
select id, amount, status, created_at, paid_at from orders order by created_at desc limit 20;
```

Untuk pemilik: isi `FREE_EMAILS=emailmu@gmail.com` di environment. Situs baru dengan email itu langsung terbit tanpa bayar.

## Domain Cloudflare + Vercel (subdomain otomatis)

Tujuan: setiap pelanggan baru langsung punya `nama.julexbz.com` tanpa kamu mengatur DNS satu per satu. Cukup satu wildcard.

Vercel mewajibkan nameserver Vercel untuk domain wildcard, tapi jika domain tetap di Cloudflare ada jalur resmi: mendelegasikan hanya validasi sertifikat (`_acme-challenge`) ke Vercel. Langkahnya (mengikuti panduan Vercel "wildcard domain without Vercel nameservers"):

1. Di Vercel: Project > Settings > Domains, tambahkan `julexbz.com` **dan** `*.julexbz.com`.
2. Di halaman **Domains** tim Vercel, pilih `julexbz.com`, lalu di DNS Records klik **Enable Vercel DNS**. Jangan ganti nameserver di Cloudflare.
3. Di Cloudflare > DNS > Records, tambahkan:

| Type | Name | Value |
|---|---|---|
| NS | `_acme-challenge` | `ns1.vercel-dns.com` |
| NS | `_acme-challenge` | `ns2.vercel-dns.com` |
| CNAME | `*` | `cname.vercel-dns-0.com` (Proxy status: **DNS only**, awan abu-abu) |

4. Untuk `julexbz.com` sendiri (tanpa subdomain), pakai nilai yang ditampilkan Vercel di Settings > Domains (biasanya record A atau CNAME), juga **DNS only**. Wildcard tidak mencakup domain utama.
5. Tunggu beberapa menit sampai status di Vercel hijau (Valid Configuration, sertifikat terbit). **Jangan hapus record NS** `_acme-challenge`, karena itu yang menjaga sertifikat wildcard diperpanjang otomatis.

Catatan:
- "DNS only" untuk record yang menuju Vercel adalah saran saya agar sertifikat Vercel tidak bentrok dengan proxy Cloudflare. Panduan Vercel tidak membahas pengaturan proxy Cloudflare. Jika kamu ingin memakai proxy (awan oranye), uji dulu di satu subdomain.
- Setelah wildcard aktif, `middleware.ts` yang memetakan `nama.julexbz.com` ke situs milik `nama`. Pelanggan baru tidak perlu apa-apa lagi: begitu pembayarannya lunas, situs terbit.
- Subdomain yang tidak terdaftar menampilkan halaman 404 aplikasi.
- Alamat yang dilarang dipakai pelanggan (`www`, `api`, `admin`, dst.) ada di `RESERVED_SLUGS` di `src/lib/slug.ts`.

## Menjual kode (mode single)

Pembeli hosting sendiri di Vercel dengan database sendiri. Di environment mereka:

- `MODE=single`
- `ROOT_DOMAIN` dan `NEXT_PUBLIC_ROOT_URL` diisi domain mereka

Akun pertama yang mendaftar menjadi pemilik, lalu pendaftaran ditutup. Situs tampil di `/` dan diedit di `/dashboard`.
Mode single tidak memakai pembayaran. Tanda "Dibuat dengan julexbz.com" ikut tampil untuk paket `free`. Jika tidak mau di versi jual, jalankan
`update sites set plan = 'pro';` atau ubah `showsBadge` di `src/lib/plans.ts`.

## Struktur

```
src/middleware.ts          nama.domain.com  ->  /s/nama (rewrite internal)
src/app/page.tsx           beranda: situs pemilik (lihat src/lib/home.ts) atau mode single
src/app/mulai/             halaman pemasaran dan harga
src/components/PromoPopup  popup tawaran di beranda
src/app/s/[slug]/          halaman publik satu situs
src/app/dashboard/         editor (wajib login)
src/app/api/site           simpan isi situs
src/app/api/photo          unggah dan sajikan foto (disimpan di Postgres, maks 5 foto per situs)
src/app/bayar/             halaman bayar QRIS
src/app/api/pay/           create (buat QR), status (polling), notify (webhook Midtrans)
src/lib/midtrans.ts        panggilan ke API Midtrans
src/lib/orders.ts          pesanan dan penerbitan situs setelah lunas
src/lib/vouchers.ts        voucher diskon (hitung harga akhir)
scripts/voucher.mjs        buat, lihat, matikan voucher
src/auth.ts                Auth.js: email+password dan Google
src/components/            LanyardCard, SiteView, Editor, form login
src/lib/                   slug, validasi isi, tema, paket, akses database
schema.sql                 skema database
tests/                     tes unit dan tes SQL
```

## Keamanan yang sudah dipasang

- Password di-hash bcrypt. Pembatas: 8 gagal login per email per 15 menit, 5 pendaftaran per jaringan per jam
- Semua isi dari klien divalidasi di server (panjang, jumlah, tautan hanya http/https, email, tema, kepemilikan foto)
- Foto dikenali dari isi file, bukan dari header, dan disajikan dengan CSP sandbox
- Nama subdomain yang dicadangkan (`www`, `admin`, `api`, dan lainnya) ditolak
- Hanya pemilik situs yang bisa mengubah situsnya sendiri; `/s/*` tidak bisa diakses langsung dari luar

## Program referral (grand opening)

Setiap pengguna dengan langganan pro yang aktif melihat kartu **Undang teman** di dashboard, berisi kode `REF-XXXXXX` dan tautan `julexbz.com/r/REF-XXXXXX`.

- Pembeli baru yang daftar lewat tautan itu (atau mengetik kodenya di halaman bayar) dapat diskon 20% untuk pembelian pertamanya.
- Setelah pembayaran pembeli **lunas** (settlement), langganan pengundang bertambah 2 bulan. Maksimal 24 bulan total.
- Tidak berlaku: memakai kode sendiri, pembelian kedua, voucher percobaan (trial), dan akun dengan masa aktif tanpa batas (tidak diubah).
- Satu pembeli hanya menghasilkan satu hadiah (kolom unik `referrals.referred_id`), jadi webhook dan polling yang datang dobel aman.
- Angka diatur lewat `REFERRAL_DISCOUNT_PCT`, `REFERRAL_MONTHS`, `REFERRAL_CAP_MONTHS`. `REFERRAL_ENABLED=0` mematikan program.
- Jalankan `node scripts/migrate.mjs` sekali setelah update (kolom `users.ref_code` dan tabel `referrals`).
- Voucher buatan admin tidak boleh berawalan `REF` (dicadangkan untuk kode referral).

## Tautan sosial dan telepon

- Di tab Kontak, pengguna cukup menulis `@username` (atau nomor untuk WhatsApp) setelah memilih nama tautan seperti Instagram, TikTok, WhatsApp, LinkedIn, GitHub, YouTube, X, Facebook, Telegram, atau Threads. Tautan profil dibentuk otomatis (`src/lib/social.ts`). Tautan lengkap tetap diterima apa adanya.
- Nomor telepon di situs bisa diklik untuk menelepon, dengan tombol **WhatsApp** (`wa.me`, awalan 0 diubah ke 62). Nomor di belakang kartu dan di CV juga bisa diklik.
- Di HP, tab Template menampilkan pratinjau kecil yang menempel di atas, jadi template yang dipilih langsung terlihat tanpa pindah ke tab Pratinjau.
