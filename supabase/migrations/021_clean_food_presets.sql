-- Migration 021: Clean food presets — add macro columns, replace data

-- Add macro columns to food_presets
ALTER TABLE food_presets ADD COLUMN IF NOT EXISTS calories_kcal float NOT NULL DEFAULT 0;
ALTER TABLE food_presets ADD COLUMN IF NOT EXISTS carbs_g      float NOT NULL DEFAULT 0;
ALTER TABLE food_presets ADD COLUMN IF NOT EXISTS fat_g        float NOT NULL DEFAULT 0;
ALTER TABLE food_presets ADD COLUMN IF NOT EXISTS serving_g    float NOT NULL DEFAULT 100;

-- Remove all previously generated/unverified global presets
DELETE FROM food_presets WHERE user_id IS NULL;

-- Re-insert clean, verified presets
-- Values stored as per-100g; serving_g = typical serving for PortionScreen default

INSERT INTO food_presets (name, category, meal_type, protein_g, calories_kcal, carbs_g, fat_g, serving_g) VALUES

-- BREAKFAST
('Oats (dry)',                  'Breakfast',      'breakfast', 13, 389, 66, 7,  100),
('Oats with whey',              'Breakfast',      'breakfast', 29, 385, 52, 6,  130),
('Scrambled eggs ×3',           'Breakfast',      'breakfast', 12, 140,  2,10,  150),
('Greek yogurt',                'Breakfast',      'breakfast', 10,  65,  5, 2,  200),
('Skyr',                        'Breakfast',      'breakfast', 10,  59,  3, 0,  170),
('Protein shake (whey+water)',  'Breakfast',      'breakfast',  8,  43,  1, 0,  300),

-- SOUTH ASIAN
('Chicken curry with rice',     'South Asian',    'lunch',     11, 160, 18, 4,  300),
('Dal tadka with rice',         'South Asian',    'lunch',      5, 140, 28, 2,  300),
('Chana masala',                'South Asian',    'lunch',      5, 140, 18, 5,  200),
('Paneer curry',                'South Asian',    'lunch',      9, 180,  9,11,  200),
('Egg bhurji ×3',               'South Asian',    'lunch',     12, 147,  3, 9,  150),
('Chicken biryani',             'South Asian',    'lunch',     10, 173, 19, 5,  300),
('Lamb keema',                  'South Asian',    'lunch',     13, 190,  6,11,  200),
('Chapatti ×2',                 'South Asian',    'lunch',      7, 233, 40, 4,  120),
('Dal makhani',                 'South Asian',    'lunch',      5, 130, 14, 6,  200),
('Tandoori chicken breast',     'South Asian',    'lunch',     25, 147,  3, 3,  150),

-- PROTEIN SOURCES
('Chicken breast (cooked)',     'Protein sources','lunch',     29, 165,  0, 3,  150),
('Salmon fillet',               'Protein sources','lunch',     23, 187,  0, 9,  150),
('Tuna steak',                  'Protein sources','lunch',     25, 130,  0, 1,  150),
('Beef mince 5% fat (cooked)',  'Protein sources','lunch',     24, 173,  0, 8,  150),
('Turkey breast (cooked)',      'Protein sources','lunch',     28, 130,  0, 1,  150),
('Boiled eggs ×2',              'Protein sources','snack',     12, 140,  1,10,  100),
('Cottage cheese',              'Protein sources','snack',     12,  90,  3, 3,  200),
('Firm tofu',                   'Protein sources','lunch',     12,  80,  1, 5,  150),

-- SNACKS
('Whey protein shake',          'Snacks',         'snack',      8,  43,  1, 0,  300),
('Greek yogurt (snack)',        'Snacks',         'snack',     10,  67,  5, 2,  150),
('Mixed nuts (30g)',            'Snacks',         'snack',     20, 617,  7,54,   30),
('Rice cakes + peanut butter',  'Snacks',         'snack',     10, 250, 30,11,   80),
('Boiled eggs ×2 (snack)',      'Snacks',         'snack',     12, 140,  1,10,  100);
