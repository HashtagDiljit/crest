-- Migration 029: fix exercise logging type defaults + add time_floors type
-- time_floors = time + floors/levels (stair climbers, step machines)

-- 1. Add time_floors to the CHECK constraint
alter table public.exercises drop constraint if exists exercises_logging_type_check;
alter table public.exercises
  add constraint exercises_logging_type_check
  check (logging_type in ('weight_reps', 'time_distance', 'time_reps', 'time_weight', 'time_floors'));

-- 2. time_distance: cardio machines and sports tracked by duration + distance
update public.exercises set logging_type = 'time_distance'
where lower(name) in (
  'run','treadmill','rowing','row','bicycle','elliptical',
  'swimming','sled push','sled drag','jump rope','battle rope',
  'rower','ski erg','bike','cycling','running','swim'
)
or category = 'cardio';

-- 3. time_floors: stair climber type exercises tracked by time + floors
update public.exercises set logging_type = 'time_floors'
where lower(name) in (
  'stair climber','stepper','step mill','stairmaster',
  'stair machine','step ups with timer'
);

-- 4. time_reps: isometric holds tracked by duration only
update public.exercises set logging_type = 'time_reps'
where lower(name) in (
  'plank','side plank','wall sit','dead hang','l sit hold',
  'reverse plank','straight arm plank','superman','bird dog',
  'hollow body hold','l-sit hold','l sit','tucked l-sit',
  'front lever hold','back lever hold','human flag hold',
  'ring support hold','ab wheel hold','dragon flag hold',
  'handstand hold','wall handstand hold'
);

-- 5. Everything else (barbell, dumbbell, cable, machine exercises) → weight_reps
-- Only update exercises that are not already set to a non-default type
-- and don't match the cardio/isometric patterns above
update public.exercises set logging_type = 'weight_reps'
where logging_type not in ('time_distance', 'time_reps', 'time_floors', 'time_weight')
  and category not in ('cardio');
