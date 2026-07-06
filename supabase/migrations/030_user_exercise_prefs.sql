-- Migration 030: per-user exercise logging type overrides
-- Allows users to change the logging type of global (non-custom) exercises
-- without affecting other users.

CREATE TABLE IF NOT EXISTS public.user_exercise_preferences (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  logging_type text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, exercise_id)
);

ALTER TABLE public.user_exercise_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own exercise prefs"
  ON public.user_exercise_preferences
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
