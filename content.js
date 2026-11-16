import { put, list } from '@vercel/blob';
import { verifyCookie } from './_lib.js';

const KEY = 'site/content.json';
const IMG = /^(https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/|data:image\/(jpeg|png|webp);base64,)/i;
const str = (v, n) => String(v == null ? '' : v).slice(0, n);
const id = (v) => str(v, 40).replace(/[^a-z0-9]/gi, '') || Math.random().toString(36).slice(2, 10);
const img = (v) => (typeof v === 'string' && v.length < 1.5e6 && IMG.test(v) ? v : undefined);
const arr = (v, n) => (Array.isArray(v) ? v.slice(0, n) : []);

function clean(b) {
  const posts = arr(b.posts, 200).map((p) => {
    const o = { t: str(p.t, 60), h: str(p.h, 200), s: str(p.s, 400), b: str(p.b, 60000), d: str(p.d, 40), m: Math.max(1, Math.min(999, +p.m || 1)), id: id(p.id) };
    const i = img(p.img); if (i) o.img = i;
    return o;
  });
  const works = arr(b.works, 200).map((w) => {
    const o = { c: str(w.c, 60), h: str(w.h, 200), s: str(w.s, 200), b: str(w.b, 20000), id: id(w.id) };
    const i = img(w.img); if (i) o.img = i;
    if (Number.isInteger(w.g) && w.g >= 0 && w.g < 100) o.g = w.g;
    return o;
  });
  const t = b.tl || {};
  const tl = {
    tl: arr(t.tl, 100).map((x) => ({ id: id(x.id), y: str(x.y, 40), h: str(x.h, 200), b: str(x.b, 2000) })),
    now: arr(t.now, 50).map((x) => ({ id: id(x.id), t: str(x.t, 200), p: Math.max(0, Math.min(100, +x.p || 0)), n: str(x.n, 500) })),
  };
  return { posts, works, tl };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: KEY, limit: 1 });
      if (!blobs.length) return res.status(200).json({ empty: true });
      const r = await fetch(blobs[0].url + '?t=' + Date.now());
      if (!r.ok) return res.status(200).json({ empty: true });
      return res.status(200).json(await r.json());
    } catch (e) {
      return res.status(200).json({ empty: true, error: 'blob' });
    }
  }

  if (req.method === 'PUT') {
    if (!verifyCookie(req)) return res.status(401).json({ error: 'Belum login atau sesi habis.' });
    if (!req.body || typeof req.body !== 'object') return res.status(400).json({ error: 'Data tidak valid.' });
    try {
      await put(KEY, JSON.stringify(clean(req.body)), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 60,
      });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'Gagal menyimpan. Pastikan Blob sudah terhubung ke project ini.' });
    }
  }

  res.status(405).end();
}
