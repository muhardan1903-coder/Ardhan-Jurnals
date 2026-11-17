import { put } from '@vercel/blob';
import { verifyCookie } from './_lib.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  if (!verifyCookie(req)) return res.status(401).json({ error: 'Belum login atau sesi habis.' });

  const d = req.body && req.body.data;
  const m = typeof d === 'string' ? /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(d) : null;
  if (!m) return res.status(400).json({ error: 'Gambar tidak valid.' });

  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 3.5e6) return res.status(413).json({ error: 'Gambar terlalu besar.' });

  try {
    const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
    const b = await put(`img/${Date.now()}.${ext}`, buf, {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'image/' + m[1],
    });
    return res.status(200).json({ url: b.url });
  } catch (e) {
    return res.status(500).json({ error: 'Upload gagal. Pastikan Blob sudah terhubung.' });
  }
}
