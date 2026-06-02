-- Exercise library expansion: Olympic lifting, Neck/Forearm, Cardio, Mobility

INSERT INTO exercises (name, category, muscle_primary, muscle_secondary, equipment, is_custom, user_id) VALUES
-- ── Olympic Lifting ────────────────────────────────────────────────────────────
('Clean',              'olympic',  'glutes',         ARRAY['hamstrings','traps','core'],          'barbell',   false, null),
('Power Clean',        'olympic',  'glutes',         ARRAY['hamstrings','traps','quads'],         'barbell',   false, null),
('Snatch',             'olympic',  'glutes',         ARRAY['hamstrings','shoulders','traps'],     'barbell',   false, null),
('Power Snatch',       'olympic',  'glutes',         ARRAY['hamstrings','shoulders','traps'],     'barbell',   false, null),
('Clean and Jerk',     'olympic',  'glutes',         ARRAY['hamstrings','shoulders','traps','quads'],'barbell',false, null),
('Hang Clean',         'olympic',  'traps',          ARRAY['hamstrings','glutes','core'],         'barbell',   false, null),
('Hang Snatch',        'olympic',  'traps',          ARRAY['hamstrings','glutes','shoulders'],    'barbell',   false, null),
('Push Press',         'olympic',  'shoulders',      ARRAY['triceps','traps','quads'],            'barbell',   false, null),
('Push Jerk',          'olympic',  'shoulders',      ARRAY['triceps','quads','core'],             'barbell',   false, null),
('Split Jerk',         'olympic',  'shoulders',      ARRAY['triceps','quads','core'],             'barbell',   false, null),
('Clean Pull',         'olympic',  'traps',          ARRAY['hamstrings','glutes','back'],         'barbell',   false, null),
('Snatch Pull',        'olympic',  'traps',          ARRAY['hamstrings','glutes','back'],         'barbell',   false, null),
('Muscle Snatch',      'olympic',  'shoulders',      ARRAY['traps','triceps'],                    'barbell',   false, null),
('Hang Power Clean',   'olympic',  'traps',          ARRAY['hamstrings','glutes','biceps'],       'barbell',   false, null),
('Behind The Neck Press','olympic','shoulders',      ARRAY['triceps','traps'],                    'barbell',   false, null),

-- ── Neck ──────────────────────────────────────────────────────────────────────
('Neck Extension (Band)',       'neck', 'neck',  ARRAY['traps'],                'band',        false, null),
('Neck Flexion (Band)',         'neck', 'neck',  ARRAY['core'],                 'band',        false, null),
('Neck Lateral Flexion',        'neck', 'neck',  ARRAY['traps'],                'band',        false, null),
('Neck Harness Extension',      'neck', 'neck',  ARRAY['traps','upper_back'],   'neck_harness',false, null),
('Plate Neck Curl',             'neck', 'neck',  ARRAY['core'],                 'plate',       false, null),

-- ── Forearms ──────────────────────────────────────────────────────────────────
('Reverse Curl (Barbell)',   'forearms','forearms',ARRAY['biceps'],              'barbell',   false, null),
('Reverse Curl (Dumbbell)', 'forearms','forearms',ARRAY['biceps'],              'dumbbell',  false, null),
('Wrist Curl (Dumbbell)',    'forearms','forearms',ARRAY[],                     'dumbbell',  false, null),
('Wrist Extension (Dumbbell)','forearms','forearms',ARRAY[],                   'dumbbell',  false, null),
('Farmer Carry',             'forearms','forearms',ARRAY['traps','core','quads'],'dumbbell', false, null),
('Dead Hang',                'forearms','forearms',ARRAY['shoulders','lats'],   'pullup_bar',false, null),
('Pinch Grip Hold',          'forearms','forearms',ARRAY[],                     'plate',     false, null),

-- ── Cardio / Conditioning ──────────────────────────────────────────────────────
('Stairmaster',    'cardio','quads',    ARRAY['glutes','calves'],               'machine',   false, null),
('Rowing Machine', 'cardio','back',     ARRAY['shoulders','quads','core'],      'machine',   false, null),
('Assault Bike',   'cardio','quads',    ARRAY['glutes','shoulders','core'],     'machine',   false, null),
('Ski Erg',        'cardio','back',     ARRAY['core','shoulders','arms'],       'machine',   false, null),
('Sled Push',      'cardio','quads',    ARRAY['glutes','core','calves'],        'sled',      false, null),
('Sled Pull',      'cardio','hamstrings',ARRAY['glutes','back'],               'sled',      false, null),
('Battle Ropes',   'cardio','shoulders',ARRAY['core','forearms'],               'battle_ropes',false,null),
('Box Jump',       'cardio','quads',    ARRAY['glutes','calves'],               'box',       false, null),
('Burpee',         'cardio','full_body',ARRAY['chest','shoulders','core'],      'bodyweight',false, null),
('Jump Rope',      'cardio','calves',   ARRAY['shoulders','quads','core'],      'jump_rope', false, null),
('Sprint Intervals','cardio','quads',   ARRAY['hamstrings','glutes','calves'],  'bodyweight',false, null),
('Treadmill Run',  'cardio','quads',    ARRAY['hamstrings','calves'],           'machine',   false, null),
('Cycling',        'cardio','quads',    ARRAY['hamstrings','glutes'],           'machine',   false, null),
('Elliptical',     'cardio','quads',    ARRAY['hamstrings','glutes','shoulders'],'machine',  false, null),

-- ── Mobility / Warm-up ────────────────────────────────────────────────────────
('90/90 Hip Stretch',      'mobility','hip_flexors',ARRAY['glutes','adductors'],'bodyweight',false,null),
('Hip Circle',             'mobility','hip_flexors',ARRAY['glutes'],            'bodyweight',false, null),
('Ankle Circle',           'mobility','calves',     ARRAY[],                   'bodyweight',false, null),
('Thoracic Rotation',      'mobility','upper_back', ARRAY['core'],             'bodyweight',false, null),
('Wall Slide',             'mobility','shoulders',  ARRAY['upper_back'],       'bodyweight',false, null),
('Scapular Push-up',       'mobility','upper_back', ARRAY['shoulders','serratus'],'bodyweight',false,null),
('Band Pull-Apart',        'mobility','upper_back', ARRAY['rear_delts'],       'band',      false, null),
('Face Pull (Light)',       'mobility','rear_delts', ARRAY['upper_back','rotator_cuff'],'cable',false,null),
('Cat-Cow',                'mobility','core',       ARRAY['upper_back'],       'bodyweight',false, null),
('World''s Greatest Stretch','mobility','hip_flexors',ARRAY['thoracic','hamstrings'],'bodyweight',false,null),
('Pigeon Pose',            'mobility','glutes',     ARRAY['hip_flexors','adductors'],'bodyweight',false,null),
('Couch Stretch',          'mobility','hip_flexors',ARRAY['quads'],            'bodyweight',false, null),
('Deep Squat Hold',        'mobility','hip_flexors',ARRAY['ankles','adductors'],'bodyweight',false,null),
('Shoulder Dislocate',     'mobility','shoulders',  ARRAY['chest','upper_back'],'band',     false, null),
('Jefferson Curl',         'mobility','hamstrings', ARRAY['lower_back'],       'dumbbell',  false, null)
ON CONFLICT (name) DO NOTHING;
