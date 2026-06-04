-- ─── Performance indexes ──────────────────────────────────────────────────────
-- Dashboard and correlation queries filter heavily on (user_id, date).
-- These indexes turn full-table scans into index seeks.

CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date
  ON habit_logs(user_id, logged_date);

CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date
  ON mood_logs(user_id, logged_date);

CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date
  ON sleep_logs(user_id, logged_date);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date
  ON workout_sessions(user_id, started_at);

CREATE INDEX IF NOT EXISTS idx_session_sets_session
  ON session_sets(session_id);

CREATE INDEX IF NOT EXISTS idx_health_metrics_user_type_date
  ON health_metrics(user_id, metric_type, logged_date);


-- ─── Correlation engine server-side functions ─────────────────────────────────
-- Running these in the database avoids pulling raw rows to the application and
-- lets Postgres use the indexes above. Called via supabase.rpc().

-- Sleep → next-day mood scatter points
CREATE OR REPLACE FUNCTION get_sleep_mood_correlation(
  p_user_id uuid,
  p_days     integer DEFAULT 30
)
RETURNS TABLE(sleep_hrs float, next_day_mood float)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    s.duration_hrs::float,
    m.score::float
  FROM sleep_logs s
  JOIN mood_logs m
    ON m.user_id     = p_user_id
   AND m.logged_date = s.logged_date + 1
  WHERE s.user_id     = p_user_id
    AND s.logged_date >= CURRENT_DATE - p_days
  ORDER BY s.logged_date;
$$;

-- Training-day vs rest-day average mood
CREATE OR REPLACE FUNCTION get_training_mood_correlation(
  p_user_id uuid,
  p_days     integer DEFAULT 30
)
RETURNS TABLE(is_training_day boolean, avg_mood float, day_count bigint)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    (ws.session_date IS NOT NULL) AS is_training_day,
    AVG(m.score)::float            AS avg_mood,
    COUNT(*)                       AS day_count
  FROM mood_logs m
  LEFT JOIN LATERAL (
    SELECT date_trunc('day', started_at)::date AS session_date
    FROM workout_sessions
    WHERE user_id  = p_user_id
      AND ended_at IS NOT NULL
      AND date_trunc('day', started_at)::date = m.logged_date
    LIMIT 1
  ) ws ON true
  WHERE m.user_id     = p_user_id
    AND m.logged_date >= CURRENT_DATE - p_days
  GROUP BY is_training_day;
$$;

-- Habit-completion → mood correlation (top habits by sample size)
CREATE OR REPLACE FUNCTION get_habit_mood_correlation(
  p_user_id  uuid,
  p_days     integer DEFAULT 30,
  p_min_days integer DEFAULT 5
)
RETURNS TABLE(
  habit_id        uuid,
  habit_name      text,
  avg_mood_with    float,
  avg_mood_without float,
  completion_days  bigint
)
LANGUAGE sql SECURITY DEFINER AS $$
  WITH habit_done AS (
    SELECT hl.habit_id, hl.logged_date
    FROM habit_logs hl
    WHERE hl.user_id     = p_user_id
      AND hl.completed   = true
      AND hl.logged_date >= CURRENT_DATE - p_days
  ),
  habit_counts AS (
    SELECT habit_id, COUNT(*) AS cnt
    FROM habit_done
    GROUP BY habit_id
    HAVING COUNT(*) >= p_min_days
  ),
  mood_data AS (
    SELECT logged_date, score
    FROM mood_logs
    WHERE user_id     = p_user_id
      AND logged_date >= CURRENT_DATE - p_days
  )
  SELECT
    h.id                                           AS habit_id,
    h.name                                         AS habit_name,
    AVG(m.score) FILTER (WHERE hd.logged_date IS NOT NULL)::float AS avg_mood_with,
    AVG(m.score) FILTER (WHERE hd.logged_date IS NULL)::float     AS avg_mood_without,
    hc.cnt                                                         AS completion_days
  FROM habits h
  JOIN habit_counts hc ON hc.habit_id = h.id
  JOIN mood_data m     ON true
  LEFT JOIN habit_done hd
    ON hd.habit_id   = h.id
   AND hd.logged_date = m.logged_date
  WHERE h.user_id    = p_user_id
    AND h.archived_at IS NULL
  GROUP BY h.id, h.name, hc.cnt
  HAVING
    COUNT(m.score) FILTER (WHERE hd.logged_date IS NOT NULL) >= 3
    AND COUNT(m.score) FILTER (WHERE hd.logged_date IS NULL)  >= 3
  ORDER BY ABS(
    AVG(m.score) FILTER (WHERE hd.logged_date IS NOT NULL)
    - AVG(m.score) FILTER (WHERE hd.logged_date IS NULL)
  ) DESC NULLS LAST
  LIMIT 3;
$$;
