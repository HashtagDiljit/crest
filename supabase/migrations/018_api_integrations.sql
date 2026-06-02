-- Add demo_gif_url to exercises (for ExerciseDB integration)
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS demo_gif_url text;

-- Add extended nutrition fields to nutrition_logs (for USDA FoodData Central)
ALTER TABLE nutrition_logs ADD COLUMN IF NOT EXISTS calories_kcal float;
ALTER TABLE nutrition_logs ADD COLUMN IF NOT EXISTS carbs_g float;
ALTER TABLE nutrition_logs ADD COLUMN IF NOT EXISTS fat_g float;
ALTER TABLE nutrition_logs ADD COLUMN IF NOT EXISTS fdc_id text;
ALTER TABLE nutrition_logs ADD COLUMN IF NOT EXISTS barcode text;
