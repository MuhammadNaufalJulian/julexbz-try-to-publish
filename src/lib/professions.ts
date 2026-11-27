import type { Content, TemplateId } from './content';

// Contoh isi untuk tiap template profesi. Dipakai tombol "Isi contoh profesi ini" di dashboard.
// Hanya teks umum yang jelas contoh, supaya mudah diganti. Nama, foto, kontak, dan warna pengguna tidak disentuh.
export type Starter = Pick<Content, 'status' | 'role' | 'tagline' | 'about' | 'skills' | 'projects' | 'experience' | 'education'> & { cardLabel: string };

const p = (title: string, year: string, desc: string, tags: string[]) => ({ title, year, desc, tags, url: '' });

export const STARTERS: Partial<Record<TemplateId, Starter>> = {
  developer: {
    status: 'Terbuka untuk proyek freelance',
    role: 'Software Engineer',
    tagline: 'Membangun aplikasi web yang cepat, rapi, dan mudah dirawat.',
    about: 'Saya membuat aplikasi web dari rancangan sampai berjalan di produksi. Fokus saya di front-end dan API, dengan perhatian pada performa dan keterbacaan kode.',
    skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Git'],
    projects: [p('Aplikasi Kasir UMKM', '2025', 'Mencatat penjualan, stok, dan laporan harian dari satu layar.', ['React', 'PostgreSQL']), p('API Notifikasi', '2024', 'Layanan pengirim pengingat lewat email dan WhatsApp.', ['Node.js', 'Redis'])],
    experience: [{ role: 'Software Engineer', org: 'Nama Perusahaan', period: '2023 - sekarang', desc: 'Mengembangkan fitur web, menulis tes, dan meninjau kode tim.' }],
    education: [{ school: 'Nama Universitas', degree: 'S1 Teknik Informatika', period: '2019 - 2023', desc: '' }],
    cardLabel: 'Kartu Developer',
  },
  desainer: {
    status: 'Menerima proyek baru bulan ini',
    role: 'Desainer Grafis & Brand',
    tagline: 'Identitas visual yang membuat usaha kecil terlihat percaya diri.',
    about: 'Saya membantu usaha dan komunitas punya tampilan yang konsisten: logo, kemasan, media sosial, dan materi cetak. Proses saya dimulai dari memahami cerita brand, bukan dari tren.',
    skills: ['Branding', 'Logo', 'Tipografi', 'Ilustrasi', 'Figma', 'Adobe Illustrator'],
    projects: [p('Rebranding Kedai Kopi', '2025', 'Logo, menu, dan kemasan untuk kedai kopi lokal.', ['Branding', 'Kemasan']), p('Poster Festival Musik', '2024', 'Seri poster dan materi media sosial untuk festival kampus.', ['Poster', 'Ilustrasi'])],
    experience: [{ role: 'Desainer Grafis', org: 'Nama Studio', period: '2022 - sekarang', desc: 'Mengerjakan identitas visual untuk klien UMKM dan startup.' }],
    education: [{ school: 'Nama Universitas', degree: 'S1 Desain Komunikasi Visual', period: '2017 - 2021', desc: '' }],
    cardLabel: 'Kartu Desainer',
  },
  fotografer: {
    status: 'Menerima pemesanan sesi foto',
    role: 'Fotografer Potret & Acara',
    tagline: 'Menangkap momen apa adanya, dengan cahaya yang jujur.',
    about: 'Saya memotret pernikahan, acara keluarga, dan potret pribadi. Pendekatan saya santai: saya ingin Anda terlihat seperti diri sendiri, bukan sedang berpose kaku.',
    skills: ['Potret', 'Pernikahan', 'Acara', 'Lightroom', 'Fotografi produk'],
    projects: [p('Seri Potret Senja', '2025', 'Potret pribadi di luar ruangan dengan cahaya alami.', ['Potret']), p('Pernikahan Dina & Raka', '2024', 'Liputan akad dan resepsi, dua fotografer.', ['Pernikahan'])],
    experience: [{ role: 'Fotografer Lepas', org: 'Studio Pribadi', period: '2020 - sekarang', desc: 'Sesi potret, acara, dan foto produk untuk usaha lokal.' }, { role: 'Pameran Bersama', org: 'Nama Galeri', period: '2024', desc: 'Menampilkan 8 foto dalam pameran kolektif.' }],
    education: [],
    cardLabel: 'Kartu Fotografer',
  },
  kesehatan: {
    status: 'Menerima janji temu',
    role: 'Dokter Umum',
    tagline: 'Pelayanan yang tenang, jelas, dan berpihak pada kenyamanan pasien.',
    about: 'Saya melayani pemeriksaan umum, konsultasi keluhan sehari-hari, dan pencegahan penyakit. Saya percaya penjelasan yang mudah dipahami adalah bagian dari pengobatan.',
    skills: ['Pemeriksaan umum', 'Konsultasi', 'Kesehatan keluarga', 'Edukasi pasien'],
    projects: [p('Pemeriksaan Umum', '', 'Pemeriksaan keluhan, tekanan darah, dan rujukan bila diperlukan.', ['Klinik']), p('Konsultasi Online', '', 'Konsultasi singkat lewat telepon atau video.', ['Online'])],
    experience: [{ role: 'Dokter Umum', org: 'Nama Klinik', period: '2022 - sekarang', desc: 'Melayani pasien rawat jalan dan kegiatan penyuluhan.' }],
    education: [{ school: 'Nama Universitas', degree: 'Pendidikan Dokter', period: '2014 - 2020', desc: '' }, { school: 'Nama Lembaga', degree: 'Sertifikat Kompetensi', period: '2021', desc: '' }],
    cardLabel: 'Kartu Praktik',
  },
  pengajar: {
    status: 'Membuka kelas semester depan',
    role: 'Dosen & Pengajar',
    tagline: 'Belajar yang membuat orang berani bertanya.',
    about: 'Saya mengajar dan membimbing mahasiswa dengan contoh nyata dari dunia kerja. Bagi saya kelas yang baik adalah kelas tempat orang tidak takut salah.',
    skills: ['Pengajaran', 'Bimbingan skripsi', 'Penyusunan kurikulum', 'Riset', 'Public speaking'],
    projects: [p('Pengantar Pemrograman', '2025', 'Mata kuliah semester 1 dengan banyak latihan langsung.', ['Mata kuliah']), p('Modul Belajar Mandiri', '2024', 'Kumpulan modul dan latihan terbuka untuk mahasiswa.', ['Modul'])],
    experience: [{ role: 'Dosen', org: 'Nama Universitas', period: '2021 - sekarang', desc: 'Mengajar tiga mata kuliah dan membimbing tugas akhir.' }],
    education: [{ school: 'Nama Universitas', degree: 'S2 Ilmu Komputer', period: '2018 - 2020', desc: '' }],
    cardLabel: 'Kartu Pengajar',
  },
  hukum: {
    status: 'Menerima konsultasi awal',
    role: 'Advokat & Konsultan Hukum',
    tagline: 'Nasihat hukum yang jelas, jujur, dan bisa dijalankan.',
    about: 'Saya mendampingi individu dan usaha dalam perkara perdata, kontrak, dan kepatuhan. Saya menjelaskan pilihan dan risikonya dengan bahasa yang mudah dipahami sebelum Anda memutuskan.',
    skills: ['Hukum kontrak', 'Hukum bisnis', 'Ketenagakerjaan', 'Mediasi', 'Kepatuhan'],
    projects: [p('Penyusunan & Tinjauan Kontrak', '', 'Menyusun dan meninjau kontrak usaha, kerja sama, dan sewa.', ['Kontrak']), p('Pendampingan Sengketa', '', 'Mediasi dan pendampingan perkara perdata.', ['Sengketa'])],
    experience: [{ role: 'Advokat', org: 'Nama Kantor Hukum', period: '2019 - sekarang', desc: 'Menangani perkara perdata dan konsultasi usaha.' }],
    education: [{ school: 'Nama Universitas', degree: 'S1 Ilmu Hukum', period: '2014 - 2018', desc: '' }, { school: 'Nama Organisasi Profesi', degree: 'Lisensi Advokat', period: '2019', desc: '' }],
    cardLabel: 'Kartu Konsultan',
  },
  kuliner: {
    status: 'Menerima pesanan katering',
    role: 'Chef & Pemilik Dapur',
    tagline: 'Masakan rumahan yang dibuat serius, dari bahan yang segar.',
    about: 'Saya memasak untuk pesanan harian, acara keluarga, dan katering kecil. Resep saya sederhana, tapi bumbunya dikerjakan dengan sabar.',
    skills: ['Masakan Nusantara', 'Pastry', 'Katering', 'Manajemen dapur', 'Kopi'],
    projects: [p('Nasi Kuning Komplit', '', 'Nasi kuning dengan lauk pilihan, cocok untuk acara 10 orang atau lebih.', ['Katering']), p('Paket Brownies & Kopi', '', 'Brownies panggang dan kopi susu untuk hadiah atau rapat.', ['Dessert'])],
    experience: [{ role: 'Chef', org: 'Nama Restoran', period: '2020 - sekarang', desc: 'Memimpin dapur, menyusun menu, dan melatih tim.' }],
    education: [{ school: 'Nama Sekolah Kuliner', degree: 'Diploma Tata Boga', period: '2017 - 2019', desc: '' }],
    cardLabel: 'Kartu Dapur',
  },
  musisi: {
    status: 'Terbuka untuk pentas dan kolaborasi',
    role: 'Musisi & Penulis Lagu',
    tagline: 'Lagu yang jujur, dibawakan dengan sepenuh hati.',
    about: 'Saya menulis dan membawakan lagu sendiri, juga tampil di acara, kafe, dan pernikahan. Terbuka untuk kolaborasi, penulisan lagu, dan permintaan tampil.',
    skills: ['Vokal', 'Gitar', 'Penulisan lagu', 'Produksi musik', 'Tampil langsung'],
    projects: [p('Single: Pulang Lebih Awal', '2025', 'Single terbaru, tersedia di layanan musik digital.', ['Single']), p('EP: Lampu Kota', '2024', 'Lima lagu tentang kota dan orang-orang di dalamnya.', ['EP'])],
    experience: [{ role: 'Penampil Tetap', org: 'Nama Kafe', period: '2023 - sekarang', desc: 'Tampil setiap akhir pekan dengan repertoar lagu sendiri.' }, { role: 'Festival', org: 'Nama Festival', period: '2024', desc: 'Tampil di panggung utama sesi sore.' }],
    education: [],
    cardLabel: 'Kartu Musisi',
  },
};

export function hasStarter(id: TemplateId): boolean {
  return !!STARTERS[id];
}

// Mengganti isi profesi dengan contoh. Nama, foto, kontak, kota, perusahaan, warna, template, dan pengaturan CV tetap milik pengguna.
export function applyStarter(c: Content, id: TemplateId): Content {
  const s = STARTERS[id];
  if (!s) return c;
  return {
    ...c,
    status: s.status,
    role: s.role,
    tagline: s.tagline,
    about: s.about,
    skills: [...s.skills],
    projects: s.projects.map((x) => ({ ...x, tags: [...x.tags] })),
    experience: s.experience.map((x) => ({ ...x })),
    education: s.education.map((x) => ({ ...x })),
    card: { ...c.card, label: s.cardLabel },
  };
}
