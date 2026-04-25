const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-4-5';

const PROMPTS = {

  'smart-add': ({ input, weekDays }) => ({
    system: `You are a task parser for a personal productivity app.
Extract structured task data from natural language input.
Today is ${new Date().toISOString().split('T')[0]}.
Current week days: ${JSON.stringify(weekDays)}.
Respond ONLY with valid JSON, no markdown:
{
  "text": "clean concise task title",
  "priority": "p1|p2|p3|p4",
  "day": "YYYY-MM-DD or null",
  "reasoning": "one short sentence"
}
Priority: p1=urgent/today, p2=high/this week, p3=medium, p4=low/no deadline.
Day: extract specific days mentioned. null if none.`,
    user: input
  }),

  'triage': ({ tasks, weekDays }) => ({
    system: `You are a productivity assistant triaging a task inbox.
Today is ${new Date().toISOString().split('T')[0]}.
Current week: ${JSON.stringify(weekDays)}.
Respond ONLY with a valid JSON array, no markdown:
[{ "id": <number>, "priority": "p1|p2|p3|p4", "day": "YYYY-MM-DD or null", "reasoning": "max 8 words" }]`,
    user: `Triage these tasks:\n${tasks.map(t => `ID ${t.id}: "${t.text}"`).join('\n')}`
  }),

  'brief': ({ tasks, habits, milestones, habitLogs }) => ({
    system: `You are a personal productivity assistant generating a concise daily brief.
Today is ${new Date().toISOString().split('T')[0]} (${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]}).
Be direct and concise. Max 150 words total.
Respond ONLY with valid JSON:
{
  "greeting": "one line greeting",
  "focus": "what to focus on today",
  "habits": "brief habit status",
  "milestones": "any milestones at risk or null",
  "note": "one tactical observation or null"
}`,
    user: `Tasks due today: ${JSON.stringify(tasks.filter(t => t.day === new Date().toISOString().split('T')[0] && !t.done))}
Overdue: ${JSON.stringify(tasks.filter(t => t.day && t.day < new Date().toISOString().split('T')[0] && !t.done))}
Habits: ${JSON.stringify(habits)}
Milestones: ${JSON.stringify(milestones)}
Yesterday logs: ${JSON.stringify(habitLogs)}`
  }),

  'plan': ({ input, weekDays, milestones }) => ({
    system: `You are a productivity assistant. The user will describe their upcoming week in natural language (Spanish or English).
Extract actionable tasks and return them as a structured JSON array.
Today is ${new Date().toISOString().split('T')[0]}.
Current week: ${JSON.stringify(weekDays)}.
Available milestones: ${JSON.stringify(milestones)}.

Rules:
- Extract ONLY concrete, actionable tasks (not vague intentions)
- Each task must have a clear action verb
- Infer priority from urgency/deadlines mentioned
- Match tasks to milestones when the context clearly relates
- Be specific: "Prepare Q1 report for client meeting" not "work on report"
- Write titles in the same language as the input
- Max 12 tasks

Respond ONLY with a valid JSON array, no markdown:
[{
  "title": "concise action-oriented task title",
  "priority": "p1|p2|p3|p4",
  "milestone_id": <number or null>,
  "reasoning": "one short sentence explaining why this was extracted (in same language as input)"
}]

Priority guide: p1=today/urgent deadline, p2=this week/important, p3=this week/normal, p4=whenever`,
    user: input
  }),

  'notes': ({ taskText, notes, action }) => ({
    system: `You are a writing assistant helping expand task notes.
Be concise. Plain text only, no markdown headers.
Max 200 words.
Respond ONLY with valid JSON:
{ "notes": "improved notes as plain text", "summary": "one sentence describing what you did" }`,
    user: `Task: "${taskText}"\nCurrent notes: ${notes || '(empty)'}\nAction: ${action || 'expand and structure'}`
  }),
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });

  const { action, ...payload } = req.body;
  if (!PROMPTS[action]) return res.status(400).json({ error: `Unknown action: ${action}` });

  try {
    const { system, user } = PROMPTS[action](payload);
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    try {
      return res.status(200).json({ ok: true, result: JSON.parse(text) });
    } catch {
      return res.status(200).json({ ok: true, result: text });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
