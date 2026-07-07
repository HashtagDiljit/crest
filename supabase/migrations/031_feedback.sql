-- Feedback table for in-app feedback submissions
CREATE TABLE IF NOT EXISTS feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  category text,
  message text NOT NULL,
  app_version text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Referral columns on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Function to increment referrer count when a new user signs up via referral
CREATE OR REPLACE FUNCTION handle_referral()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    UPDATE profiles SET referral_count = referral_count + 1 WHERE id = NEW.referred_by;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_profile_referral
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_referral();
