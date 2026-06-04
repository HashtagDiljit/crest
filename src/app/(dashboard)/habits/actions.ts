"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export interface HabitRow {
  id: string;
  name: string;
  category: string | null;
  frequency: string | null;
  created_at: string;
  streak: number;
  skipUsed: boolean;
  completedToday: boolean;
}

export interface HabitLogEntry {
  habitId: string;
  date: string;
  completed: boolean;
}

// Forgiving streak: 1 skip per 7-day window, 2 consecutive misses breaks streak
function calcForgivingStreak(completed: Set<string>, today: string): { streak: number; skipUsed: boolean } {
  let streak = 0;
  let skipUsed = false;
  let consecutiveMisses = 0;
  let skipsUsedThisWindow = 0;

  const start = new Date(today + "T12:00:00");
  // If today isn't done yet, start looking from yesterday
  if (!completed.has(today)) start.setDate(start.getDate() - 1);

  for (let i = 0; i < 400; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    if (completed.has(dateStr)) {
      streak++;
      consecutiveMisses = 0;
      // Reset skip allowance every 7 completed days
      if (streak % 7 === 0) skipsUsedThisWindow = 0;
    } else {
      consecutiveMisses++;
      if (consecutiveMisses >= 2) break; // 2 in a row = streak broken
      if (skipsUsedThisWindow >= 1) break; // already used skip this window
      skipsUsedThisWindow++;
      skipUsed = true;
      // Skip: don't increment streak, but continue walking back
    }
  }

  return { streak, skipUsed };
}

export async function getHabits(): Promise<HabitRow[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const today = new Date().toISOString().split("T")[0];
  const since = new Date();
  since.setDate(since.getDate() - 400);
  const sinceStr = since.toISOString().split("T")[0];

  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("created_at");

  if (!habits || habits.length === 0) return [];

  const { data: logs } = await supabase
    .from("habit_logs")
    .select("habit_id, logged_date, completed")
    .eq("user_id", user.id)
    .gte("logged_date", sinceStr);

  const logsByHabit = new Map<string, Set<string>>();
  for (const log of logs ?? []) {
    if (!log.completed) continue;
    if (!logsByHabit.has(log.habit_id)) logsByHabit.set(log.habit_id, new Set());
    logsByHabit.get(log.habit_id)!.add(log.logged_date);
  }

  return habits.map((h) => {
    const completed = logsByHabit.get(h.id) ?? new Set<string>();
    const completedToday = completed.has(today);
    const { streak, skipUsed } = calcForgivingStreak(completed, today);

    return {
      id: h.id,
      name: h.name,
      category: h.category,
      frequency: h.frequency,
      created_at: h.created_at,
      streak,
      skipUsed,
      completedToday,
    };
  });
}

export async function getAllHabitLogs(): Promise<HabitLogEntry[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const since = new Date();
  since.setDate(since.getDate() - 183);

  const { data } = await supabase
    .from("habit_logs")
    .select("habit_id, logged_date, completed")
    .eq("user_id", user.id)
    .gte("logged_date", since.toISOString().split("T")[0]);

  return (data ?? []).map((l) => ({
    habitId: l.habit_id,
    date: l.logged_date,
    completed: l.completed,
  }));
}

export async function toggleHabit(habitId: string, date: string, currentlyDone: boolean): Promise<void> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("habit_logs").upsert(
    { habit_id: habitId, user_id: user.id, logged_date: date, completed: !currentlyDone },
    { onConflict: "habit_id,logged_date" }
  );

  revalidatePath("/habits");
}

// Copy yesterday's completed habits to today
export async function copyYesterdayHabits(): Promise<{ count: number; error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { count: 0, error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const { data: habits } = await supabase
    .from("habits")
    .select("id")
    .eq("user_id", user.id)
    .is("archived_at", null);

  if (!habits?.length) return { count: 0 };

  const { data: yesterdayLogs } = await supabase
    .from("habit_logs")
    .select("habit_id")
    .eq("user_id", user.id)
    .eq("logged_date", yesterday)
    .eq("completed", true);

  const completedYesterday = new Set((yesterdayLogs ?? []).map((l) => l.habit_id));
  if (!completedYesterday.size) return { count: 0 };

  const toInsert = habits
    .filter((h) => completedYesterday.has(h.id))
    .map((h) => ({ habit_id: h.id, user_id: user.id, logged_date: today, completed: true }));

  if (!toInsert.length) return { count: 0 };

  await supabase.from("habit_logs").upsert(toInsert, { onConflict: "habit_id,logged_date" });
  revalidatePath("/habits");
  return { count: toInsert.length };
}

export async function createHabit(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };

  const { error } = await supabase.from("habits").insert({
    user_id: user.id,
    name,
    category: (formData.get("category") as string) || null,
    frequency: (formData.get("frequency") as string) || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/habits");
  return {};
}

export async function archiveHabit(habitId: string): Promise<void> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("habits")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", habitId)
    .eq("user_id", user.id);

  revalidatePath("/habits");
}
