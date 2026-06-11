-- AccountIQ database schema
-- Run this in Supabase SQL editor (Dashboard → SQL Editor → New query)

-- ── User state ────────────────────────────────────────────────────────────────
-- Stores the entire aiq_state JSON blob per user (mirrors AccountIQStore.js shape)
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

-- ── Tutor conversations ───────────────────────────────────────────────────────
create table if not exists public.tutor_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  messages    jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.tutor_conversations enable row level security;

create policy "select_own" on public.tutor_conversations
  for select using (auth.uid() = user_id);

create policy "insert_own" on public.tutor_conversations
  for insert with check (auth.uid() = user_id);

create policy "update_own" on public.tutor_conversations
  for update using (auth.uid() = user_id);
