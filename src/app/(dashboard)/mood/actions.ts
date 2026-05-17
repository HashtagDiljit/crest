"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export interface MoodLogRow {
  id: string;
  logged_date: string;
  score: number | null;
  note: string | null;
}

export interface MoodCorrelation {
  sleepLift: number | null;
  workoutLift: number | null;
  sleepDayCount: number;
  workoutDayCount: number;
}

export async function getMoodLogs(days = 35): Promise<MoodLogRow[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabase
    .from("mood_logs")
    .select("id, logged_date, score, note")
    .eq("user_id", user.id)
    .gte("logged_date", since.toISOString().split("T")[0])
    .order("logged_date", { ascending: false });

  return (data ?? []).map((l) => ({
    id: l.id,
    logged_date: l.logged_date,
    score: l.score,
    note: l.note,
  }));
}

export async function getMoodCorrelation(): Promise<MoodCorrelation> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sleepLift: null, workoutLift: null, sleepDayCount: 0, workoutDayCount: 0 };

  const since = new Date();
  since.setDate(since.getDate() - 90);
  const sinceStr = since.toISOString().split("T")[0];

  const [{ data: moodData }, { data: sleepData }, { data: workoutData }] = await Promise.all([
    supabase.from("mood_logs").select("logged_date, score").eq("user_id", user.id).gte("logged_date", sinceStr),
    supabase.from("sleep_logs").select("logged_date, duration_hrs").eq("user_id", user.id).gte("logged_date", sinceStr),
    supabase.from("workout_sessions").select("started_at").eq("user_id", user.id).gte("started_at", since.toISOString()).not("ended_at", "is", null),
  ]);

  const moods = new Map<string, number>();
  for (const m of moodData ?? []) {
    if (m.score !== null) moods.set(m.logged_date, m.score);
  }

  if (moods.size === 0) return { sleepLift: null, workoutLift: null, sleepDayCount: 0, workoutDayCount: 0 };

  const overallAvg = Array.from(moods.values()).reduce((a, b) => a + b, 0) / moods.size;

  // Sleep correlation
  const sleepDates = new Set<string>();
  for (const s of sleepData ?? []) {
    if ((s.duration_hrs ?? 0) >= 7) sleepDates.add(s.logged_date);
  }
  const sleepMoods = Array.from(moods.entries())
    .filter(([d]) => sleepDates.has(d))
    .map(([, v]) => v);
  const sleepAvg = sleepMoods.length > 0 ? sleepMoods.reduce((a, b) => a + b, 0) / sleepMoods.length : null;
  const sleepLift = sleepAvg !== null && overallAvg > 0 ? Math.round(((sleepAvg - overallAvg) / overallAvg) * 100) : null;

  // Workout correlation
  const workoutDates = new Set<string>();
  for (const w of workoutData ?? []) {
    workoutDates.add(new Date(w.started_at).toISOString().split("T")[0]);
  }
  const workoutMoods = Array.from(moods.entries())
    .filter(([d]) => workoutDates.has(d))
    .map(([, v]) => v);
  const workoutAvg = workoutMoods.length > 0 ? workoutMoods.reduce((a, b) => a + b, 0) / workoutMoods.length : null;
  const workoutLift = workoutAvg !== null && overallAvg > 0 ? Math.round(((workoutAvg - overallAvg) / overallAvg) * 100) : null;

  return {
    sleepLift,
    workoutLift,
    sleepDayCount: sleepMoods.length,
    workoutDayCount: workoutMoods.length,
  };
}

export async function logMood(score: number, note: string): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase.from("mood_logs").upsert(
    { user_id: user.id, logged_date: today, score, note: note || null },
    { onConflict: "user_id,logged_date" }
  );

  if (error) return { error: error.message };
  revalidatePath("/mood");
  return {};
}
