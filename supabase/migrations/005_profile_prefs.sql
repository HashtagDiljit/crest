-- Add preference columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS weight_unit text DEFAULT 'kg',
  ADD COLUMN IF NOT EXISTS distance_unit text DEFAULT 'km',
  ADD COLUMN IF NOT EXISTS time_format text DEFAULT '24h',
  ADD COLUMN IF NOT EXISTS week_starts text DEFAULT 'monday',
  ADD COLUMN IF NOT EXISTS avatar_url text;
