-- Reduce-motion preference (default off; client also honours OS-level prefers-reduced-motion)
alter table public.profiles
  add column if not exists reduce_motion boolean not null default false;

-- Per-page react-grid-layout configs, mirroring dashboard_layout
alter table public.profiles
  add column if not exists health_layout jsonb,
  add column if not exists habits_layout jsonb,
  add column if not exists nutrition_layout jsonb;

-- Customisable bottom navigation slots (4 slugs either side of the fixed centre Home button)
alter table public.profiles
  add column if not exists bottom_nav_items text[] not null default array['workouts', 'health', 'habits', 'more'];
