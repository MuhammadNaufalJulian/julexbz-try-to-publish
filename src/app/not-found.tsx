import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="pad">
      <div className="authbox">
        <h1>Halaman tidak ditemukan</h1>
        <p className="note">Alamat ini belum dipakai atau situsnya sudah tidak aktif.</p>
        <p>
          <Link className="btn primary" href={process.env.NEXT_PUBLIC_ROOT_URL || '/'}>Ke beranda</Link>
        </p>
      </div>
    </div>
  );
}
