const SUPABASE_URL  = process.env.SUPABASE_URL;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://opus-code.vercel.app';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(500).json({ error: 'Supabase not configured' });

  const body = req.body || {};
  const tasks     = Array.isArray(body.tasks)      ? body.tasks.slice(0, 2000)     : [];
  const milestones = Array.isArray(body.milestones) ? body.milestones.slice(0, 200) : [];

  const r = await fetch(`${SUPABASE_URL}/rest/v1/snapshots`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      key:  'main',
      data: { tasks, milestones, updatedAt: new Date().toISOString() },
    }),
  });

  if (!r.ok) return res.status(500).json({ error: 'Supabase write failed' });
  return res.status(200).json({ ok: true });
}
