import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { countUsers, getUserByEmail, upsertGoogleUser } from '@/lib/users';
import { MODE } from '@/lib/config';
import { isLimited, recordAttempt } from '@/lib/ratelimit';

const providers = [
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const email = String(raw?.email ?? '').trim().toLowerCase();
      const password = String(raw?.password ?? '');
      if (!email || !password || password.length > 72) return null;

      const key = `login:${email}`;
      if (await isLimited(key, 8, 15 * 60)) return null;

      const user = await getUserByEmail(email);
      // Bandingkan hash walau user tidak ada, supaya waktu respons tidak membocorkan email terdaftar.
      const hash = user?.passwordHash ?? '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.5G3nS0zq9Vq0p0Yt3tT0v1jB2c8u';
      const ok = await bcrypt.compare(password, hash);
      if (!user || !user.passwordHash || !ok) {
        await recordAttempt(key);
        return null;
      }
      return { id: user.id, email: user.email, name: user.name };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET }) as never);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: '/masuk' },
  trustHost: true,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        if (!profile?.email || profile.email_verified !== true) return false;
        // Mode satu situs: hanya pemilik yang sudah terdaftar yang boleh masuk.
        if (MODE === 'single' && !(await getUserByEmail(profile.email)) && (await countUsers()) > 0) return false;
        await upsertGoogleUser(profile.email, profile.name ?? null);
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account) {
        if (account.provider === 'google') {
          const u = token.email ? await getUserByEmail(token.email) : null;
          token.uid = u?.id;
        } else if (user?.id) {
          token.uid = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      return session;
    },
  },
});

export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
