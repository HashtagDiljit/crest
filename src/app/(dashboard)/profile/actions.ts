"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@/lib/supabase/server";

export interface ProfileData {
  id: string;
  username: string | null;
  level: number;
  xp: number;
  streak_current: number;
  streak_best: number;
  avatar_url: string | null;
  email: string;
  created_at: string;
}

export interface LifetimeStats {
  totalWorkouts: number;
  totalVolume: number;
  totalJournalEntries: number;
  totalHabitCompletions: number;
  longestStreak: number;
  currentStreak: number;
}

export interface PREntry {
  exercise_name: string;
  weight_kg: number;
  reps: number;
  set_at: string;
}

export interface RecentAchievement {
  id: string;
  name: string;
  tier: string | null;
  unlocked_at: string;
}

export async function getProfilePageData() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = supabase as any;

  const [profileRes, workoutRes, journalRes, habitRes, prRes, achRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("workout_sessions").select("id").eq("user_id", user.id).not("ended_at", "is", null),
    supabase.from("journal_entries").select("id").eq("user_id", user.id),
    supabase.from("habit_logs").select("id").eq("user_id", user.id).eq("completed", true),
    db.from("personal_records")
      .select("exercise_id, weight_kg, reps, achieved_at, exercises(name)")
      .eq("user_id", user.id)
      .order("achieved_at", { ascending: false })
      .limit(10),
    db.from("user_achievements")
      .select("unlocked_at, achievement_id, achievements(name, tier)")
      .eq("user_id", user.id)
      .order("unlocked_at", { ascending: false })
      .limit(6),
  ]);

  const profile = profileRes.data;
  if (!profile) return null;

  // Volume: sum across all session_sets for this user's sessions
  const { data: allSets } = await db
    .from("session_sets")
    .select("weight_kg, reps, workout_sessions!inner(user_id)")
    .eq("workout_sessions.user_id", user.id);

  const totalVolume = ((allSets ?? []) as Array<{ weight_kg: number | null; reps: number | null }>)
    .reduce((sum, s) => sum + (Number(s.weight_kg ?? 0) * (s.reps ?? 0)), 0);

  const stats: LifetimeStats = {
    totalWorkouts: workoutRes.data?.length ?? 0,
    totalVolume: Math.round(totalVolume),
    totalJournalEntries: journalRes.data?.length ?? 0,
    totalHabitCompletions: habitRes.data?.length ?? 0,
    longestStreak: profile.streak_best ?? 0,
    currentStreak: profile.streak_current ?? 0,
  };

  const prs: PREntry[] = ((prRes.data ?? []) as Array<{ exercises: { name: string } | null; weight_kg: number | null; reps: number | null; achieved_at: string }>)
    .map((p) => ({
      exercise_name: p.exercises?.name ?? "Unknown",
      weight_kg: Number(p.weight_kg ?? 0),
      reps: p.reps ?? 0,
      set_at: p.achieved_at,
    }));

  const recentAchievements: RecentAchievement[] = ((achRes.data ?? []) as Array<{ achievement_id: string; achievements: { name: string; tier: string | null } | null; unlocked_at: string }>)
    .map((a) => ({
      id: a.achievement_id,
      name: a.achievements?.name ?? "Unknown",
      tier: a.achievements?.tier ?? null,
      unlocked_at: a.unlocked_at,
    }));

  const profileData: ProfileData = {
    id: profile.id,
    username: profile.username,
    level: profile.level,
    xp: profile.xp,
    streak_current: profile.streak_current,
    streak_best: profile.streak_best,
    avatar_url: (profile as { avatar_url?: string | null }).avatar_url ?? null,
    email: user.email ?? "",
    created_at: profile.created_at,
  };

  return { profile: profileData, stats, prs, recentAchievements };
}

