-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  display_name    text,
  avatar_url      text,
  daily_goal_minutes int default 10,
  timezone        text default 'Europe/London',
  updated_at      timestamptz default now()
);

create table if not exists public.courses (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  description  text,
  cima_paper   text,
  color_hex    text default '#0D9488',
  order_index  int default 0,
  is_published bool default false
);

create table if not exists public.modules (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  title        text not null,
  description  text,
  order_index  int default 0,
  is_published bool default true
);

create table if not exists public.lessons (
  id                 uuid primary key default gen_random_uuid(),
  module_id          uuid not null references public.modules(id) on delete cascade,
  title              text not null,
  content            jsonb default '[]',
  order_index        int default 0,
  xp_reward          int default 10,
  estimated_minutes  int default 4,
  is_published       bool default true,
  updated_at         timestamptz default now()
);

create table if not exists public.questions (
  id              uuid primary key default gen_random_uuid(),
  lesson_id       uuid not null references public.lessons(id) on delete cascade,
  question_type   text not null check (question_type in ('mcq','true_false','fill_blank','match','calculation')),
  prompt          text not null,
  options         jsonb,
  correct_answer  jsonb not null,
  explanation     text,
  order_index     int default 0
);

create table if not exists public.user_progress (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.users(id) on delete cascade,
  lesson_id            uuid not null references public.lessons(id) on delete cascade,
  status               text not null check (status in ('not_started','in_progress','completed')) default 'not_started',
  score_percent        int,
  xp_earned            int,
  attempts             int default 0,
  first_completed_at   timestamptz,
  unique(user_id, lesson_id)
);

create table if not exists public.user_xp (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  amount       int not null,
  reason       text,
  reference_id uuid,
  earned_at    timestamptz default now()
);

create table if not exists public.user_streaks (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid unique not null references public.users(id) on delete cascade,
  current_streak      int default 0,
  longest_streak      int default 0,
  last_activity_date  date
);

create table if not exists public.achievements (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  title          text not null,
  description    text,
  icon           text,
  trigger_type   text,
  trigger_value  jsonb
);

create table if not exists public.user_achievements (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at      timestamptz default now(),
  unique(user_id, achievement_id)
);

create table if not exists public.mock_exams (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  course_id           uuid references public.courses(id) on delete set null,
  started_at          timestamptz default now(),
  completed_at        timestamptz,
  time_limit_minutes  int default 90,
  score_percent       int,
  question_ids        jsonb,
  answers             jsonb,
  topic_scores        jsonb
);

create table if not exists public.ai_tutor_conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  lesson_id  uuid references public.lessons(id) on delete set null,
  messages   jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger set_lessons_updated_at
  before update on public.lessons
  for each row execute function public.set_updated_at();

create trigger set_ai_tutor_updated_at
  before update on public.ai_tutor_conversations
  for each row execute function public.set_updated_at();

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_streaks (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_xp enable row level security;
alter table public.user_streaks enable row level security;
alter table public.user_achievements enable row level security;
alter table public.mock_exams enable row level security;
alter table public.ai_tutor_conversations enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.questions enable row level security;
alter table public.achievements enable row level security;

-- Public read for course content
create policy "Public read courses"      on public.courses      for select using (true);
create policy "Public read modules"      on public.modules      for select using (true);
create policy "Public read lessons"      on public.lessons      for select using (true);
create policy "Public read questions"    on public.questions    for select using (true);
create policy "Public read achievements" on public.achievements for select using (true);

-- Users own their own rows
create policy "Users read own profile"
  on public.users for select using (auth.uid() = id);
create policy "Users update own profile"
  on public.users for update using (auth.uid() = id);

create policy "Users own progress"
  on public.user_progress for all using (auth.uid() = user_id);
create policy "Users own xp"
  on public.user_xp for all using (auth.uid() = user_id);
create policy "Users own streaks"
  on public.user_streaks for all using (auth.uid() = user_id);
create policy "Users own achievements"
  on public.user_achievements for all using (auth.uid() = user_id);
create policy "Users own exams"
  on public.mock_exams for all using (auth.uid() = user_id);
create policy "Users own conversations"
  on public.ai_tutor_conversations for all using (auth.uid() = user_id);
