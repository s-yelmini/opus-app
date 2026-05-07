function parseCookies(header) {
  return Object.fromEntries(
    (header || '').split(';').map(c => {
      const idx = c.indexOf('=');
      return idx < 0
        ? [c.trim(), '']
        : [c.slice(0, idx).trim(), c.slice(idx + 1).trim()];
    }).filter(([k]) => k)
  );
}

export const config = {
  matcher: ['/((?!login$|api/auth).*)'],
};

export default function middleware(req) {
  const token = process.env.AUTH_TOKEN;
  if (!token) return; // auth not configured, pass through

  const cookies = parseCookies(req.headers.get('cookie'));
  if (cookies['opus_s'] === token) return; // valid session, pass through

  const { origin } = new URL(req.url);
  return Response.redirect(new URL('/login', origin));
}
