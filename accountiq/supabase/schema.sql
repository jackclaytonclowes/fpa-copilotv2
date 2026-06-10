-- AccountIQ — additive schema (safe to run alongside existing tables)
-- Run in Supabase Dashboard → SQL Editor → New query
--
-- This only adds two new tables. Your existing tables are untouched:
--   users, courses, modules, lessons, questions,
--   user_progress, user_xp, user_streaks, user_achievements,
--   mock_exams, ai_tutor_conversations, achievements
--
-- Existing users can sign in immediately — no changes to auth.

-- ── user_state ────────────────────────────────────────────────────────────────
-- Stores the full AccountIQStore JSON blob per user.
-- XP and streak are read from the existing user_xp / user_streaks tables
-- at login time and merged in, so legacy progress carries over automatically.

create table if not exists public.user_state (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  state       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.user_state enable row level security;

create policy "select_own" on public.user_state
  for select using (auth.uid() = user_id);

create policy "insert_own" on public.user_state
  for insert with check (auth.uid() = user_id);

create policy "update_own" on public.user_state
  for update using (auth.uid() = user_id);
