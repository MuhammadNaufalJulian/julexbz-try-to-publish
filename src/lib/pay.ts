import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export type OrderStatus = 'pending' | 'paid' | 'expired' | 'failed';

// Midtrans membatasi order_id 50 karakter dan hanya huruf, angka, dan - _ ~ .
export function newOrderId(now: number = Date.now(), rand: string = randomBytes(5).toString('hex')): string {
  return `JX-${now.toString(36)}-${rand}`.toUpperCase();
}

// signature_key = SHA512(order_id + status_code + gross_amount + server_key), huruf kecil heksadesimal.
export function notificationSignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string): string {
  return createHash('sha512').update(orderId + statusCode + grossAmount + serverKey).digest('hex');
}

export function verifySignature(n: Record<string, unknown> | null | undefined, serverKey: string): boolean {
  if (!n || !serverKey) return false;
  const { order_id, status_code, gross_amount, signature_key } = n;
  if (typeof order_id !== 'string' || typeof status_code !== 'string' || typeof gross_amount !== 'string' || typeof signature_key !== 'string') return false;
  const want = Buffer.from(notificationSignature(order_id, status_code, gross_amount, serverKey));
  const got = Buffer.from(signature_key.toLowerCase());
  return want.length === got.length && timingSafeEqual(want, got);
}

// Status tidak dikenal dianggap pending: lebih aman menunggu daripada menerbitkan situs tanpa bukti bayar.
export function mapStatus(tx: unknown, fraud?: unknown): OrderStatus {
  switch (tx) {
    case 'settlement':
      return 'paid';
    case 'capture':
      return fraud === 'accept' ? 'paid' : 'pending';
    case 'expire':
      return 'expired';
    case 'deny':
    case 'cancel':
    case 'failure':
      return 'failed';
    default:
      return 'pending';
  }
}

// "299000.00" -> 299000. Menolak pecahan, negatif, dan teks lain.
export function parseAmount(v: unknown): number | null {
  const s = typeof v === 'number' ? String(v) : v;
  if (typeof s !== 'string') return null;
  const m = /^(\d{1,10})(?:\.(\d{1,2}))?$/.exec(s.trim());
  if (!m) return null;
  if (m[2] && Number(m[2]) !== 0) return null;
  const n = Number(m[1]);
  return n > 0 ? n : null;
}
