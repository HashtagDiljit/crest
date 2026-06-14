"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export interface SleepLogRow {
  id: string;
  logged_date: string;
  duration_hrs: number | null;
  quality_score: number | null;
  bedtime: string | null;
  wake_time: string | null;
}

export interface ReadinessRow {
  id: string;
  logged_date: string;
  score: number;
  note: string | null;
}

export interface BodyMeasurementRow {
  id: string;
  logged_date: string;
  weight_kg: number | null;
  neck_cm: number | null;
  forearm_cm: number | null;
  calf_cm: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  shoulders_cm: number | null;
  upper_arm_cm: number | null;
  steps: number | null;
  bf_percentage: number | null;
}

export interface MetricRow {
  logged_date: string;
  value: number;
}

export interface SorenessRow {
  muscle_group: string;
  severity: string;
}

export interface VitalMetricRow {
  logged_date: string;
  metric_type: string;
  value: number;
}

export interface HealthData {
  sleepLogs: SleepLogRow[];
  readinessLogs: ReadinessRow[];
  measurements: BodyMeasurementRow[];
  hrvMetrics: MetricRow[];
  hrMetrics: MetricRow[];
  todaySoreness: SorenessRow[];
  bpMetrics: VitalMetricRow[];
  gripMetrics: MetricRow[];
  tempMetrics: MetricRow[];
  respMetrics: MetricRow[];
  gutMetrics: MetricRow[];
}

export async function getHealthData(): Promise<HealthData> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sleepLogs: [], readinessLogs: [], measurements: [], hrvMetrics: [], hrMetrics: [], todaySoreness: [], bpMetrics: [], gripMetrics: [], tempMetrics: [], respMetrics: [], gutMetrics: [] };

  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);
  const since7Str = since7.toISOString().split("T")[0];

  const since90 = new Date();
  since90.setDate(since90.getDate() - 90);
  const since90Str = since90.toISOString().split("T")[0];

  const today = new Date().toISOString().split("T")[0];

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since30Str = since30.toISOString().split("T")[0];

  const [sleepRes, readinessRes, measureRes, metricRes, sorenessRes, vitalRes] = await Promise.all([
    supabase.from("sleep_logs").select("*").eq("user_id", user.id).gte("logged_date", since7Str).order("logged_date", { ascending: false }),
    supabase.from("readiness_logs").select("*").eq("user_id", user.id).gte("logged_date", since7Str).order("logged_date", { ascending: false }),
    supabase.from("body_measurements").select("*").eq("user_id", user.id).gte("logged_date", since90Str).order("logged_date", { ascending: false }),
    supabase.from("health_metrics").select("logged_date, metric_type, value").eq("user_id", user.id).gte("logged_date", since7Str),
    supabase.from("soreness_logs").select("muscle_group, severity").eq("user_id", user.id).eq("logged_date", today),
    supabase.from("health_metrics").select("logged_date, metric_type, value").eq("user_id", user.id).gte("logged_date", since30Str).in("metric_type", ["bp_systolic", "bp_diastolic", "grip_strength_kg", "body_temp_c", "respiratory_rate", "gut_score"]).order("logged_date", { ascending: false }),
  ]);

  const metrics = (metricRes.data ?? []) as Array<{ logged_date: string; metric_type: string; value: number }>;
  const vitals = (vitalRes.data ?? []) as Array<{ logged_date: string; metric_type: string; value: number }>;

  return {
    sleepLogs: (sleepRes.data ?? []).map((l) => ({ id: l.id, logged_date: l.logged_date, duration_hrs: l.duration_hrs, quality_score: l.quality_score, bedtime: l.bedtime, wake_time: l.wake_time })),
    readinessLogs: (readinessRes.data ?? []).map((l) => ({ id: l.id, logged_date: l.logged_date, score: l.score, note: l.note })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    measurements: (measureRes.data ?? []).map((l: any) => ({
      id: l.id, logged_date: l.logged_date, weight_kg: l.weight_kg,
      neck_cm: l.neck_cm, forearm_cm: l.forearm_cm, calf_cm: l.calf_cm,
      chest_cm: l.chest_cm, waist_cm: l.waist_cm, hip_cm: l.hip_cm ?? null,
      shoulders_cm: l.shoulders_cm, upper_arm_cm: l.upper_arm_cm,
      steps: l.steps, bf_percentage: l.bf_percentage ?? null,
    })),
    hrvMetrics: metrics.filter((m) => m.metric_type === "hrv").map((m) => ({ logged_date: m.logged_date, value: m.value })),
    hrMetrics: metrics.filter((m) => m.metric_type === "resting_hr").map((m) => ({ logged_date: m.logged_date, value: m.value })),
    todaySoreness: (sorenessRes.data ?? []).map((s) => ({ muscle_group: s.muscle_group, severity: s.severity })),
    bpMetrics: vitals.filter((m) => m.metric_type === "bp_systolic" || m.metric_type === "bp_diastolic"),
    gripMetrics: vitals.filter((m) => m.metric_type === "grip_strength_kg").map((m) => ({ logged_date: m.logged_date, value: m.value })),
    tempMetrics: vitals.filter((m) => m.metric_type === "body_temp_c").map((m) => ({ logged_date: m.logged_date, value: m.value })),
    respMetrics: vitals.filter((m) => m.metric_type === "respiratory_rate").map((m) => ({ logged_date: m.logged_date, value: m.value })),
    gutMetrics: vitals.filter((m) => m.metric_type === "gut_score").map((m) => ({ logged_date: m.logged_date, value: m.value })),
  };
}

export async function logHealthMetric(metricType: string, value: number, unit?: string): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("health_metrics") as any).upsert(
    { user_id: user.id, logged_date: today, metric_type: metricType, value, unit: unit ?? null },
    { onConflict: "user_id,logged_date,metric_type" }
  );
  if (error) return { error: error.message };
  revalidatePath("/health");
  return {};
}

export async function logSleep(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const bedtime = formData.get("bedtime") as string;
  const wakeTime = formData.get("wake_time") as string;
  const quality = parseInt(formData.get("quality") as string) || null;
  const today = new Date().toISOString().split("T")[0];

  let duration: number | null = null;
  if (bedtime && wakeTime) {
    const [bh, bm] = bedtime.split(":").map(Number);
    const [wh, wm] = wakeTime.split(":").map(Number);
    let mins = (wh * 60 + wm) - (bh * 60 + bm);
    if (mins < 0) mins += 24 * 60;
    duration = Math.round((mins / 60) * 10) / 10;
  }

  const { error } = await supabase.from("sleep_logs").upsert(
    { user_id: user.id, logged_date: today, bedtime: bedtime || null, wake_time: wakeTime || null, duration_hrs: duration, quality_score: quality },
    { onConflict: "user_id,logged_date" }
  );

  if (error) return { error: error.message };
  revalidatePath("/health");
  return {};
}

export async function logReadiness(score: number, note: string): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];
  const { error } = await supabase.from("readiness_logs").upsert(
    { user_id: user.id, logged_date: today, score, note: note || null },
    { onConflict: "user_id,logged_date" }
  );

  if (error) return { error: error.message };
  revalidatePath("/health");
  return {};
}

export async function logBodyweight(weightKg: number): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];
  const { error } = await supabase.from("body_measurements").insert({ user_id: user.id, logged_date: today, weight_kg: weightKg });

  if (error) return { error: error.message };
  revalidatePath("/health");
  return {};
}

function calcNavyBF(
  gender: string,
  heightCm: number,
  waistCm: number,
  neckCm: number,
  hipCm: number | null
): number | null {
  if (waistCm <= neckCm) return null;
  const log = Math.log10;
  if (gender === "male") {
    const val =
      495 /
        (1.0324 -
          0.19077 * log(waistCm - neckCm) +
          0.15456 * log(heightCm)) -
      450;
    return Math.max(0, Math.round(val * 10) / 10);
  }
  if (gender === "female" && hipCm !== null) {
    const val =
      495 /
        (1.29579 -
          0.35004 * log(waistCm + hipCm - neckCm) +
          0.221 * log(heightCm)) -
      450;
    return Math.max(0, Math.round(val * 10) / 10);
  }
  return null;
}

export async function logMeasurements(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];
  const n = (k: string) => { const v = parseFloat(formData.get(k) as string); return isNaN(v) ? null : v; };

  const waist = n("waist_cm");
  const neck = n("neck_cm");
  const hip = n("hip_cm");

  // Try to compute BF% using US Navy method
  let bfPct: number | null = null;
  if (waist !== null && neck !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prof } = await supabase.from("profiles").select("height_cm, gender").eq("id", user.id).single() as any;
    if (prof?.height_cm && prof?.gender) {
      bfPct = calcNavyBF(prof.gender as string, prof.height_cm as number, waist, neck, hip);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("body_measurements") as any).insert({
    user_id: user.id, logged_date: today,
    weight_kg: n("weight_kg"), neck_cm: neck, forearm_cm: n("forearm_cm"),
    calf_cm: n("calf_cm"), chest_cm: n("chest_cm"), waist_cm: waist,
    hip_cm: hip, shoulders_cm: n("shoulders_cm"), upper_arm_cm: n("upper_arm_cm"),
    bf_percentage: bfPct,
  });

  if (error) return { error: error.message };
  revalidatePath("/health");
  return {};
}

export async function logSteps(steps: number): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];

  // Upsert today's row to set steps
  const { data: existing } = await supabase.from("body_measurements").select("id").eq("user_id", user.id).eq("logged_date", today).maybeSingle();
  if (existing) {
    await supabase.from("body_measurements").update({ steps }).eq("id", (existing as { id: string }).id);
  } else {
    await supabase.from("body_measurements").insert({ user_id: user.id, logged_date: today, steps });
  }

  revalidatePath("/health");
  return {};
}

export async function saveHealthLayout(layout: {
  lg: Array<{ i: string; x: number; y: number; w: number; h: number }>;
  hidden: string[];
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = { health_layout: layout } as any;
  await supabase.from("profiles").update(payload).eq("id", user.id);
}

export async function logSoreness(muscleGroup: string, severity: string): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];
  const { error } = await supabase.from("soreness_logs").upsert(
    { user_id: user.id, logged_date: today, muscle_group: muscleGroup, severity },
    { onConflict: "user_id,logged_date,muscle_group" }
  );

  if (error) return { error: error.message };
  revalidatePath("/health");
  return {};
}
