INSERT INTO achievements (slug, name, description, tier, xp_reward) VALUES
  -- Squat
  ('squat_bodyweight',  'Bodyweight Squat',  'Squat your own bodyweight',         'bronze', 100),
  ('squat_1_5x',        'Strong Legs',       'Squat 1.5× your bodyweight',        'silver', 250),
  ('squat_2x',          'Squat Beast',       'Squat 2× your bodyweight',          'gold',   500),
  -- Deadlift / RDL
  ('deadlift_1x',       'First Pull',        'Deadlift your own bodyweight',       'bronze', 100),
  ('deadlift_1_75x',    'Iron Back',         'Deadlift 1.75× your bodyweight',    'silver', 300),
  ('deadlift_2_5x',     'Deadlift Titan',    'Deadlift 2.5× your bodyweight',     'gold',   750),
  -- Bench
  ('bench_0_75x',       'First Press',       'Bench press 0.75× your bodyweight', 'bronze', 100),
  ('bench_1x',          'Plate Club',        'Bench press your own bodyweight',   'silver', 250),
  ('bench_1_25x',       'Big Chest',         'Bench press 1.25× your bodyweight', 'gold',   500),
  -- Pull-up
  ('pullup_1',          'First Pull-Up',     'Complete 1 pull-up',                'bronze', 100),
  ('pullup_10',         'Ten Straight',      '10 pull-ups in one set',            'silver', 300),
  ('pullup_weighted_20','Weighted Pull',     'Weighted pull-up with 20 kg added', 'gold',   750),
  -- Session count
  ('workout_1',         'First Session',     'Complete your first workout',       'bronze',  50),
  ('workout_10',        'Ten Sessions',      'Complete 10 workouts',              'bronze', 150),
  ('workout_50',        'Fifty Sessions',    'Complete 50 workouts',              'silver', 400),
  ('workout_100',       'Century',           'Complete 100 workouts',             'gold',  1000),
  -- PRs
  ('pr_1',              'First PR',          'Set your first personal record',    'bronze', 100),
  ('pr_10',             'PR Machine',        'Set 10 personal records',           'silver', 350),
  -- Volume
  ('volume_king',       'Volume King',       'Log 10,000 kg in a single week',    'gold',  1000)
ON CONFLICT (slug) DO NOTHING;
