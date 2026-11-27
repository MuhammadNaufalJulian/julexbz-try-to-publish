// Kirim email lewat Resend (https://resend.com). Tanpa RESEND_API_KEY, email tidak dikirim dan fungsi mengembalikan false.
// EMAIL_FROM contoh: "Julexbz <noreply@julexbz.com>" (domain harus sudah diverifikasi di Resend).

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  if (!emailEnabled()) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, html, text }),
    });
    if (!res.ok) console.error('Resend gagal', res.status);
    return res.ok;
  } catch {
    console.error('Resend tidak terjangkau');
    return false;
  }
}

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

// Kerangka email sederhana. body sudah berupa HTML aman (nilai dari pengguna harus lewat esc()).
export function layout(title: string, body: string, button?: { href: string; label: string }): string {
  const btn = button
    ? `<p style="margin:24px 0"><a href="${esc(button.href)}" style="background:#18C26A;color:#06210f;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block">${esc(button.label)}</a></p>`
    : '';
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#1a1a1a"><h2 style="margin:0 0 12px">${esc(title)}</h2>${body}${btn}<p style="color:#888;font-size:12px;margin-top:28px">Julexbz | julexbz.com</p></div>`;
}
