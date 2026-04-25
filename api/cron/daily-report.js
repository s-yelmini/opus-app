const KV_URL      = process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN    = process.env.UPSTASH_REDIS_REST_TOKEN;
const RESEND_KEY  = process.env.RESEND_API_KEY;
const TO_EMAIL    = process.env.REPORT_EMAIL || 'syelmini@gmail.com';
const FROM_EMAIL  = process.env.REPORT_FROM  || 'Opus <onboarding@resend.dev>';

const PRIORITY_ICON = { p1: '[!]', p2: '[+]', p3: '[ ]', p4: '[-]' };

function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function fmtList(arr) {
  if (!arr.length) return '  —';
  return arr
    .map(t => `  ${PRIORITY_ICON[t.priority] || '[ ]'} ${t.text}`)
    .join('\n');
}

export default async function handler(req, res) {
  if (!KV_URL || !KV_TOKEN || !RESEND_KEY) {
    return res.status(500).json({ error: 'Missing env vars: KV_REST_API_URL, KV_REST_API_TOKEN, RESEND_API_KEY' });
  }

  // Read task data from KV
  const kvRes = await fetch(`${KV_URL}/get/opus_data`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  if (!kvRes.ok) return res.status(500).json({ error: 'KV read failed' });

  const kvJson = await kvRes.json();
  const raw = kvJson.result;
  if (!raw) return res.status(200).json({ ok: true, skipped: 'no data synced yet' });

  const { tasks = [] } = JSON.parse(raw);
  const today = new Date().toISOString().split('T')[0];

  const todayTasks  = tasks.filter(t => !t.done && !t.inbox && t.day === today);
  const overdue     = tasks.filter(t => !t.done && !t.inbox && t.day && t.day < today);
  const upcoming    = tasks.filter(t => !t.done && !t.inbox && t.day && t.day > today).slice(0, 8);

  const body = `Opus — ${fmtDate(today)}
${'─'.repeat(32)}

HOY (${todayTasks.length})
${fmtList(todayTasks)}

VENCIDOS (${overdue.length})
${fmtList(overdue)}

PRÓXIMOS (${upcoming.length})
${fmtList(upcoming)}

${'─'.repeat(32)}
[!] urgente  [+] alto  [ ] medio  [-] bajo
`;

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: `Opus ${fmtDate(today)} — ${todayTasks.length} hoy · ${overdue.length} vencidos`,
      text: body,
    }),
  });

  if (!emailRes.ok) {
    const err = await emailRes.text();
    return res.status(500).json({ error: err });
  }

  return res.status(200).json({ ok: true });
}
