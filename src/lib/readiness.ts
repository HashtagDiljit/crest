export interface ReadinessInput {
  lastSleepHrs: number | null;
  hrv: number | null;
  restingHR: number | null;
  sessionsLast3Days: number;
}

export interface ReadinessResult {
  score: number;
  label: string;
  color: string;
  sleepPts: number;
  hrvPts: number;
  rhrPts: number;
  trainingPts: number;
}

export function computeReadiness(input: ReadinessInput): ReadinessResult {
  let sleepPts = 8;
  if (input.lastSleepHrs !== null) {
    if (input.lastSleepHrs >= 8) sleepPts = 40;
    else if (input.lastSleepHrs >= 7) sleepPts = 32;
    else if (input.lastSleepHrs >= 6) sleepPts = 24;
    else if (input.lastSleepHrs >= 5) sleepPts = 16;
    else sleepPts = 8;
  }

  let hrvPts = 4;
  if (input.hrv !== null) {
    if (input.hrv >= 60) hrvPts = 20;
    else if (input.hrv >= 50) hrvPts = 16;
    else if (input.hrv >= 40) hrvPts = 12;
    else if (input.hrv >= 30) hrvPts = 8;
    else hrvPts = 4;
  }

  let rhrPts = 4;
  if (input.restingHR !== null) {
    if (input.restingHR <= 55) rhrPts = 20;
    else if (input.restingHR <= 65) rhrPts = 16;
    else if (input.restingHR <= 75) rhrPts = 12;
    else if (input.restingHR <= 85) rhrPts = 8;
    else rhrPts = 4;
  }

  let trainingPts: number;
  if (input.sessionsLast3Days === 0) trainingPts = 20;
  else if (input.sessionsLast3Days === 1) trainingPts = 16;
  else if (input.sessionsLast3Days === 2) trainingPts = 10;
  else trainingPts = 4;

  const score = sleepPts + hrvPts + rhrPts + trainingPts;

  let label: string;
  let color: string;
  if (score >= 85) { label = "Optimal"; color = "#22C55E"; }
  else if (score >= 70) { label = "Good"; color = "#6C63FF"; }
  else if (score >= 50) { label = "Moderate"; color = "#F59E0B"; }
  else if (score >= 30) { label = "Low"; color = "#FF8A3D"; }
  else { label = "Rest"; color = "#EF4444"; }

  return { score, label, color, sleepPts, hrvPts, rhrPts, trainingPts };
}
