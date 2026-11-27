'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { requestReset, resetPassword, type ResetState } from '@/app/actions';

export default function ResetForm({ token }: { token?: string }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(token ? resetPassword : requestReset, undefined);

  if (state?.done) {
    return (
      <div className="authbox">
        <h1>Cek email kamu</h1>
        <p className="note">Kalau email itu terdaftar, tautan untuk mengatur ulang password sudah dikirim. Berlaku 60 menit. Cek juga folder spam.</p>
        <p className="note"><Link href="/masuk">Kembali ke halaman masuk</Link></p>
      </div>
    );
  }

  return (
    <div className="authbox">
      <h1>{token ? 'Password baru' : 'Lupa password'}</h1>
      <form action={action}>
        {token ? (
          <>
            <input type="hidden" name="token" value={token} />
            <div className="fld">
              <label htmlFor="r-pass">Password baru</label>
              <input id="r-pass" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
              <p className="note">Minimal 8 karakter.</p>
            </div>
          </>
        ) : (
          <div className="fld">
            <label htmlFor="r-email">Email</label>
            <input id="r-email" name="email" type="email" autoComplete="email" required maxLength={120} />
          </div>
        )}
        {state?.error ? <p className="err" role="alert">{state.error}</p> : null}
        <button type="submit" className="btn primary lg" disabled={pending}>
          {pending ? 'Memproses...' : token ? 'Simpan password' : 'Kirim tautan'}
        </button>
      </form>
      <p className="note"><Link href="/masuk">Kembali ke halaman masuk</Link></p>
    </div>
  );
}
