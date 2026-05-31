-- Add set_type and superset columns to session_sets
ALTER TABLE session_sets
  ADD COLUMN IF NOT EXISTS set_type text NOT NULL DEFAULT 'working'
    CHECK (set_type IN ('warmup', 'working', 'dropset', 'failure')),
  ADD COLUMN IF NOT EXISTS superset_group_id uuid DEFAULT NULL;
