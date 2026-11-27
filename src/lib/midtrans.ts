import { mapStatus, parseAmount, type OrderStatus } from './pay';

// Sandbox dipakai sampai MIDTRANS_ENV=production.
const BASE = process.env.MIDTRANS_ENV === 'production' ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';

export function midtransConfigured(): boolean {
  return !!process.env.MIDTRANS_SERVER_KEY;
}

function authHeader(): string {
  const k = process.env.MIDTRANS_SERVER_KEY;
  if (!k) throw new Error('MIDTRANS_SERVER_KEY belum diatur.');
  return 'Basic ' + Buffer.from(k + ':').toString('base64');
}

async function call(path: string, init: { method: 'GET' | 'POST'; body?: unknown }): Promise<Record<string, unknown>> {
  const res = await fetch(BASE + path, {
    method: init.method,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: authHeader() },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!data) throw new Error(`Midtrans membalas tidak terbaca (HTTP ${res.status}).`);
  return data;
}

// Membuat transaksi QRIS. Mengembalikan alamat gambar kode QR yang dilayani Midtrans.
export async function chargeQris(o: { orderId: string; amount: number; itemName: string }): Promise<{ qrUrl: string; transactionId: string }> {
  const d = await call('/v2/charge', {
    method: 'POST',
    body: {
      payment_type: 'qris',
      transaction_details: { order_id: o.orderId, gross_amount: o.amount },
      item_details: [{ id: 'pro', price: o.amount, quantity: 1, name: o.itemName }],
      qris: { acquirer: 'gopay' },
    },
  });
  if (String(d.status_code) !== '201') throw new Error(`Midtrans menolak transaksi: ${String(d.status_message ?? d.status_code)}`);

  const actions = Array.isArray(d.actions) ? (d.actions as { name?: string; url?: string }[]) : [];
  const act = actions.find((a) => a.name === 'generate-qr-code-v2') ?? actions.find((a) => a.name === 'generate-qr-code');
  let qrUrl = '';
  try {
    const u = new URL(String(act?.url ?? ''));
    if (u.protocol === 'https:' && (u.hostname === 'midtrans.com' || u.hostname.endsWith('.midtrans.com'))) qrUrl = u.href;
  } catch {
    /* dibiarkan kosong */
  }
  if (!qrUrl) throw new Error('Midtrans tidak mengirim kode QR.');
  return { qrUrl, transactionId: String(d.transaction_id ?? '') };
}

// Status sebenarnya dari Midtrans. Dipakai sebagai sumber kebenaran, bukan isi webhook.
export async function fetchStatus(orderId: string): Promise<{ status: OrderStatus; amount: number | null } | null> {
  const d = await call(`/v2/${encodeURIComponent(orderId)}/status`, { method: 'GET' });
  if (String(d.status_code) === '404') return null;
  return { status: mapStatus(d.transaction_status, d.fraud_status), amount: parseAmount(d.gross_amount) };
}
