import crypto from 'node:crypto';

const secret = () => process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
const hmac = (p) => crypto.createHmac('sha256', secret()).update(p).digest('hex');

export function safeEq(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function sign(exp) {
  const p = String(exp);
  return p + '.' + hmac(p);
}

export function verifyCookie(req) {
  const m = (req.headers.cookie || '').match(/(?:^|;\s*)adm=([^;]+)/);
  if (!m || !secret()) return false;
  let v;
  try { v = decodeURIComponent(m[1]); } catch { return false; }
  const [p, s] = v.split('.');
  if (!p || !s || !(+p > Date.now())) return false;
  const a = Buffer.from(s);
  const b = Buffer.from(hmac(p));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const cookie = (v, age) =>
  `adm=${encodeURIComponent(v)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${age}`;
