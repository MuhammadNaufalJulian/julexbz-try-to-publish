// Isi halaman legal. Ini DRAF yang mengikuti cara kerja aplikasi saat ini; baca ulang sebelum buka penjualan.
// Ubah LEGAL_UPDATED setiap kali isinya diubah.
export const LEGAL_UPDATED = '28 November 2026';

export type LegalSection = { h: string; p: string[] };
export type LegalDoc = { slug: 'privasi' | 'syarat' | 'refund'; title: string; intro: string; sections: LegalSection[] };

export const LEGAL: Record<LegalDoc['slug'], LegalDoc> = {
  privasi: {
    slug: 'privasi',
    title: 'Kebijakan Privasi',
    intro: 'Halaman ini menjelaskan data apa yang kami simpan saat kamu memakai julexbz.com, untuk apa, dan hak kamu atas data itu.',
    sections: [
      { h: 'Data yang kami simpan', p: [
        'Akun: email, nama, dan kata sandi. Kata sandi disimpan dalam bentuk hash (bcrypt), jadi kami tidak bisa membacanya.',
        'Isi situs: teks, tautan, dan foto yang kamu isi di dashboard. Isi situs yang diterbitkan bisa dilihat siapa pun yang membuka alamatnya.',
        'Pembayaran: nomor pesanan, nominal, status, dan kode voucher yang dipakai. Kami tidak menyimpan data e-wallet atau rekening kamu; pembayaran QRIS diproses oleh Midtrans.',
        'Teknis: catatan percobaan masuk dan permintaan reset password untuk membatasi penyalahgunaan, serta log server standar dari penyedia hosting.',
      ] },
      { h: 'Untuk apa data dipakai', p: [
        'Menjalankan akun dan situsmu, memproses pembayaran, mengirim email penting (reset password, bukti bayar, pengingat perpanjangan), mencegah penyalahgunaan, dan membantu saat kamu menghubungi kami.',
        'Kami tidak menjual data kamu dan tidak memakainya untuk iklan pihak ketiga.',
      ] },
      { h: 'Pihak yang memproses data', p: [
        'Vercel (hosting), Neon (database), Cloudflare (DNS), Midtrans (pembayaran), dan Resend (pengiriman email). Mereka hanya menerima data yang dibutuhkan untuk tugasnya dan memiliki kebijakan privasinya sendiri.',
      ] },
      { h: 'Berapa lama data disimpan', p: [
        'Data akun dan situs disimpan selama akunmu ada. Catatan pembayaran bisa kami simpan lebih lama bila diperlukan untuk pembukuan atau penyelesaian sengketa. Token reset password berlaku 60 menit dan sekali pakai.',
      ] },
      { h: 'Hak kamu', p: [
        'Kamu bisa meminta salinan, perbaikan, atau penghapusan akun dan datamu dengan menghubungi kami lewat kontak bantuan di bawah. Kami akan membalas secepatnya, umumnya dalam beberapa hari kerja.',
      ] },
      { h: 'Keamanan', p: [
        'Koneksi memakai HTTPS dan akses database dibatasi. Meski begitu, tidak ada sistem yang sepenuhnya kebal; pakai kata sandi yang unik dan jangan membagikannya.',
      ] },
      { h: 'Perubahan kebijakan', p: ['Jika kebijakan ini berubah, tanggal "terakhir diperbarui" di atas ikut berubah.'] },
    ],
  },
  syarat: {
    slug: 'syarat',
    title: 'Syarat & Ketentuan',
    intro: 'Dengan membuat akun atau membayar di julexbz.com, kamu setuju dengan ketentuan berikut.',
    sections: [
      { h: 'Layanan', p: [
        'julexbz.com menyediakan situs pribadi dan kartu digital di alamat nama.julexbz.com. Layanan berbasis langganan: situs aktif selama masa langgananmu berlaku.',
      ] },
      { h: 'Akun', p: [
        'Kamu bertanggung jawab atas keamanan akunmu dan atas semua aktivitas di dalamnya. Gunakan data yang benar dan satu akun untuk satu orang.',
      ] },
      { h: 'Harga dan masa aktif', p: [
        'Harga ditampilkan dalam Rupiah di halaman bayar sebelum kamu membayar. Paket Pro berlaku 12 bulan sejak pembayaran. Perpanjangan sebelum masa aktif habis menambah 12 bulan dari tanggal berakhir yang lama. Voucher berlaku sesuai ketentuan masing-masing dan tidak bisa diuangkan.',
        'Langganan tidak diperpanjang otomatis. Kami mengirim email pengingat sebelum masa aktif habis.',
      ] },
      { h: 'Konten yang dilarang', p: [
        'Dilarang memuat konten yang melanggar hukum, penipuan, pornografi, ujaran kebencian, pelanggaran hak cipta, malware, atau data pribadi orang lain tanpa izin. Kami berhak menurunkan situs yang melanggar dan menutup akunnya tanpa pengembalian dana.',
      ] },
      { h: 'Masa aktif habis', p: [
        'Setelah masa aktif habis, situs tidak lagi ditampilkan untuk publik. Datamu tetap tersimpan sementara agar bisa diaktifkan lagi dengan perpanjangan, tetapi kami tidak menjamin penyimpanan tanpa batas waktu.',
      ] },
      { h: 'Ketersediaan dan batas tanggung jawab', p: [
        'Kami berusaha menjaga layanan tetap berjalan, tetapi tidak menjamin bebas gangguan. Sejauh diizinkan hukum, tanggung jawab kami terbatas pada jumlah yang kamu bayarkan untuk masa langgananmu saat ini.',
      ] },
      { h: 'Perubahan', p: ['Ketentuan atau fitur dapat berubah. Perubahan penting akan diumumkan lewat email atau situs ini.'] },
      { h: 'Kontak', p: ['Pertanyaan tentang ketentuan ini bisa dikirim lewat kontak bantuan di bawah.'] },
    ],
  },
  refund: {
    slug: 'refund',
    title: 'Kebijakan Refund',
    intro: 'Karena layanan digital langsung aktif setelah dibayar, refund diberikan hanya pada kondisi di bawah ini.',
    sections: [
      { h: 'Refund diberikan jika', p: [
        'Kamu sudah dibayar tetapi situs tidak aktif dan masalahnya tidak bisa kami perbaiki dalam 3 hari kerja sejak laporan.',
        'Terjadi pembayaran ganda untuk satu pesanan yang sama.',
        'Nominal yang terpotong tidak sesuai dengan yang tertera di halaman bayar.',
      ] },
      { h: 'Refund tidak diberikan jika', p: [
        'Kamu berubah pikiran setelah situs aktif dan layanan sudah dipakai.',
        'Akun ditutup karena melanggar syarat dan ketentuan.',
        'Kesalahan data yang kamu isi sendiri (misalnya alamat situs yang salah ketik); alamat situs bisa diubah lewat dashboard.',
      ] },
      { h: 'Cara mengajukan', p: [
        'Hubungi kami lewat kontak bantuan dalam 7 hari sejak pembayaran. Sertakan email akun, nomor pesanan (ada di email bukti bayar), dan penjelasan singkat. Bukti tangkapan layar membantu.',
      ] },
      { h: 'Proses', p: [
        'Kami memeriksa laporanmu dan membalas dalam beberapa hari kerja. Refund yang disetujui dikembalikan ke metode pembayaran asal atau lewat cara lain yang disepakati, dan dapat memakan waktu beberapa hari kerja tergantung penyedia pembayaran. Masa aktif situs dapat dihentikan bersamaan dengan refund.',
      ] },
      { h: 'Voucher dan trial', p: ['Pesanan gratis atau bernominal Rp0 (voucher trial) tidak memiliki refund karena tidak ada pembayaran.'] },
    ],
  },
};
