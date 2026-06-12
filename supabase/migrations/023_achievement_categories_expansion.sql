-- Trophy Room expansion: categorise all achievements and add a wide set of
-- new achievements across Consistency, Workout, Strength, Health, Nutrition
-- and Mindset categories.

alter table public.achievements
  add column if not exists category text;

-- Categorise existing achievements (migration 004)
update public.achievements set category = 'workout'     where slug = 'first-five';
update public.achievements set category = 'consistency' where slug = 'seven-day-streak';
update public.achievements set category = 'health'      where slug = 'early-riser';
update public.achievements set category = 'mindset'     where slug = 'mood-tracker';
update public.achievements set category = 'health'      where slug = 'hydrated';
update public.achievements set category = 'mindset'     where slug = 'note-taker';
update public.achievements set category = 'consistency' where slug = 'thirty-day-streak';
update public.achievements set category = 'workout'     where slug = 'strong-fifty';
update public.achievements set category = 'health'      where slug = 'sleep-architect';
update public.achievements set category = 'consistency' where slug = 'habit-completionist';
update public.achievements set category = 'workout'     where slug = 'pr-machine';
update public.achievements set category = 'workout'     where slug = 'century-club';
update public.achievements set category = 'consistency' where slug = 'iron-will';
update public.achievements set category = 'consistency' where slug = 'five-hundred-streak';

-- Categorise existing achievements (migration 013)
update public.achievements set category = 'strength' where slug in (
  'squat_bodyweight', 'squat_1_5x', 'squat_2x',
  'deadlift_1x', 'deadlift_1_75x', 'deadlift_2_5x',
  'bench_0_75x', 'bench_1x', 'bench_1_25x',
  'pullup_1', 'pullup_10', 'pullup_weighted_20'
);
update public.achievements set category = 'workout' where slug in (
  'workout_1', 'workout_10', 'workout_50', 'workout_100',
  'pr_1', 'pr_10', 'volume_king'
);

-- New achievements
insert into public.achievements (slug, name, description, tier, xp_reward, category) values
  -- Consistency
  ('first-step',        'First Step',        'Log any activity for the first time',                'bronze', 25,  'consistency'),
  ('three-day-streak',  'Three-Day Streak',  '3 consecutive days with any log entry',               'bronze', 50,  'consistency'),
  ('two-weeks-strong',  'Two Weeks Strong',  '14 consecutive days with any log entry',              'silver', 200, 'consistency'),
  ('quarter-century',   'Quarter Century',   '25 consecutive days with any log entry',              'silver', 300, 'consistency'),
  ('centurion',         'Centurion',         '100 consecutive days with any log entry',             'gold',   600, 'consistency'),
  ('iron-discipline',   'Iron Discipline',   '200 consecutive days with any log entry',             'gold',   750, 'consistency'),
  ('supplement-starter','Supplement Starter','Take a logged supplement 3 days in a row',            'bronze', 75,  'consistency'),

  -- Workout
  ('first-rep',         'First Rep',         'Log your first set',                                  'bronze', 25,  'workout'),
  ('template-builder',  'Template Builder',  'Create your first workout template',                  'bronze', 50,  'workout'),
  ('twenty-sessions',   'Twenty Sessions',   'Complete 20 workout sessions',                        'bronze', 150, 'workout'),
  ('volume-week',       'Volume Week',       'Lift 5,000 kg total volume in a single week',         'silver', 250, 'workout'),
  ('two-hundred',       'Two Hundred',       'Complete 200 workout sessions',                       'gold',   1200,'workout'),
  ('pr-legend',         'PR Legend',         'Set 25 personal records',                             'gold',   800, 'workout'),

  -- Strength
  ('ohp_0_5x',          'Shoulder Starter',  'Overhead press 0.5× your bodyweight',                 'bronze', 100, 'strength'),
  ('pushup_25',         'Push Power',        '25 push-ups in one set',                              'bronze', 100, 'strength'),
  ('row_1x',            'Iron Row',          'Row your own bodyweight',                             'silver', 250, 'strength'),
  ('dip_15',            'Dip Master',        '15 dips in one set',                                  'silver', 300, 'strength'),
  ('ohp_0_75x',         'Overhead Beast',    'Overhead press 0.75× your bodyweight',                'gold',   600, 'strength'),
  ('row_1_5x',          'Row Champion',      'Row 1.5× your bodyweight',                            'gold',   700, 'strength'),

  -- Health
  ('early-data',        'Early Data',        'Log your first health metric',                        'bronze', 50,  'health'),
  ('step-counter',      'Step Counter',      'Log your daily steps for 5 days',                     'bronze', 75,  'health'),
  ('ten-k-steps',       '10K Steps',         'Hit 10,000 steps in a single day',                    'silver', 200, 'health'),
  ('recovery-king',     'Recovery King',     'Log HRV for 7 consecutive days',                      'silver', 250, 'health'),
  ('sleep-champion',    'Sleep Champion',    'Hit an 8-hour sleep target for 30 days',              'gold',   500, 'health'),
  ('optimal-hrv',       'Optimal HRV',       'Record an HRV reading above 60ms',                    'gold',   400, 'health'),

  -- Nutrition
  ('protein-start',     'Protein Start',     'Log your first nutrition entry',                      'bronze', 50,  'nutrition'),
  ('three-meals',       'Three Meals',       'Log 3 meals in a single day',                         'bronze', 75,  'nutrition'),
  ('supplement-streak', 'Supplement Streak', 'Take logged supplements for 7 consecutive days',      'silver', 200, 'nutrition'),
  ('protein-week',      'Protein Week',      'Hit your protein target on 7 days',                   'silver', 250, 'nutrition'),
  ('supplement-month',  'Supplement Month',  'Take logged supplements for 30 consecutive days',     'gold',   500, 'nutrition'),
  ('protein-champion',  'Protein Champion',  'Hit your protein target on 30 days',                  'gold',   600, 'nutrition'),

  -- Mindset
  ('first-thought',     'First Thought',     'Write your first journal entry',                      'bronze', 25,  'mindset'),
  ('mood-awareness',    'Mood Awareness',    'Log your mood 10 times',                              'bronze', 75,  'mindset'),
  ('goal-setter',       'Goal Setter',       'Create your first goal',                              'bronze', 50,  'mindset'),
  ('journal-habit',     'Journal Habit',     'Write 20 journal entries',                            'silver', 200, 'mindset'),
  ('mood-month',        'Mood Month',        'Log your mood on 30 days',                            'silver', 250, 'mindset'),
  ('goal-achiever',     'Goal Achiever',     'Complete your first goal',                            'silver', 200, 'mindset'),
  ('mood-master',       'Mood Master',       'Log your mood on 100 days',                           'gold',   500, 'mindset')
on conflict (slug) do nothing;
