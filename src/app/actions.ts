'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import bcrypt from 'bcryptjs';
import { auth, signIn, signOut } from '@/auth';
import { MODE, isFreeEmail } from '@/lib/config';
import { uniqueViolation } from '@/lib/db';
import { defaultContent } from '@/lib/content';
import { validateSlug } from '@/lib/slug';
import { createSite, getSiteByUserId } from '@/lib/sites';
import { ownerContent } from '@/lib/owner';
import { countUsers, createUser } from '@/lib/users';
import { isLimited, recordAttempt } from '@/lib/ratelimit';

export type FormState = { error?: string } | undefined;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LOGIN_ERROR = 'Email atau password salah, atau terlalu banyak percobaan. Coba lagi beberapa menit lagi.';

async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
}

async function signInWithPassword(email: string, password: string): Promise<FormState> {
  try {
    await signIn('credentials', { email, password, redirectTo: '/dashboard' });
    return undefined;
  } catch (e) {
    if (e instanceof AuthError) return { error: LOGIN_ERROR };
    throw e; // redirect ke /dashboard juga dilempar sebagai error dan harus diteruskan
  }
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const password = String(fd.get('password') ?? '');
  if (!EMAIL.test(email) || !password) return { error: 'Isi email dan password.' };
  return signInWithPassword(email, password);
}

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const name = String(fd.get('name') ?? '').trim();
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const password = String(fd.get('password') ?? '');

  if (!name || name.length > 80) return { error: 'Isi nama (maksimal 80 karakter).' };
  if (!EMAIL.test(email) || email.length > 120) return { error: 'Email tidak valid.' };
  if (password.length < 8) return { error: 'Password minimal 8 karakter.' };
  if (password.length > 72) return { error: 'Password maksimal 72 karakter.' };

  const key = `register:${await clientIp()}`;
  if (await isLimited(key, 5, 3600)) return { error: 'Terlalu banyak pendaftaran dari jaringan ini. Coba lagi nanti.' };
  if (MODE === 'single' && (await countUsers()) > 0) return { error: 'Pendaftaran ditutup. Situs ini sudah punya pemilik.' };
  await recordAttempt(key);

  try {
    await createUser(email, await bcrypt.hash(password, 10), name);
  } catch (e) {
    if (uniqueViolation(e)) return { error: 'Email ini sudah terdaftar. Silakan masuk.' };
    throw e;
  }
  return signInWithPassword(email, password);
}

export async function googleLogin(): Promise<void> {
  await signIn('google', { redirectTo: '/dashboard' });
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: '/' });
}

// Dipakai pengguna yang belum punya situs (baru daftar atau baru masuk lewat Google).
export async function claimSite(_: FormState, fd: FormData): Promise<FormState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/masuk');
  if (await getSiteByUserId(userId)) redirect('/dashboard');

  let slug = 'main';
  if (MODE !== 'single') {
    const v = validateSlug(fd.get('slug'));
    if (!v.ok) return { error: v.error };
    slug = v.slug;
  }

  try {
    // Mode langganan: situs baru belum terbit sampai dibayar (kecuali email di FREE_EMAILS).
    const published = MODE === 'single' || isFreeEmail(session.user.email);
    // Akun pemilik (FREE_EMAILS) dimulai dari isi situs pemilik, jadi dashboard langsung terisi.
    const initial = MODE !== 'single' && isFreeEmail(session.user.email) ? ownerContent() : defaultContent(session.user.name || 'Nama Kamu');
    await createSite(userId, slug, initial, published);
  } catch (e) {
    if (uniqueViolation(e)) return { error: 'Alamat ini sudah dipakai. Pilih yang lain.' };
    throw e;
  }
  redirect('/dashboard');
}
