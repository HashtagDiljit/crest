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
  completedToday: boolean;
}

export interface HabitLogEntry {
  habitId: string;
  date: string;
  completed: boolean;
}

export async function getHabits(): Promise<HabitRow[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const today = new Date().toISOString().split("T")[0];
  const since = new Date();
  since.setDate(since.getDate() - 183);
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

    let streak = 0;
    const cursor = new Date();
    if (!completedToday) cursor.setDate(cursor.getDate() - 1);
    while (completed.has(cursor.toISOString().split("T")[0])) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return {
      id: h.id,
      name: h.name,
      category: h.category,
      frequency: h.frequency,
      created_at: h.created_at,
      streak,
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
