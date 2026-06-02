-- Exercise library expansion: Olympic lifting, Neck/Forearm, Cardio, Mobility

INSERT INTO exercises (name, category, muscle_primary, muscle_secondary, equipment, is_custom, user_id)
SELECT v.name, v.category, v.muscle_primary, v.muscle_secondary::text[], v.equipment, false, null
FROM (VALUES
-- ── Olympic Lifting ────────────────────────────────────────────────────────────
('Clean',                 'olympic',  'glutes',      '{hamstrings,traps,core}',               'barbell'),
('Power Clean',           'olympic',  'glutes',      '{hamstrings,traps,quads}',              'barbell'),
('Snatch',                'olympic',  'glutes',      '{hamstrings,shoulders,traps}',          'barbell'),
('Power Snatch',          'olympic',  'glutes',      '{hamstrings,shoulders,traps}',          'barbell'),
('Clean and Jerk',        'olympic',  'glutes',      '{hamstrings,shoulders,traps,quads}',    'barbell'),
('Hang Clean',            'olympic',  'traps',       '{hamstrings,glutes,core}',              'barbell'),
('Hang Snatch',           'olympic',  'traps',       '{hamstrings,glutes,shoulders}',         'barbell'),
('Push Press',            'olympic',  'shoulders',   '{triceps,traps,quads}',                 'barbell'),
('Push Jerk',             'olympic',  'shoulders',   '{triceps,quads,core}',                  'barbell'),
('Split Jerk',            'olympic',  'shoulders',   '{triceps,quads,core}',                  'barbell'),
('Clean Pull',            'olympic',  'traps',       '{hamstrings,glutes,back}',              'barbell'),
('Snatch Pull',           'olympic',  'traps',       '{hamstrings,glutes,back}',              'barbell'),
('Muscle Snatch',         'olympic',  'shoulders',   '{traps,triceps}',                       'barbell'),
('Hang Power Clean',      'olympic',  'traps',       '{hamstrings,glutes,biceps}',            'barbell'),
('Behind The Neck Press', 'olympic',  'shoulders',   '{triceps,traps}',                       'barbell'),
-- ── Neck ──────────────────────────────────────────────────────────────────────
('Neck Extension (Band)',  'neck', 'neck', '{traps}',            'band'),
('Neck Flexion (Band)',    'neck', 'neck', '{core}',             'band'),
('Neck Lateral Flexion',  'neck', 'neck', '{traps}',            'band'),
('Neck Harness Extension','neck', 'neck', '{traps,upper_back}', 'neck_harness'),
('Plate Neck Curl',       'neck', 'neck', '{core}',             'plate'),
-- ── Forearms ──────────────────────────────────────────────────────────────────
('Reverse Curl (Barbell)',    'forearms','forearms','{biceps}',              'barbell'),
('Reverse Curl (Dumbbell)',   'forearms','forearms','{biceps}',              'dumbbell'),
('Wrist Curl (Dumbbell)',     'forearms','forearms','{}',                    'dumbbell'),
('Wrist Extension (Dumbbell)','forearms','forearms','{}',                    'dumbbell'),
('Farmer Carry',              'forearms','forearms','{traps,core,quads}',    'dumbbell'),
('Dead Hang',                 'forearms','forearms','{shoulders,lats}',      'pullup_bar'),
('Pinch Grip Hold',           'forearms','forearms','{}',                    'plate'),
-- ── Cardio / Conditioning ──────────────────────────────────────────────────────
('Stairmaster',     'cardio','quads',      '{glutes,calves}',              'machine'),
('Rowing Machine',  'cardio','back',       '{shoulders,quads,core}',       'machine'),
('Assault Bike',    'cardio','quads',      '{glutes,shoulders,core}',      'machine'),
('Ski Erg',         'cardio','back',       '{core,shoulders,arms}',        'machine'),
('Sled Push',       'cardio','quads',      '{glutes,core,calves}',         'sled'),
('Sled Pull',       'cardio','hamstrings', '{glutes,back}',                'sled'),
('Battle Ropes',    'cardio','shoulders',  '{core,forearms}',              'battle_ropes'),
('Box Jump',        'cardio','quads',      '{glutes,calves}',              'box'),
('Burpee',          'cardio','full_body',  '{chest,shoulders,core}',       'bodyweight'),
('Jump Rope',       'cardio','calves',     '{shoulders,quads,core}',       'jump_rope'),
('Sprint Intervals','cardio','quads',      '{hamstrings,glutes,calves}',   'bodyweight'),
('Treadmill Run',   'cardio','quads',      '{hamstrings,calves}',          'machine'),
('Cycling',         'cardio','quads',      '{hamstrings,glutes}',          'machine'),
('Elliptical',      'cardio','quads',      '{hamstrings,glutes,shoulders}','machine'),
-- ── Mobility / Warm-up ────────────────────────────────────────────────────────
('90/90 Hip Stretch',        'mobility','hip_flexors','{glutes,adductors}',          'bodyweight'),
('Hip Circle',               'mobility','hip_flexors','{glutes}',                    'bodyweight'),
('Ankle Circle',             'mobility','calves',      '{}',                          'bodyweight'),
('Thoracic Rotation',        'mobility','upper_back',  '{core}',                      'bodyweight'),
('Wall Slide',               'mobility','shoulders',   '{upper_back}',                'bodyweight'),
('Scapular Push-up',         'mobility','upper_back',  '{shoulders,serratus}',        'bodyweight'),
('Band Pull-Apart',          'mobility','upper_back',  '{rear_delts}',                'band'),
('Face Pull (Light)',         'mobility','rear_delts',  '{upper_back,rotator_cuff}',   'cable'),
('Cat-Cow',                  'mobility','core',         '{upper_back}',                'bodyweight'),
('World''s Greatest Stretch','mobility','hip_flexors', '{thoracic,hamstrings}',       'bodyweight'),
('Pigeon Pose',              'mobility','glutes',       '{hip_flexors,adductors}',     'bodyweight'),
('Couch Stretch',            'mobility','hip_flexors', '{quads}',                     'bodyweight'),
('Deep Squat Hold',          'mobility','hip_flexors', '{ankles,adductors}',          'bodyweight'),
('Shoulder Dislocate',       'mobility','shoulders',   '{chest,upper_back}',          'band'),
('Jefferson Curl',           'mobility','hamstrings',  '{lower_back}',                'dumbbell')
) AS v(name, category, muscle_primary, muscle_secondary, equipment)
WHERE NOT EXISTS (
  SELECT 1 FROM exercises e WHERE e.name = v.name
);
