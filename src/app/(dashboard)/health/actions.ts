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
  shoulders_cm: number | null;
  upper_arm_cm: number | null;
  steps: number | null;
}

export interface MetricRow {
  logged_date: string;
  value: number;
}

export interface SorenessRow {
  muscle_group: string;
  severity: string;
}

export interface HealthData {
  sleepLogs: SleepLogRow[];
  readinessLogs: ReadinessRow[];
  measurements: BodyMeasurementRow[];
  hrvMetrics: MetricRow[];
  hrMetrics: MetricRow[];
  todaySoreness: SorenessRow[];
}

export async function getHealthData(): Promise<HealthData> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sleepLogs: [], readinessLogs: [], measurements: [], hrvMetrics: [], hrMetrics: [], todaySoreness: [] };

  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);
  const since7Str = since7.toISOString().split("T")[0];

  const since90 = new Date();
  since90.setDate(since90.getDate() - 90);
  const since90Str = since90.toISOString().split("T")[0];

  const today = new Date().toISOString().split("T")[0];

  const [sleepRes, readinessRes, measureRes, metricRes, sorenessRes] = await Promise.all([
    supabase.from("sleep_logs").select("*").eq("user_id", user.id).gte("logged_date", since7Str).order("logged_date", { ascending: false }),
    supabase.from("readiness_logs").select("*").eq("user_id", user.id).gte("logged_date", since7Str).order("logged_date", { ascending: false }),
    supabase.from("body_measurements").select("*").eq("user_id", user.id).gte("logged_date", since90Str).order("logged_date", { ascending: false }),
    supabase.from("health_metrics").select("logged_date, metric_type, value").eq("user_id", user.id).gte("logged_date", since7Str),
    supabase.from("soreness_logs").select("muscle_group, severity").eq("user_id", user.id).eq("logged_date", today),
  ]);

  const metrics = (metricRes.data ?? []) as Array<{ logged_date: string; metric_type: string; value: number }>;

  return {
    sleepLogs: (sleepRes.data ?? []).map((l) => ({ id: l.id, logged_date: l.logged_date, duration_hrs: l.duration_hrs, quality_score: l.quality_score, bedtime: l.bedtime, wake_time: l.wake_time })),
    readinessLogs: (readinessRes.data ?? []).map((l) => ({ id: l.id, logged_date: l.logged_date, score: l.score, note: l.note })),
    measurements: (measureRes.data ?? []).map((l) => ({
      id: l.id, logged_date: l.logged_date, weight_kg: l.weight_kg,
      neck_cm: l.neck_cm, forearm_cm: l.forearm_cm, calf_cm: l.calf_cm,
      chest_cm: l.chest_cm, waist_cm: l.waist_cm, shoulders_cm: l.shoulders_cm,
      upper_arm_cm: l.upper_arm_cm, steps: l.steps,
    })),
    hrvMetrics: metrics.filter((m) => m.metric_type === "hrv").map((m) => ({ logged_date: m.logged_date, value: m.value })),
    hrMetrics: metrics.filter((m) => m.metric_type === "resting_hr").map((m) => ({ logged_date: m.logged_date, value: m.value })),
    todaySoreness: (sorenessRes.data ?? []).map((s) => ({ muscle_group: s.muscle_group, severity: s.severity })),
  };
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

export async function logMeasurements(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];
  const n = (k: string) => { const v = parseFloat(formData.get(k) as string); return isNaN(v) ? null : v; };

  const { error } = await supabase.from("body_measurements").insert({
    user_id: user.id, logged_date: today,
    weight_kg: n("weight_kg"), neck_cm: n("neck_cm"), forearm_cm: n("forearm_cm"),
    calf_cm: n("calf_cm"), chest_cm: n("chest_cm"), waist_cm: n("waist_cm"),
    shoulders_cm: n("shoulders_cm"), upper_arm_cm: n("upper_arm_cm"),
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
