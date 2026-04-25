const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  if (!KV_URL || !KV_TOKEN) return res.status(500).json({ error: 'KV not configured' });

  const { tasks = [], milestones = [] } = req.body;
  const payload = JSON.stringify({ tasks, milestones, updatedAt: new Date().toISOString() });

  const r = await fetch(`${KV_URL}/set/opus_data`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!r.ok) return res.status(500).json({ error: 'KV write failed' });
  return res.status(200).json({ ok: true });
}
