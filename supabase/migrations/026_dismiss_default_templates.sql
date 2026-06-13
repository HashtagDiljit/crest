-- Track whether a user has deliberately cleared all their workout templates,
-- so seedDefaultTemplates() doesn't re-insert the defaults afterwards.
alter table public.profiles
  add column if not exists has_dismissed_default_templates boolean not null default false;
