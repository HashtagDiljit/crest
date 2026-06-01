"use server";

import { createServerClient } from "@/lib/supabase/server";

export interface ActivityItem {
  id: string;
  module: "workout" | "sleep" | "mood" | "habit" | "journal";
  description: string;
  timestamp: string;
  href: string;
}

const MOOD_LABELS: Record<number, string> = {
  5: "Excellent",
  4: "Great",
  3: "Okay",
  2: "Low",
  1: "Rough",
};

export async function getRecentActivity(): Promise<ActivityItem[]> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [workoutRes, sleepRes, moodRes, habitRes, journalRes] =
    await Promise.all([
      supabase
        .from("workout_sessions")
        .select("id, started_at, workout_templates(name)")
        .eq("user_id", user.id)
        .not("ended_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(6),

      supabase
        .from("sleep_logs")
        .select("id, logged_date, duration_hrs")
        .eq("user_id", user.id)
        .order("logged_date", { ascending: false })
        .limit(5),

      supabase
        .from("mood_logs")
        .select("id, logged_date, score, note")
        .eq("user_id", user.id)
        .order("logged_date", { ascending: false })
        .limit(5),

      supabase
        .from("habit_logs")
        .select("id, logged_date, habits(name)")
        .eq("user_id", user.id)
        .eq("completed", true)
        .order("logged_date", { ascending: false })
        .limit(8),

      supabase
        .from("journal_entries")
        .select("id, logged_date, body")
        .eq("user_id", user.id)
        .order("logged_date", { ascending: false })
        .limit(4),
    ]);

  const items: ActivityItem[] = [];

  for (const row of (workoutRes.data ?? []) as Array<{
    id: string;
    started_at: string;
    workout_templates: { name: string } | null;
  }>) {
    const name = row.workout_templates?.name ?? "Workout";
    items.push({
      id: `workout-${row.id}`,
      module: "workout",
      description: `Completed ${name}`,
      timestamp: row.started_at,
      href: "/workouts",
    });
  }

  for (const row of (sleepRes.data ?? []) as Array<{
    id: string;
    logged_date: string;
    duration_hrs: number | null;
  }>) {
    const d = row.duration_hrs ?? 0;
    const h = Math.floor(d);
    const m = Math.round((d - h) * 60);
    const label = d > 0 ? `${h}h ${m}m` : "—";
    items.push({
      id: `sleep-${row.id}`,
      module: "sleep",
      description: `Sleep: ${label}`,
      timestamp: `${row.logged_date}T12:00:00Z`,
      href: "/health",
    });
  }

  for (const row of (moodRes.data ?? []) as Array<{
    id: string;
    logged_date: string;
    score: number | null;
    note: string | null;
  }>) {
    const label = row.score ? MOOD_LABELS[row.score] ?? String(row.score) : "—";
    const desc = row.note
      ? `Mood: ${label} · "${row.note.slice(0, 30)}${row.note.length > 30 ? "…" : ""}"`
      : `Mood logged: ${label}`;
    items.push({
      id: `mood-${row.id}`,
      module: "mood",
      description: desc,
      timestamp: `${row.logged_date}T12:00:00Z`,
      href: "/mood",
    });
  }

  for (const row of (habitRes.data ?? []) as Array<{
    id: string;
    logged_date: string;
    habits: { name: string } | null;
  }>) {
    const name = row.habits?.name ?? "habit";
    items.push({
      id: `habit-${row.id}`,
      module: "habit",
      description: `Habit completed: ${name}`,
      timestamp: `${row.logged_date}T12:00:00Z`,
      href: "/habits",
    });
  }

  for (const row of (journalRes.data ?? []) as Array<{
    id: string;
    logged_date: string;
    body: string;
  }>) {
    const snippet = row.body.slice(0, 50).replace(/\s+/g, " ").trim();
    items.push({
      id: `journal-${row.id}`,
      module: "journal",
      description: `Journal: "${snippet}${row.body.length > 50 ? "…" : ""}"`,
      timestamp: `${row.logged_date}T12:00:00Z`,
      href: "/journal",
    });
  }

  items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return items.slice(0, 20);
}
