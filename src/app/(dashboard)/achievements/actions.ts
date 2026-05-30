"use server";

import { createServerClient } from "@/lib/supabase/server";

export interface AchievementRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tier: string | null;
  xp_reward: number;
  unlocked_at: string | null;
}

async function getActiveDays(userId: string, supabase: Awaited<ReturnType<typeof createServerClient>>): Promise<Set<string>> {
  const since = new Date();
  since.setDate(since.getDate() - 600);
  const sinceStr = since.toISOString().split("T")[0];

  const [moodRes, habitRes, sleepRes, journalRes, workoutRes] = await Promise.all([
    supabase.from("mood_logs").select("logged_date").eq("user_id", userId).gte("logged_date", sinceStr),
    supabase.from("habit_logs").select("logged_date").eq("user_id", userId).gte("logged_date", sinceStr),
    supabase.from("sleep_logs").select("logged_date").eq("user_id", userId).gte("logged_date", sinceStr),
    supabase.from("journal_entries").select("logged_date").eq("user_id", userId).gte("logged_date", sinceStr),
    supabase.from("workout_sessions").select("started_at").eq("user_id", userId).not("ended_at", "is", null),
  ]);

  const days = new Set<string>();
  for (const r of moodRes.data ?? []) days.add(r.logged_date);
  for (const r of habitRes.data ?? []) days.add(r.logged_date);
  for (const r of sleepRes.data ?? []) days.add(r.logged_date);
  for (const r of journalRes.data ?? []) days.add(r.logged_date);
  for (const r of workoutRes.data ?? []) days.add((r.started_at as string).split("T")[0]);
  return days;
}

function longestStreak(days: Set<string>): number {
  const sorted = Array.from(days).sort();
  let max = 0, cur = 0, prev: string | null = null;
  for (const d of sorted) {
    if (prev) {
      const diff = (new Date(d).getTime() - new Date(prev).getTime()) / 86400000;
      cur = diff === 1 ? cur + 1 : 1;
    } else {
      cur = 1;
    }
    max = Math.max(max, cur);
    prev = d;
  }
  return max;
}

async function checkCondition(slug: string, userId: string, supabase: Awaited<ReturnType<typeof createServerClient>>): Promise<boolean> {
  switch (slug) {
    case "first-five": {
      const { count } = await supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId).not("ended_at", "is", null);
      return (count ?? 0) >= 5;
    }
    case "strong-fifty": {
      const { count } = await supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId).not("ended_at", "is", null);
      return (count ?? 0) >= 50;
    }
    case "century-club": {
      const { count } = await supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId).not("ended_at", "is", null);
      return (count ?? 0) >= 100;
    }
    case "seven-day-streak": {
      const days = await getActiveDays(userId, supabase);
      return longestStreak(days) >= 7;
    }
    case "thirty-day-streak": {
      const days = await getActiveDays(userId, supabase);
      return longestStreak(days) >= 30;
    }
    case "iron-will": {
      const days = await getActiveDays(userId, supabase);
      return longestStreak(days) >= 90;
    }
    case "five-hundred-streak": {
      const days = await getActiveDays(userId, supabase);
      return longestStreak(days) >= 500;
    }
    case "note-taker": {
      const { count } = await supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", userId);
      return (count ?? 0) >= 5;
    }
    case "mood-tracker": {
      const { data } = await supabase.from("mood_logs").select("logged_date").eq("user_id", userId).order("logged_date", { ascending: false }).limit(30);
      if (!data?.length) return false;
      const dates = data.map((d) => d.logged_date).sort();
      return longestStreak(new Set(dates)) >= 7;
    }
    case "hydrated": {
      const { data } = await supabase.from("health_metrics").select("logged_date").eq("user_id", userId).eq("metric_type", "water_ml");
      if (!data?.length) return false;
      return longestStreak(new Set(data.map((d) => d.logged_date))) >= 7;
    }
    case "early-riser": {
      const { data } = await supabase.from("sleep_logs").select("bedtime").eq("user_id", userId);
      const earlyDays = (data ?? []).filter((s) => {
        if (!s.bedtime) return false;
        const [h] = (s.bedtime as string).split(":").map(Number);
        return h < 23;
      });
      return earlyDays.length >= 5;
    }
    case "sleep-architect": {
      const { data } = await supabase.from("sleep_logs").select("duration_hrs").eq("user_id", userId);
      const goodDays = (data ?? []).filter((s) => (s.duration_hrs ?? 0) >= 8);
      return goodDays.length >= 14;
    }
    case "habit-completionist": {
      const { data: habits } = await supabase.from("habits").select("id").eq("user_id", userId).is("archived_at", null);
      if (!habits?.length) return false;
      const habitIds = habits.map((h) => h.id as string);
      const { data: logs } = await supabase.from("habit_logs").select("habit_id, logged_date, completed").eq("user_id", userId).eq("completed", true);
      const dayMap = new Map<string, Set<string>>();
      for (const l of logs ?? []) {
        const s = dayMap.get(l.logged_date) ?? new Set();
        s.add(l.habit_id);
        dayMap.set(l.logged_date, s);
      }
      const allDays = Array.from(dayMap.entries())
        .filter(([, s]) => habitIds.every((id) => s.has(id)))
        .map(([d]) => d);
      return longestStreak(new Set(allDays)) >= 7;
    }
    case "pr-machine": {
      const { count } = await supabase.from("personal_records").select("id", { count: "exact", head: true }).eq("user_id", userId);
      return (count ?? 0) >= 10;
    }
    default:
      return false;
  }
}

export async function getAchievementsData(): Promise<AchievementRow[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [allRes, userRes] = await Promise.all([
    supabase.from("achievements").select("*").order("tier").order("name"),
    supabase.from("user_achievements").select("achievement_id, unlocked_at").eq("user_id", user.id),
  ]);

  const unlockedMap = new Map((userRes.data ?? []).map((ua) => [ua.achievement_id as string, ua.unlocked_at as string]));

  const all = (allRes.data ?? []) as Array<{ id: string; slug: string; name: string; description: string | null; tier: string | null; xp_reward: number }>;

  // Check and unlock newly earned achievements
  const locked = all.filter((a) => !unlockedMap.has(a.id));
  for (const achievement of locked) {
    const earned = await checkCondition(achievement.slug, user.id, supabase);
    if (earned) {
      await supabase.from("user_achievements").insert({ user_id: user.id, achievement_id: achievement.id });

      // Award XP
      const { data: profile } = await supabase.from("profiles").select("xp").eq("id", user.id).single();
      if (profile) {
        await supabase.from("profiles").update({ xp: ((profile as { xp: number }).xp ?? 0) + achievement.xp_reward }).eq("id", user.id);
      }
      unlockedMap.set(achievement.id, new Date().toISOString());
    }
  }

  return all.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    description: a.description,
    tier: a.tier,
    xp_reward: a.xp_reward,
    unlocked_at: unlockedMap.get(a.id) ?? null,
  }));
}
