import { safeEq, sign, verifyCookie, cookie } from './_lib.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    return res.status(200).json({ admin: verifyCookie(req) });
  }

  if (req.method === 'POST') {
    const real = process.env.ADMIN_PASSWORD;
    if (!real) return res.status(500).json({ error: 'ADMIN_PASSWORD belum diatur di Vercel.' });
    const pw = req.body && req.body.password;
    if (typeof pw !== 'string' || !safeEq(pw, real)) {
      await new Promise((r) => setTimeout(r, 900));
      return res.status(401).json({ error: 'Password salah.' });
    }
    const week = 7 * 24 * 3600;
    res.setHeader('Set-Cookie', cookie(sign(Date.now() + week * 1000), week));
    return res.status(200).json({ admin: true });
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', cookie('', 0));
    return res.status(200).json({ admin: false });
  }

  res.status(405).end();
}
