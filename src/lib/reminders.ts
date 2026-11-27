import { q } from './db';
import { sendEmail, layout, esc } from './email';
import { rootUrl } from './home';

// Pengingat dikirim saat sisa masa aktif jatuh pada ambang ini (hari). Cron berjalan harian.
export const REMINDER_DAYS = [30, 7, 1] as const;

type Due = { site_id: string; email: string; name: string | null; slug: string; expires_at: Date | string; days: number };

// Situs berbayar (pro) yang akan berakhir dalam <= ambang hari dan belum dikirimi pengingat untuk ambang itu.
// Ambang terkecil yang sudah terlewati yang dipakai, jadi pengingat tidak dobel dan tidak terlewat bila cron sempat mati sehari.
export async function dueReminders(): Promise<Due[]> {
  return q<Due>(
    `select s.id as site_id, u.email, u.name, s.slug, s.plan_expires_at as expires_at, d.days
     from sites s
     join users u on u.id = s.user_id
     join lateral (
       select min(x) as days from unnest($1::int[]) x
       where s.plan_expires_at <= now() + make_interval(days => x)
     ) d on d.days is not null
     where s.plan = 'pro' and s.published and s.plan_expires_at is not null and s.plan_expires_at > now()
       and not exists (
         select 1 from renewal_reminders r
         where r.site_id = s.id and r.expires_at = s.plan_expires_at and r.days_before <= d.days
       )`,
    [REMINDER_DAYS as unknown as number[]],
  );
}

export async function sendRenewalReminders(): Promise<{ due: number; sent: number }> {
  const due = await dueReminders();
  let sent = 0;
  for (const d of due) {
    const exp = new Date(d.expires_at);
    const tgl = exp.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
    const left = Math.max(1, Math.ceil((exp.getTime() - Date.now()) / 86_400_000));
    const sisa = left === 1 ? 'besok' : `${left} hari lagi`;
    const nama = d.name ? esc(d.name.split(' ')[0]) : 'kamu';
    const html = layout(
      `Situs kamu berakhir ${sisa}`,
      `<p>Halo ${nama}, langganan situs <strong>${esc(d.slug)}</strong> aktif sampai <strong>${esc(tgl)}</strong>.</p><p>Perpanjang sekarang supaya situs dan kartu digitalmu tetap tampil. Sisa hari yang masih ada tidak hangus, masa aktif baru ditambahkan di atasnya.</p>`,
      { href: `${rootUrl()}/bayar`, label: 'Perpanjang sekarang' },
    );
    const text = `Halo, langganan situs ${d.slug} aktif sampai ${tgl}. Perpanjang di ${rootUrl()}/bayar (sisa hari tidak hangus).`;
    const ok = await sendEmail(d.email, `Situs ${d.slug} berakhir ${sisa}`, html, text);
    if (ok) {
      await q(`insert into renewal_reminders (site_id, expires_at, days_before) values ($1, $2, $3) on conflict do nothing`, [d.site_id, exp.toISOString(), d.days]);
      sent++;
    }
  }
  return { due: due.length, sent };
}
