-- Nutrition logs
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  logged_date date NOT NULL,
  meal_name text,
  protein_g float8,
  food_preset text,
  notes text,
  logged_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own nutrition" ON nutrition_logs FOR ALL USING (auth.uid() = user_id);

-- Seed achievement definitions
INSERT INTO achievements (slug, name, description, tier, xp_reward) VALUES
  ('first-five',            'First Five',           'Complete 5 workout sessions',                        'bronze', 100),
  ('seven-day-streak',      '7-Day Streak',         '7 consecutive days with any log entry',              'bronze', 100),
  ('early-riser',           'Early Riser',          'Log sleep before 23:00 for 5 days',                  'bronze', 100),
  ('mood-tracker',          'Mood Tracker',         'Log mood for 7 consecutive days',                    'bronze', 100),
  ('hydrated',              'Hydrated',             'Log water intake for 7 consecutive days',            'bronze', 100),
  ('note-taker',            'Note Taker',           'Write 5 journal entries',                            'bronze', 100),
  ('thirty-day-streak',     '30-Day Streak',        '30 consecutive days with any log entry',             'silver', 250),
  ('strong-fifty',          'Strong Fifty',         'Complete 50 workout sessions',                       'silver', 250),
  ('sleep-architect',       'Sleep Architect',      'Hit 8-hour sleep target for 14 days',                'silver', 250),
  ('habit-completionist',   'Habit Completionist',  'Complete all habits for 7 consecutive days',         'silver', 250),
  ('pr-machine',            'PR Machine',           'Log 10 personal records',                            'silver', 250),
  ('century-club',          'Century Club',         'Complete 100 workout sessions',                      'gold',   500),
  ('iron-will',             'Iron Will',            '90-day streak',                                      'gold',   500),
  ('five-hundred-streak',   '500-Day Streak',       '500 consecutive days with any log entry',            'gold',   500)
ON CONFLICT (slug) DO NOTHING;
