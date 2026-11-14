'use client';

import { useActionState } from 'react';
import { claimSite, logout, type FormState } from '@/app/actions';

export default function ClaimSite({ single, rootHost, name }: { single: boolean; rootHost: string; name: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(claimSite, undefined);

  return (
    <div className="pad">
      <div className="authbox">
        <h1>Halo, {name}</h1>
        <p className="note">
          {single ? 'Satu langkah lagi: buat situsmu.' : 'Pilih alamat situsmu. Pengunjung akan membukanya di alamat ini.'}
        </p>
        <form action={action}>
          {!single ? (
            <div className="fld">
              <label htmlFor="c-slug">Alamat situs</label>
              <input id="c-slug" name="slug" type="text" required minLength={3} maxLength={30} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="namamu" />
              <p className="note">Hasilnya: <span className="mono">namamu.{rootHost}</span>. Huruf kecil, angka, dan tanda hubung.</p>
            </div>
          ) : null}
          {state?.error ? <p className="err" role="alert">{state.error}</p> : null}
          <button type="submit" className="btn primary lg" disabled={pending}>{pending ? 'Membuat...' : 'Buat situs'}</button>
        </form>
        <form action={logout}>
          <button type="submit" className="btn sm">Keluar</button>
        </form>
      </div>
    </div>
  );
}
