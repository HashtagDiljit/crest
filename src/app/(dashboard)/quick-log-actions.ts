"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export async function quickLogWater(ml: number): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const today = new Date().toISOString().split("T")[0];
  const { error } = await supabase.from("health_metrics").insert({
    user_id: user.id, logged_date: today, metric_type: "water_ml", value: ml, unit: "ml",
  });
  if (error) return { error: error.message };
  revalidatePath("/health");
  return {};
}

export async function quickLogMood(score: number, note: string): Promise<{ error?: string }> {
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

export async function quickLogFood(
  preset: string,
  proteinG: number,
  mealName: string,
): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const today = new Date().toISOString().split("T")[0];
  const { error } = await supabase.from("nutrition_logs").insert({
    user_id: user.id, logged_date: today, food_preset: preset,
    protein_g: proteinG, meal_name: mealName || null,
  });
  if (error) return { error: error.message };
  return {};
}

export async function getTodayProtein(): Promise<number> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("nutrition_logs")
    .select("protein_g")
    .eq("user_id", user.id)
    .eq("logged_date", today);
  return (data ?? []).reduce((sum, r) => sum + (r.protein_g ?? 0), 0);
}

export async function quickLogWeight(kg: number): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const today = new Date().toISOString().split("T")[0];
  const { error } = await supabase.from("body_measurements").insert({
    user_id: user.id, logged_date: today, weight_kg: kg,
  });
  if (error) return { error: error.message };
  revalidatePath("/health");
  return {};
}

export async function quickLogSleep(
  bedtime: string,
  wakeTime: string,
  quality: number,
): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const today = new Date().toISOString().split("T")[0];
  let duration: number | null = null;
  if (bedtime && wakeTime) {
    const [bh, bm] = bedtime.split(":").map(Number);
    const [wh, wm] = wakeTime.split(":").map(Number);
    let mins = wh * 60 + wm - (bh * 60 + bm);
    if (mins < 0) mins += 1440;
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

export async function getLastSleepTimes(): Promise<{ bedtime: string | null; wakeTime: string | null }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { bedtime: null, wakeTime: null };
  const { data } = await supabase
    .from("sleep_logs")
    .select("bedtime, wake_time")
    .eq("user_id", user.id)
    .order("logged_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { bedtime: data?.bedtime ?? null, wakeTime: data?.wake_time ?? null };
}

export async function getLastWeight(): Promise<number | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("body_measurements")
    .select("weight_kg")
    .eq("user_id", user.id)
    .not("weight_kg", "is", null)
    .order("logged_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any)?.weight_kg ?? null;
}

export async function quickLogNote(body: string): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const today = new Date().toISOString().split("T")[0];
  const { error } = await supabase.from("journal_entries").insert({
    user_id: user.id, logged_date: today, body: body.trim(),
  });
  if (error) return { error: error.message };
  revalidatePath("/journal");
  return {};
}
