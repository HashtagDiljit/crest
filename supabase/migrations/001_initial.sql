-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  username       text,
  level          integer not null default 1,
  xp             integer not null default 0,
  streak_current integer not null default 0,
  streak_best    integer not null default 0,
  theme          text,
  accent_colour  text,
  created_at     timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- WORKOUTS
-- ============================================================
create table public.workout_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  category    text,
  icon_colour text
);

alter table public.workout_templates enable row level security;

create policy "Users can manage own templates"
  on public.workout_templates for all
  using (auth.uid() = user_id);

create table public.exercises (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  category         text,
  muscle_primary   text,
  muscle_secondary text[],
  equipment        text,
  is_custom        boolean not null default false,
  user_id          uuid references auth.users(id) on delete cascade
);

alter table public.exercises enable row level security;

create policy "Users can view global and own exercises"
  on public.exercises for select
  using (is_custom = false or auth.uid() = user_id);

create policy "Users can manage own custom exercises"
  on public.exercises for insert
  with check (is_custom = true and auth.uid() = user_id);

create policy "Users can update own custom exercises"
  on public.exercises for update
  using (is_custom = true and auth.uid() = user_id);

create policy "Users can delete own custom exercises"
  on public.exercises for delete
  using (is_custom = true and auth.uid() = user_id);

create table public.template_exercises (
  id            uuid primary key default gen_random_uuid(),
  template_id   uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id   uuid not null references public.exercises(id) on delete cascade,
  sets_target   integer,
  reps_target   integer,
  order_index   integer not null
);

alter table public.template_exercises enable row level security;

create policy "Users can manage own template exercises"
  on public.template_exercises for all
  using (
    exists (
      select 1 from public.workout_templates t
      where t.id = template_id and t.user_id = auth.uid()
    )
  );

create table public.workout_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  template_id uuid references public.workout_templates(id) on delete set null,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  notes       text,
  xp_earned   integer not null default 0
);

alter table public.workout_sessions enable row level security;

create policy "Users can manage own sessions"
  on public.workout_sessions for all
  using (auth.uid() = user_id);

create table public.session_sets (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id  uuid not null references public.exercises(id) on delete cascade,
  set_number   integer not null,
  weight_kg    numeric(6,2),
  reps         integer,
  rpe          numeric(3,1),
  completed_at timestamptz not null default now()
);

alter table public.session_sets enable row level security;

create policy "Users can manage own session sets"
  on public.session_sets for all
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- ============================================================
-- HABITS
-- ============================================================
create table public.habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  category    text,
  frequency   text,
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);

alter table public.habits enable row level security;

create policy "Users can manage own habits"
  on public.habits for all
  using (auth.uid() = user_id);

create table public.habit_logs (
  id          uuid primary key default gen_random_uuid(),
  habit_id    uuid not null references public.habits(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  logged_date date not null,
  completed   boolean not null default true,
  unique(habit_id, logged_date)
);

alter table public.habit_logs enable row level security;

create policy "Users can manage own habit logs"
  on public.habit_logs for all
  using (auth.uid() = user_id);

-- ============================================================
-- HEALTH
-- ============================================================
create table public.sleep_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  logged_date   date not null,
  duration_hrs  numeric(4,2),
  quality_score integer check (quality_score between 1 and 5),
  bedtime       time,
  wake_time     time,
  unique(user_id, logged_date)
);

alter table public.sleep_logs enable row level security;

create policy "Users can manage own sleep logs"
  on public.sleep_logs for all
  using (auth.uid() = user_id);

create table public.mood_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  logged_date date not null,
  score       integer check (score between 1 and 5),
  note        text,
  unique(user_id, logged_date)
);

alter table public.mood_logs enable row level security;

create policy "Users can manage own mood logs"
  on public.mood_logs for all
  using (auth.uid() = user_id);

create table public.health_metrics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  logged_date date not null,
  metric_type text not null,
  value       numeric(10,3) not null,
  unit        text
);

alter table public.health_metrics enable row level security;

create policy "Users can manage own health metrics"
  on public.health_metrics for all
  using (auth.uid() = user_id);

-- ============================================================
-- JOURNAL
-- ============================================================
create table public.journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  logged_date date not null,
  body        text not null,
  tags        text[]
);

alter table public.journal_entries enable row level security;

create policy "Users can manage own journal entries"
  on public.journal_entries for all
  using (auth.uid() = user_id);

-- ============================================================
-- GOALS
-- ============================================================
create table public.goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  category     text,
  target_date  date,
  progress     numeric(5,2) not null default 0,
  completed_at timestamptz
);

alter table public.goals enable row level security;

create policy "Users can manage own goals"
  on public.goals for all
  using (auth.uid() = user_id);

create table public.goal_milestones (
  id           uuid primary key default gen_random_uuid(),
  goal_id      uuid not null references public.goals(id) on delete cascade,
  title        text not null,
  completed_at timestamptz
);

alter table public.goal_milestones enable row level security;

create policy "Users can manage own goal milestones"
  on public.goal_milestones for all
  using (
    exists (
      select 1 from public.goals g
      where g.id = goal_id and g.user_id = auth.uid()
    )
  );

-- ============================================================
-- GAMIFICATION
-- ============================================================
create table public.achievements (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  tier        text check (tier in ('bronze', 'silver', 'gold')),
  xp_reward   integer not null default 0
);

create table public.user_achievements (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  unique(user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

create policy "Users can view own achievements"
  on public.user_achievements for select
  using (auth.uid() = user_id);

create policy "Users can insert own achievements"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);
