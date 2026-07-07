-- User supplements table: replaces the JSON supplements map in nutrition_settings
CREATE TABLE IF NOT EXISTS user_supplements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE user_supplements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own supplements"
  ON user_supplements FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Seed 10 default supplements for new users (called once per user via function)
CREATE OR REPLACE FUNCTION seed_default_supplements(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_supplements (user_id, name, enabled, order_index) VALUES
    (p_user_id, 'Creatine monohydrate', true,  0),
    (p_user_id, 'Vitamin D',            true,  1),
    (p_user_id, 'Omega-3',              true,  2),
    (p_user_id, 'Whey protein',         true,  3),
    (p_user_id, 'Magnesium glycinate',  true,  4),
    (p_user_id, 'Zinc',                 false, 5),
    (p_user_id, 'Vitamin K2',           false, 6),
    (p_user_id, 'NAD+/NMN',            false, 7),
    (p_user_id, 'Ashwagandha',          false, 8),
    (p_user_id, 'Caffeine',             false, 9)
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$;
