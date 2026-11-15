// Foto profil. Foto unggahan disimpan di database dan dilayani lewat /api/photo/<id>.
// Nilai khusus "owner" berarti foto bawaan pemilik (public/owner.jpg) untuk beranda julexbz.com.
// Nilai ini hanya dibuat oleh server di src/lib/home.ts dan tidak pernah lolos validasi simpan (harus UUID).
export const OWNER_PHOTO = 'owner';

export function photoSrc(photoId: string): string {
  return photoId === OWNER_PHOTO ? '/owner.jpg' : `/api/photo/${photoId}`;
}
