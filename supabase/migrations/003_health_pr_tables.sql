-- Personal records
CREATE TABLE IF NOT EXISTS personal_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  exercise_id uuid NOT NULL,
  pr_type text NOT NULL CHECK (pr_type IN ('load', 'reps')),
  weight_kg float8,
  reps int,
  achieved_at timestamptz NOT NULL DEFAULT now(),
  session_id uuid
);
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own PRs" ON personal_records FOR ALL USING (auth.uid() = user_id);

-- Readiness logs
CREATE TABLE IF NOT EXISTS readiness_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  logged_date date NOT NULL,
  score int NOT NULL CHECK (score BETWEEN 1 AND 10),
  note text,
  UNIQUE (user_id, logged_date)
);
ALTER TABLE readiness_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own readiness" ON readiness_logs FOR ALL USING (auth.uid() = user_id);

-- Body measurements (includes steps for daily log)
CREATE TABLE IF NOT EXISTS body_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  logged_date date NOT NULL,
  weight_kg float8,
  neck_cm float8,
  forearm_cm float8,
  calf_cm float8,
  chest_cm float8,
  waist_cm float8,
  shoulders_cm float8,
  upper_arm_cm float8,
  steps int
);
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own measurements" ON body_measurements FOR ALL USING (auth.uid() = user_id);

-- Soreness logs
CREATE TABLE IF NOT EXISTS soreness_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  logged_date date NOT NULL,
  muscle_group text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('none', 'mild', 'moderate', 'severe')),
  UNIQUE (user_id, logged_date, muscle_group)
);
ALTER TABLE soreness_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own soreness" ON soreness_logs FOR ALL USING (auth.uid() = user_id);
