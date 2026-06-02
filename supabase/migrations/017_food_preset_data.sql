-- Migration 017: Global food preset library
INSERT INTO food_presets (name, category, meal_type, protein_g, user_id)
SELECT v.name, v.category, v.meal_type, v.protein_g::float, null
FROM (VALUES
-- ── South Asian ────────────────────────────────────────────────────────────────
('Chicken tikka (100g)',         'south_asian', 'any',       29),
('Lamb curry (200g)',            'south_asian', 'lunch',     26),
('Daal makhani (200g)',          'south_asian', 'any',       10),
('Chana masala (200g)',          'south_asian', 'any',       12),
('Paneer tikka (100g)',          'south_asian', 'any',       18),
('Saag paneer (200g)',           'south_asian', 'any',       14),
('Biryani with chicken (300g)', 'south_asian', 'lunch',     28),
('Tandoori chicken breast',     'south_asian', 'any',       32),
('Egg bhurji (2 eggs)',         'south_asian', 'breakfast', 14),
('Lassi (300ml)',               'south_asian', 'any',        9),
('Dahi / yogurt (200g)',        'south_asian', 'any',       12),
-- ── UK staples ─────────────────────────────────────────────────────────────────
('Chicken breast (150g)',       'uk',          'any',       44),
('Salmon fillet (150g)',        'uk',          'any',       35),
('Tuna steak (150g)',           'uk',          'any',       38),
('Cottage cheese (200g)',       'uk',          'any',       24),
('Skyr (170g)',                 'uk',          'breakfast', 17),
('Whole milk (300ml)',          'uk',          'any',       10),
('Cheddar cheese (30g)',        'uk',          'any',        8),
('Baked beans (200g)',          'uk',          'any',       10),
('Beef mince 5% fat (150g)',   'uk',          'any',       36),
('Turkey breast (150g)',        'uk',          'any',       42),
('Tofu firm (150g)',            'uk',          'any',       18),
('Tempeh (100g)',               'uk',          'any',       19),
-- ── Supplements ────────────────────────────────────────────────────────────────
('Whey protein shake (30g)',    'supplement',  'any',       24),
('Casein shake (30g scoop)',    'supplement',  'any',       24),
('Mass gainer (100g)',          'supplement',  'any',       15),
('Creatine monohydrate (5g)',   'supplement',  'any',        0),
('Pre-workout',                'supplement',  'any',        0)
) AS v(name, category, meal_type, protein_g)
WHERE NOT EXISTS (SELECT 1 FROM food_presets fp WHERE fp.name = v.name AND fp.user_id IS NULL);
