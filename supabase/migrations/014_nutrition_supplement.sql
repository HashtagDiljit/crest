-- Add new columns to existing nutrition_logs table
ALTER TABLE nutrition_logs
  ADD COLUMN IF NOT EXISTS meal_type        text,
  ADD COLUMN IF NOT EXISTS is_preset        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS portion_multiplier float4 DEFAULT 1.0;

-- Supplement logs
CREATE TABLE IF NOT EXISTS supplement_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users NOT NULL,
  supplement_name  text NOT NULL,
  logged_date      date NOT NULL,
  taken_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, supplement_name, logged_date)
);
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own supplements" ON supplement_logs;
CREATE POLICY "Users manage own supplements" ON supplement_logs FOR ALL USING (auth.uid() = user_id);

-- Add nutrition_settings column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS nutrition_settings jsonb DEFAULT '{
    "protein_target": 150,
    "meals_per_day": 4,
    "supplements": {
      "Vitamin D": true,
      "Omega-3": true,
      "Whey protein": true,
      "Magnesium glycinate": true
    }
  }';
