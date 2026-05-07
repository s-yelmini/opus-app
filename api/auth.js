const COOKIE = (val, maxAge) =>
  `opus_s=${val}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;

export default function handler(req, res) {
  const AUTH_PASSWORD = process.env.AUTH_PASSWORD;
  const AUTH_TOKEN    = process.env.AUTH_TOKEN;

  // Logout
  if (req.method === 'GET' && req.query.logout === '1') {
    res.setHeader('Set-Cookie', COOKIE('', 0));
    return res.redirect('/login');
  }

  if (req.method !== 'POST') return res.status(405).end();
  if (!AUTH_PASSWORD || !AUTH_TOKEN)
    return res.status(500).json({ error: 'Auth not configured on server' });

  const { password } = req.body || {};
  if (!password || password !== AUTH_PASSWORD)
    return res.status(401).json({ error: 'Contraseña incorrecta' });

  res.setHeader('Set-Cookie', COOKIE(AUTH_TOKEN, 60 * 60 * 24 * 30)); // 30 days
  return res.status(200).json({ ok: true });
}
