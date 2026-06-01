ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS height_cm           numeric(5,1),
  ADD COLUMN IF NOT EXISTS date_of_birth       date,
  ADD COLUMN IF NOT EXISTS gender              text,
  ADD COLUMN IF NOT EXISTS training_experience text;
