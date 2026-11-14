'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { googleLogin, login, register, type FormState } from '@/app/actions';

export default function AuthForm({ kind, google, canRegister }: { kind: 'login' | 'register'; google: boolean; canRegister: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(kind === 'login' ? login : register, undefined);
  const isLogin = kind === 'login';

  return (
    <div className="authbox">
      <h1>{isLogin ? 'Masuk' : 'Buat akun'}</h1>
      {google ? (
        <>
          <form action={googleLogin}>
            <button type="submit" className="btn lg">Lanjut dengan Google</button>
          </form>
          <div className="divider">atau pakai email</div>
        </>
      ) : null}
      <form action={action}>
        {!isLogin ? (
          <div className="fld">
            <label htmlFor="a-name">Nama</label>
            <input id="a-name" name="name" type="text" autoComplete="name" required maxLength={80} />
          </div>
        ) : null}
        <div className="fld">
          <label htmlFor="a-email">Email</label>
          <input id="a-email" name="email" type="email" autoComplete="email" required maxLength={120} />
        </div>
        <div className="fld">
          <label htmlFor="a-pass">Password</label>
          <input id="a-pass" name="password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} required minLength={isLogin ? undefined : 8} maxLength={72} />
          {!isLogin ? <p className="note">Minimal 8 karakter.</p> : null}
        </div>
        {state?.error ? <p className="err" role="alert">{state.error}</p> : null}
        <button type="submit" className="btn primary lg" disabled={pending}>
          {pending ? 'Memproses...' : isLogin ? 'Masuk' : 'Daftar'}
        </button>
      </form>
      <p className="note">
        {isLogin ? (
          canRegister ? (
            <>Belum punya akun? <Link href="/daftar">Daftar</Link></>
          ) : null
        ) : (
          <>Sudah punya akun? <Link href="/masuk">Masuk</Link></>
        )}
      </p>
    </div>
  );
}
