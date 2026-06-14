-- Store user preference for which sidebar/bottom-nav sections are hidden.
-- Dashboard is always shown and is never included in this array.
alter table public.profiles
  add column if not exists hidden_nav_items text[] not null default '{}';
