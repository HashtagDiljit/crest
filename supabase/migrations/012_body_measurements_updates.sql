ALTER TABLE body_measurements
  ADD COLUMN IF NOT EXISTS hip_cm        float8,
  ADD COLUMN IF NOT EXISTS bf_percentage float4;
