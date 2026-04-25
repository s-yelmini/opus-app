# Opus — Claude Code Project

## What is this
Personal productivity app — single HTML file with vanilla JS. No framework, no build step.

## Stack
- **Frontend**: `index.html` — single file, all CSS + JS inline
- **Backend**: `api/claude.js` — Vercel serverless function, proxies Anthropic API
- **Deploy**: Vercel (static + serverless)
- **Future DB**: Supabase (schema in `supabase-schema.sql`, not yet integrated)

## Running locally
```bash
npm install -g vercel
ANTHROPIC_API_KEY=sk-ant-... vercel dev
# Opens at http://localhost:3000
```

Or just open `index.html` directly in a browser — all features work except AI (requires `/api/claude` endpoint).

## Project structure
```
opus/
├── index.html          # The entire app (HTML + CSS + JS, ~160KB)
├── api/
│   └── claude.js       # Vercel serverless — Anthropic API proxy
├── vercel.json         # Routing config
├── supabase-schema.sql # DB schema for future Supabase migration
└── CLAUDE.md           # This file
```

## Design system
**Technical Noir** — dark mode, high density.

CSS variables in `:root`:
- `--bg: #121319` — app background
- `--surface / --surface2 / --surface3` — layered surfaces
- `--border / --border2: #454652` — borders
- `--text / --text-2 / --text-3` — text hierarchy
- `--accent: #5e6ad2` — primary indigo
- `--accent-violet: #7c3aed` — secondary violet
- `--red / --orange / --yellow / --green` — semantic colors
- `--radius / --radius-lg / --radius-xl` — 6px / 8px / 12px

Fonts: **Geist** (body), **Geist Mono** (labels, IDs, inputs, metadata)

## State (localStorage)
- `tasks_v4` — tasks array
- `milestones_v1` — milestones array
- `habits_v2` + `habit_logs_v2` — habits and logs
- `saved_views_v1` — custom saved filter views

## Task schema
```js
{
  id: number,
  text: string,
  priority: 'p1'|'p2'|'p3'|'p4',
  done: boolean,
  inbox: boolean,        // true = in Triage inbox
  day: 'YYYY-MM-DD'|null,
  milestone: number|null,
  notes: string|null,
}
```

## Key functions
- `addTask(text, priority, day, inbox)` — create task
- `updateTask(id, changes)` — patch task fields
- `deleteTask(id)` — delete task
- `switchView(v)` — navigate: 'triage'|'list'|'week'|'milestones'|'habits'
- `renderAll()` — re-render current view + badges
- `toggleGeneratePanel(open)` — show/hide AI generate textarea in Triage
- `callClaude(action, payload)` — calls `/api/claude` (requires deploy)

## AI actions (api/claude.js)
- `smart-add` — parse natural language → structured task
- `triage` — suggest priority + day for inbox items
- `plan` — free text → array of issues (used by Generar issues)
- `notes` — expand task notes

## Views
- **Triage** — inbox + AI generate panel (✦ Generar issues)
- **List** — all non-inbox tasks, grouped Todo/Done, with filters
- **Week** — calendar grid Mon–Sun, unscheduled bar at bottom
- **Milestones** — table rows, expandable issues
- **Habits** — week/month/year views with heatmap

## Known issues / next steps
- AI features only work when deployed to Vercel with `ANTHROPIC_API_KEY`
- `smartAdd` currently falls back to plain `addTask` (no AI locally)
- Supabase integration not yet built — all data in localStorage
- No auth — single user app

## Deploy
```bash
vercel
# Add ANTHROPIC_API_KEY in Vercel dashboard → Settings → Environment Variables
vercel --prod
```
