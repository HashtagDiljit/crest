-- Focus mode and training block columns for profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_focus text,
  ADD COLUMN IF NOT EXISTS focus_start_date date,
  ADD COLUMN IF NOT EXISTS focus_end_date date,
  ADD COLUMN IF NOT EXISTS focus_checkins jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS current_training_block text,
  ADD COLUMN IF NOT EXISTS block_start_date date;
