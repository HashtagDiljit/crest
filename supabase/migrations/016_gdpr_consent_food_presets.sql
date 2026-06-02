-- Migration 016: GDPR consent, food presets, profile improvements

-- ── GDPR Consent table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_consent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  consent_version text NOT NULL DEFAULT '2026-01',
  physical_health bool NOT NULL DEFAULT false,
  mental_emotional bool NOT NULL DEFAULT false,
  biometric bool NOT NULL DEFAULT false,
  correlation_analysis bool NOT NULL DEFAULT false,
  product_improvement bool NOT NULL DEFAULT false,
  consented_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text
);

ALTER TABLE user_consent ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_consent' AND policyname = 'Users manage own consent') THEN
    CREATE POLICY "Users manage own consent" ON user_consent FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── Food presets table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  meal_type text NOT NULL DEFAULT 'any',
  protein_g float NOT NULL DEFAULT 0,
  user_id uuid REFERENCES auth.users -- null = global, non-null = user custom
);

ALTER TABLE food_presets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'food_presets' AND policyname = 'View global and own food presets') THEN
    CREATE POLICY "View global and own food presets" ON food_presets
      FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'food_presets' AND policyname = 'Users manage own food presets') THEN
    CREATE POLICY "Users manage own food presets" ON food_presets
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── Profile improvements ───────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step_reached int DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_preferences jsonb;
