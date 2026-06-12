-- Exercise logging types: drive the live session UI based on how an
-- exercise is actually logged (weight+reps, time+distance, time only,
-- or time+weight).

alter table public.exercises
  add column if not exists logging_type text not null default 'weight_reps';

alter table public.exercises drop constraint if exists exercises_logging_type_check;
alter table public.exercises
  add constraint exercises_logging_type_check
  check (logging_type in ('weight_reps', 'time_distance', 'time_reps', 'time_weight'));

-- Cardio/conditioning work is tracked by duration + distance
update public.exercises set logging_type = 'time_distance' where category = 'cardio';

-- Isometric holds and static carries are tracked by duration only
update public.exercises set logging_type = 'time_reps' where name in (
  'Plank', 'Side Plank', 'Hollow Body Hold', 'Dead Hang',
  'Pinch Grip Hold', 'Deep Squat Hold'
);

-- Loaded carries are tracked by duration + weight
update public.exercises set logging_type = 'time_weight' where name in (
  'Farmer Carry'
);

-- Session sets: optional duration/distance fields for time-based logging
alter table public.session_sets
  add column if not exists duration_seconds integer,
  add column if not exists distance_km numeric(6,2);
