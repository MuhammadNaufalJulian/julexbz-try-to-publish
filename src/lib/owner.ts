import { defaultContent, type Content } from './content.ts';

// Isi bawaan situs pemilik (Muhammad Naufal Julian). Dipakai di beranda julexbz.com selama situs pemilik belum
// dibuat di dashboard, dan sebagai isi awal dashboard saat email di FREE_EMAILS pertama kali membuat situs.
// Disusun dari dua ringkasan AI yang saling berbeda di beberapa hal. Bagian yang tidak cocok atau belum
// dikonfirmasi sengaja dikosongkan (kota, periode kerja, toko online). Email, telepon, tautan GitHub, LinkedIn,
// Instagram, dan sertifikat sudah dikonfirmasi pemilik.
export function ownerContent(): Content {
  const c = defaultContent('Muhammad Naufal Julian');
  c.template = 'klasik';
  c.theme = 'cobalt';
  c.siteTitle = 'Muhammad Naufal Julian | Web Developer';
  c.status = 'Terbuka untuk proyek baru dan kolaborasi';
  c.role = 'Full-Stack Web Developer & Digital Product Builder';
  c.tagline = 'Saya membangun ide menjadi produk digital yang berfungsi: aplikasi web, sistem inventaris, dan platform untuk UMKM.';
  c.card = { label: 'Kartu Nama Digital', org: 'JulexBZ', city: '' };
  c.about = [
    'Saya Muhammad Naufal Julian, web developer yang membangun website, aplikasi, dan produk digital dari ide sampai bisa dipakai. Saya mengerjakan sisi backend maupun frontend, dengan fokus pada kerapian struktur kode, arsitektur yang efisien, dan kemudahan bagi pengguna.',
    'Teknologi yang saya pakai meliputi Laravel, PHP, JavaScript, TypeScript, React, Next.js, dan MySQL, dengan Supabase dan Node.js, serta deployment lewat Vercel dan Cloudflare. Saya juga memanfaatkan tools AI untuk belajar, memecahkan masalah, dan mempercepat pengembangan.',
    'Saya mahasiswa Teknik Informatika dan sedang membangun JulexBZ sebagai ekosistem produk digital, termasuk layanan untuk UMKM. Saya terbuka untuk kolaborasi proyek web, pembuatan platform bisnis, dan peluang kerja di bidang rekayasa perangkat lunak.',
  ].join('\n\n');
  c.skills = [
    'Laravel', 'PHP', 'JavaScript', 'TypeScript', 'React.js', 'Next.js', 'Node.js', 'MySQL', 'Supabase', 'Tailwind CSS',
    'Git', 'REST API', 'Vercel', 'Cloudflare', 'HTML & CSS', 'Firebase', 'UI/UX Design', 'Responsive Web Design', 'AI Integration', 'Prompt Engineering',
  ];
  c.projects = [
    { title: 'JulexBZ (julexbz.com)', year: '2026', desc: 'Situs pribadi sekaligus hub portofolio dan pengatur subdomain proyek. Berisi kartu nama digital 3D, dashboard untuk mengubah isi, ekspor CV, dan layanan situs pribadi berlangganan.', tags: ['Next.js', 'Vercel', 'Cloudflare', 'Portofolio'], url: 'https://julexbz.com' },
    { title: 'DIGIBO', year: '2026', desc: 'Layanan digital untuk UMKM: halaman web bisnis yang mengarahkan pengunjung ke WhatsApp, serta otomasi komunikasi bisnis.', tags: ['UMKM', 'Web Service', 'WhatsApp', 'Automation'], url: 'https://digibo.julexbz.com' },
    { title: 'JulexBZ DigiProd', year: '2026', desc: 'Rancangan platform produk digital untuk menjual source code, template, dan lisensi. Dibangun dengan Next.js dan PostgreSQL.', tags: ['Next.js', 'PostgreSQL', 'Digital Product', 'E-Commerce'], url: 'https://digiprod.julexbz.com' },
    { title: 'INMAS PRO V2.0 (ATK Smart Inventory Kiosk)', year: '2026', desc: 'Sistem inventaris mandiri berbasis jaringan lokal dengan pemindaian QR Code lewat smartphone, verifikasi foto selfie, dan notifikasi suara Web Audio.', tags: ['Laravel', 'QR Code', 'Web Audio', 'Inventaris'], url: '' },
    { title: 'sweble.labs', year: '2026', desc: 'Aplikasi web untuk merek streetwear: jurnal editorial dan showcase pertunjukan musik langsung, berbasis Supabase.', tags: ['Web App', 'Supabase', 'Streetwear', 'Editorial'], url: '' },
    { title: 'BukUsaha', year: '2026', desc: 'Aplikasi pencatatan keuangan sederhana untuk membantu pelaku UMKM mencatat pemasukan dan pengeluaran secara digital sebagai pengganti buku manual. Dibangun dengan Laravel dan MySQL.', tags: ['Laravel', 'PHP', 'MySQL', 'UMKM'], url: '' },
    { title: 'SPK Evaluasi Perkembangan Siswa TKIF Al-Fikri', year: '2026', desc: 'Rancangan sistem pendukung keputusan berbasis web untuk membantu evaluasi perkembangan siswa taman kanak-kanak dengan metode Simple Additive Weighting (SAW).', tags: ['Laravel', 'SPK', 'SAW', 'Pendidikan'], url: '' },
    { title: 'Sekoloka (TemuSekolah)', year: '2026', desc: 'Rancangan platform pencarian, eksplorasi, dan perbandingan sekolah di Indonesia untuk membantu masyarakat menemukan informasi sekolah.', tags: ['EdTech', 'Web Platform', 'Pendidikan'], url: '' },
    { title: 'KAPERumah', year: '', desc: 'Website properti dengan unggah properti, galeri foto, tautan lokasi peta, dan simulasi Kredit Pemilikan Rumah (KPR). Dibangun dengan PHP dan MySQL.', tags: ['PHP', 'MySQL', 'Properti', 'KPR'], url: '' },
    { title: 'EO-AI-ASISTEN', year: '2026', desc: 'Rancangan asisten AI pribadi dengan percakapan, pengelolaan profil, pengingat, kalender, dan bantuan pengembangan website, serta eksplorasi suara dan sistem memori.', tags: ['AI', 'Python', 'Automation', 'Voice'], url: '' },
  ];
  c.experience = [
    { role: 'Founder & Independent Digital Product Builder', org: 'JulexBZ', period: '2026 - sekarang', desc: 'Membangun JulexBZ sebagai ekosistem website, aplikasi, dan produk digital, dari layanan untuk UMKM sampai platform produk digital.' },
    { role: 'Guru / Tenaga Pendidik', org: 'TKIF Al-Fikri', period: '', desc: 'Bekerja di lingkungan pendidikan taman kanak-kanak sambil menempuh pendidikan tinggi di bidang Teknik Informatika.' },
  ];
  c.education = [
    { school: 'Universitas Indraprasta PGRI (UNINDRA)', degree: 'S1 Teknik Informatika', period: 'Target lulus 2027', desc: '' },
    { school: 'CodePolitan', degree: 'Sertifikat Belajar JavaScript, JavaScript DOM, Bootstrap, Dasar CSS, dan Dasar HTML', period: '2023 - 2024', desc: 'Lima sertifikat kelas web development dengan ID kredensial yang bisa diperiksa di codepolitan.com/c/.' },
    { school: 'LinkedIn Learning', degree: 'Sertifikat Generative AI dan Microsoft Copilot', period: '2024', desc: 'Ethics in the Age of Generative AI, Learning Microsoft 365 Copilot, dan tiga kursus Generative AI dan Copilot lainnya.' },
  ];
  c.contact = {
    email: 'muhamadnaufal210@gmail.com',
    phone: '+62 896-2804-7497',
    links: [
      { label: 'GitHub', url: 'https://github.com/MuhammadNaufalJulian' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/muhammad-julian-8a5845294/' },
      { label: 'Instagram', url: 'https://instagram.com/julexbz' },
      { label: 'DIGIBO', url: 'https://digibo.julexbz.com' },
      { label: 'DigiProd', url: 'https://digiprod.julexbz.com' },
    ],
  };
  return c;
}
