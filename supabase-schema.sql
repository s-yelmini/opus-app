-- ══════════════════════════════════════════════════════════
-- Opus — Supabase Schema (v2, future migration)
-- ══════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor after enabling Auth

-- Enable RLS on all tables (rows only visible to owner)

-- ── TASKS ─────────────────────────────────────────────────
create table tasks (
  id          bigint primary key,
  user_id     uuid references auth.users not null default auth.uid(),
  text        text not null,
  priority    text not null default 'p4' check (priority in ('p1','p2','p3','p4')),
  done        boolean not null default false,
  inbox       boolean not null default false,
  day         date,
  milestone   bigint,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table tasks enable row level security;
create policy "owner" on tasks using (user_id = auth.uid());

-- ── MILESTONES ────────────────────────────────────────────
create table milestones (
  id          bigint primary key,
  user_id     uuid references auth.users not null default auth.uid(),
  name        text not null,
  color       text not null default '#5E6AD2',
  due         date,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
alter table milestones enable row level security;
create policy "owner" on milestones using (user_id = auth.uid());

-- ── HABITS ────────────────────────────────────────────────
create table habits (
  id          bigint primary key,
  user_id     uuid references auth.users not null default auth.uid(),
  name        text not null,
  color       text not null default '#5E6AD2',
  freq        int not null default 7 check (freq between 1 and 7),
  paused      boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
alter table habits enable row level security;
create policy "owner" on habits using (user_id = auth.uid());

-- ── HABIT LOGS ────────────────────────────────────────────
create table habit_logs (
  habit_id    bigint references habits not null,
  user_id     uuid references auth.users not null default auth.uid(),
  log_date    date not null,
  primary key (habit_id, log_date)
);
alter table habit_logs enable row level security;
create policy "owner" on habit_logs using (user_id = auth.uid());

-- ── SAVED VIEWS ───────────────────────────────────────────
create table saved_views (
  id          bigint primary key,
  user_id     uuid references auth.users not null default auth.uid(),
  name        text not null,
  view        text not null,
  filters     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
alter table saved_views enable row level security;
create policy "owner" on saved_views using (user_id = auth.uid());

-- ── SNAPSHOTS (daily report sync, no auth required) ──────
create table if not exists snapshots (
  key        text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
-- No RLS: protected server-side via service role key only

-- ── UPDATED_AT trigger ────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger tasks_updated_at before update on tasks
  for each row execute function update_updated_at();
