"use server";

import { createServerClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

export interface AchievementRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tier: string | null;
  category: string | null;
  xp_reward: number;
  unlocked_at: string | null;
  current?: number;
  target?: number;
  unit?: string;
}

interface SetRow {
  weight_kg: number | null;
  reps: number | null;
  exercises: { name: string } | { name: string }[] | null;
}

function exerciseName(row: SetRow): string {
  const ex = row.exercises;
  if (!ex) return "";
  return Array.isArray(ex) ? ex[0]?.name ?? "" : ex.name ?? "";
}

function maxLift(rows: SetRow[], exclude: string[] = []): number {
  let max = 0;
  for (const r of rows) {
    if ((r.reps ?? 0) < 1 || r.weight_kg == null) continue;
    const name = exerciseName(r).toLowerCase();
    if (exclude.some((e) => name.includes(e.toLowerCase()))) continue;
    max = Math.max(max, r.weight_kg);
  }
  return max;
}

function maxReps(rows: SetRow[], maxWeight = 0): number {
  let max = 0;
  for (const r of rows) {
    if ((r.weight_kg ?? 0) > maxWeight) continue;
    max = Math.max(max, r.reps ?? 0);
  }
  return max;
}

async function getActiveDays(userId: string, supabase: SupabaseClient): Promise<Set<string>> {
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

function longestStreak(days: Set<string> | string[]): number {
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

interface AchievementContext {
  activeDays: Set<string>;
  allDaysStreak: number;
  workoutSessionCount: number;
  templateCount: number;
  prCount: number;
  bodyweight: number | null;
  maxSquat: number;
  maxDeadlift: number;
  maxBench: number;
  maxOHP: number;
  maxRow: number;
  maxPullupReps: number;
  maxWeightedPullup: number;
  maxPushupReps: number;
  maxDipReps: number;
  maxWeeklyVolume: number;
  journalCount: number;
  moodLogsCount: number;
  moodStreak: number;
  goalsCount: number;
  completedGoalsCount: number;
  habitStreak: number;
  waterStreak: number;
  earlyRiserCount: number;
  sleepGood8hrCount: number;
  hrvStreak: number;
  maxHRV: number | null;
  healthMetricsCount: number;
  stepsDaysCount: number;
  maxSteps: number;
  nutritionLogsCount: number;
  maxMealsPerDay: number;
  supplementStreak: number;
  proteinTargetDaysCount: number;
}

async function fetchSets(supabase: SupabaseClient, userId: string, namePattern: string): Promise<SetRow[]> {
  const { data } = await supabase
    .from("session_sets")
    .select("weight_kg, reps, exercises!inner(name), workout_sessions!inner(user_id)")
    .eq("workout_sessions.user_id", userId)
    .ilike("exercises.name", namePattern)
    .not("reps", "is", null);
  return (data ?? []) as unknown as SetRow[];
}

async function buildContext(userId: string, supabase: SupabaseClient): Promise<AchievementContext> {
  const sinceVolume = new Date(Date.now() - 365 * 86400000).toISOString();

  const [
    activeDays,
    sessionCountRes,
    templateCountRes,
    prCountRes,
    bodyMeasurementRes,
    squatSets,
    deadliftSets,
    benchSets,
    ohpSets,
    rowSets,
    pullupSets,
    pushupSets,
    dipSets,
    volumeSetsRes,
    journalCountRes,
    moodLogsRes,
    goalsRes,
    habitsRes,
    habitLogsRes,
    waterDaysRes,
    sleepRes,
    hrvRes,
    healthMetricsCountRes,
    stepsRes,
    nutritionLogsRes,
    supplementLogsRes,
    profileRes,
  ] = await Promise.all([
    getActiveDays(userId, supabase),
    supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId).not("ended_at", "is", null),
    supabase.from("workout_templates").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("personal_records").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("body_measurements").select("weight_kg").eq("user_id", userId).not("weight_kg", "is", null).order("logged_date", { ascending: false }).limit(1),
    fetchSets(supabase, userId, "%squat%"),
    fetchSets(supabase, userId, "%deadlift%"),
    fetchSets(supabase, userId, "%bench press%"),
    fetchSets(supabase, userId, "%overhead press%"),
    fetchSets(supabase, userId, "%row%"),
    fetchSets(supabase, userId, "pull-up%"),
    fetchSets(supabase, userId, "push-up%"),
    fetchSets(supabase, userId, "dip%"),
    supabase.from("session_sets").select("weight_kg, reps, workout_sessions!inner(started_at, user_id)").eq("workout_sessions.user_id", userId).gte("workout_sessions.started_at", sinceVolume),
    supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("mood_logs").select("logged_date").eq("user_id", userId),
    supabase.from("goals").select("id, completed_at").eq("user_id", userId),
    supabase.from("habits").select("id").eq("user_id", userId).is("archived_at", null),
    supabase.from("habit_logs").select("habit_id, logged_date, completed").eq("user_id", userId).eq("completed", true),
    supabase.from("health_metrics").select("logged_date").eq("user_id", userId).eq("metric_type", "water_ml"),
    supabase.from("sleep_logs").select("bedtime, duration_hrs").eq("user_id", userId),
    supabase.from("health_metrics").select("logged_date, value").eq("user_id", userId).eq("metric_type", "hrv"),
    supabase.from("health_metrics").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("health_metrics").select("logged_date, value").eq("user_id", userId).eq("metric_type", "steps"),
    supabase.from("nutrition_logs").select("logged_date, protein_g").eq("user_id", userId),
    (supabase.from("supplement_logs") as any).select("logged_date").eq("user_id", userId), // eslint-disable-line @typescript-eslint/no-explicit-any
    supabase.from("profiles").select("nutrition_settings").eq("id", userId).single(),
  ]);

  // Weekly volume (kg lifted per ISO week)
  const weeklyVolume = new Map<string, number>();
  for (const row of (volumeSetsRes.data ?? []) as Array<{ weight_kg: number | null; reps: number | null; workout_sessions: { started_at: string } | { started_at: string }[] }>) {
    const ws = Array.isArray(row.workout_sessions) ? row.workout_sessions[0] : row.workout_sessions;
    if (!ws?.started_at) continue;
    const date = new Date(ws.started_at);
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
    const key = weekStart.toISOString().split("T")[0];
    weeklyVolume.set(key, (weeklyVolume.get(key) ?? 0) + (row.weight_kg ?? 0) * (row.reps ?? 0));
  }
  const maxWeeklyVolume = weeklyVolume.size > 0 ? Math.max(...Array.from(weeklyVolume.values())) : 0;

  // Mood
  const moodDates = (moodLogsRes.data ?? []).map((r) => r.logged_date as string);
  const moodStreak = longestStreak(moodDates);

  // Goals
  const goalRows = (goalsRes.data ?? []) as Array<{ id: string; completed_at: string | null }>;
  const completedGoalsCount = goalRows.filter((g) => g.completed_at).length;

  // Habit completionist streak
  const habits = (habitsRes.data ?? []) as Array<{ id: string }>;
  const habitIds = habits.map((h) => h.id);
  const habitDayMap = new Map<string, Set<string>>();
  for (const l of (habitLogsRes.data ?? []) as Array<{ habit_id: string; logged_date: string }>) {
    const s = habitDayMap.get(l.logged_date) ?? new Set();
    s.add(l.habit_id);
    habitDayMap.set(l.logged_date, s);
  }
  const allHabitDays = habitIds.length > 0
    ? Array.from(habitDayMap.entries()).filter(([, s]) => habitIds.every((id) => s.has(id))).map(([d]) => d)
    : [];
  const habitStreak = longestStreak(allHabitDays);

  // Water streak
  const waterDates = (waterDaysRes.data ?? []).map((r) => r.logged_date as string);
  const waterStreak = longestStreak(waterDates);

  // Sleep
  const sleepRows = (sleepRes.data ?? []) as Array<{ bedtime: string | null; duration_hrs: number | null }>;
  const earlyRiserCount = sleepRows.filter((s) => {
    if (!s.bedtime) return false;
    const [h] = s.bedtime.split(":").map(Number);
    return h < 23;
  }).length;
  const sleepGood8hrCount = sleepRows.filter((s) => (s.duration_hrs ?? 0) >= 8).length;

  // HRV
  const hrvRows = (hrvRes.data ?? []) as Array<{ logged_date: string; value: number }>;
  const hrvStreak = longestStreak(hrvRows.map((r) => r.logged_date));
  const maxHRV = hrvRows.length > 0 ? Math.max(...hrvRows.map((r) => r.value)) : null;

  // Steps
  const stepsRows = (stepsRes.data ?? []) as Array<{ logged_date: string; value: number }>;
  const stepsDaysCount = new Set(stepsRows.map((r) => r.logged_date)).size;
  const maxSteps = stepsRows.length > 0 ? Math.max(...stepsRows.map((r) => r.value)) : 0;

  // Nutrition: meals per day, protein target days
  const nutritionRows = (nutritionLogsRes.data ?? []) as Array<{ logged_date: string; protein_g: number | null }>;
  const mealsByDay = new Map<string, number>();
  const proteinByDay = new Map<string, number>();
  for (const r of nutritionRows) {
    mealsByDay.set(r.logged_date, (mealsByDay.get(r.logged_date) ?? 0) + 1);
    proteinByDay.set(r.logged_date, (proteinByDay.get(r.logged_date) ?? 0) + (r.protein_g ?? 0));
  }
  const maxMealsPerDay = mealsByDay.size > 0 ? Math.max(...Array.from(mealsByDay.values())) : 0;
  const proteinTarget = (profileRes.data as { nutrition_settings?: { protein_target?: number } } | null)?.nutrition_settings?.protein_target ?? 150;
  const proteinTargetDaysCount = Array.from(proteinByDay.values()).filter((p) => p >= proteinTarget).length;

  // Supplements
  const supplementDates = ((supplementLogsRes.data ?? []) as Array<{ logged_date: string }>).map((r) => r.logged_date);
  const supplementStreak = longestStreak(new Set(supplementDates));

  return {
    activeDays,
    allDaysStreak: longestStreak(activeDays),
    workoutSessionCount: sessionCountRes.count ?? 0,
    templateCount: templateCountRes.count ?? 0,
    prCount: prCountRes.count ?? 0,
    bodyweight: (bodyMeasurementRes.data ?? [])[0]?.weight_kg ?? null,
    maxSquat: maxLift(squatSets),
    maxDeadlift: maxLift(deadliftSets),
    maxBench: maxLift(benchSets),
    maxOHP: maxLift(ohpSets),
    maxRow: maxLift(rowSets, ["rowing machine"]),
    maxPullupReps: maxReps(pullupSets, 0),
    maxWeightedPullup: maxLift(pullupSets),
    maxPushupReps: maxReps(pushupSets, 0),
    maxDipReps: maxReps(dipSets, 0),
    maxWeeklyVolume,
    journalCount: journalCountRes.count ?? 0,
    moodLogsCount: moodDates.length,
    moodStreak,
    goalsCount: goalRows.length,
    completedGoalsCount,
    habitStreak,
    waterStreak,
    earlyRiserCount,
    sleepGood8hrCount,
    hrvStreak,
    maxHRV,
    healthMetricsCount: healthMetricsCountRes.count ?? 0,
    stepsDaysCount,
    maxSteps,
    nutritionLogsCount: nutritionRows.length,
    maxMealsPerDay,
    supplementStreak,
    proteinTargetDaysCount,
  };
}

interface Evaluation {
  earned: boolean;
  current?: number;
  target?: number;
  unit?: string;
}

function evaluate(slug: string, ctx: AchievementContext): Evaluation {
  switch (slug) {
    // --- Consistency ---
    case "first-step":
      return { earned: ctx.activeDays.size >= 1, current: Math.min(ctx.activeDays.size, 1), target: 1 };
    case "three-day-streak":
      return { earned: ctx.allDaysStreak >= 3, current: ctx.allDaysStreak, target: 3, unit: "days" };
    case "seven-day-streak":
      return { earned: ctx.allDaysStreak >= 7, current: ctx.allDaysStreak, target: 7, unit: "days" };
    case "two-weeks-strong":
      return { earned: ctx.allDaysStreak >= 14, current: ctx.allDaysStreak, target: 14, unit: "days" };
    case "quarter-century":
      return { earned: ctx.allDaysStreak >= 25, current: ctx.allDaysStreak, target: 25, unit: "days" };
    case "thirty-day-streak":
      return { earned: ctx.allDaysStreak >= 30, current: ctx.allDaysStreak, target: 30, unit: "days" };
    case "iron-will":
      return { earned: ctx.allDaysStreak >= 90, current: ctx.allDaysStreak, target: 90, unit: "days" };
    case "centurion":
      return { earned: ctx.allDaysStreak >= 100, current: ctx.allDaysStreak, target: 100, unit: "days" };
    case "iron-discipline":
      return { earned: ctx.allDaysStreak >= 200, current: ctx.allDaysStreak, target: 200, unit: "days" };
    case "five-hundred-streak":
      return { earned: ctx.allDaysStreak >= 500, current: ctx.allDaysStreak, target: 500, unit: "days" };
    case "habit-completionist":
      return { earned: ctx.habitStreak >= 7, current: ctx.habitStreak, target: 7, unit: "days" };
    case "supplement-starter":
      return { earned: ctx.supplementStreak >= 3, current: ctx.supplementStreak, target: 3, unit: "days" };

    // --- Workout ---
    case "first-rep": {
      const total = ctx.maxSquat + ctx.maxDeadlift + ctx.maxBench + ctx.maxOHP + ctx.maxRow + ctx.maxPullupReps + ctx.maxPushupReps + ctx.maxDipReps + ctx.workoutSessionCount;
      const has = total > 0 || ctx.workoutSessionCount > 0;
      return { earned: has, current: has ? 1 : 0, target: 1 };
    }
    case "first-five":
    case "workout_1":
    case "workout_10":
    case "workout_50":
    case "strong-fifty":
    case "century-club":
    case "workout_100":
    case "twenty-sessions":
    case "two-hundred": {
      const targets: Record<string, number> = {
        "workout_1": 1,
        "first-five": 5,
        "workout_10": 10,
        "twenty-sessions": 20,
        "workout_50": 50,
        "strong-fifty": 50,
        "century-club": 100,
        "workout_100": 100,
        "two-hundred": 200,
      };
      const target = targets[slug];
      return { earned: ctx.workoutSessionCount >= target, current: ctx.workoutSessionCount, target, unit: "sessions" };
    }
    case "template-builder":
      return { earned: ctx.templateCount >= 1, current: Math.min(ctx.templateCount, 1), target: 1 };
    case "pr_1":
    case "pr-machine":
    case "pr_10":
    case "pr-legend": {
      const targets: Record<string, number> = { "pr_1": 1, "pr-machine": 10, "pr_10": 10, "pr-legend": 25 };
      const target = targets[slug];
      return { earned: ctx.prCount >= target, current: ctx.prCount, target, unit: "PRs" };
    }
    case "volume_king":
      return { earned: ctx.maxWeeklyVolume >= 10000, current: Math.round(ctx.maxWeeklyVolume), target: 10000, unit: "kg/week" };
    case "volume-week":
      return { earned: ctx.maxWeeklyVolume >= 5000, current: Math.round(ctx.maxWeeklyVolume), target: 5000, unit: "kg/week" };

    // --- Strength (bodyweight multiples) ---
    case "squat_bodyweight":
    case "squat_1_5x":
    case "squat_2x":
    case "deadlift_1x":
    case "deadlift_1_75x":
    case "deadlift_2_5x":
    case "bench_0_75x":
    case "bench_1x":
    case "bench_1_25x":
    case "ohp_0_5x":
    case "ohp_0_75x":
    case "row_1x":
    case "row_1_5x": {
      const multiples: Record<string, number> = {
        "squat_bodyweight": 1, "squat_1_5x": 1.5, "squat_2x": 2,
        "deadlift_1x": 1, "deadlift_1_75x": 1.75, "deadlift_2_5x": 2.5,
        "bench_0_75x": 0.75, "bench_1x": 1, "bench_1_25x": 1.25,
        "ohp_0_5x": 0.5, "ohp_0_75x": 0.75,
        "row_1x": 1, "row_1_5x": 1.5,
      };
      const lifts: Record<string, number> = {
        "squat_bodyweight": ctx.maxSquat, "squat_1_5x": ctx.maxSquat, "squat_2x": ctx.maxSquat,
        "deadlift_1x": ctx.maxDeadlift, "deadlift_1_75x": ctx.maxDeadlift, "deadlift_2_5x": ctx.maxDeadlift,
        "bench_0_75x": ctx.maxBench, "bench_1x": ctx.maxBench, "bench_1_25x": ctx.maxBench,
        "ohp_0_5x": ctx.maxOHP, "ohp_0_75x": ctx.maxOHP,
        "row_1x": ctx.maxRow, "row_1_5x": ctx.maxRow,
      };
      if (ctx.bodyweight == null) return { earned: false };
      const target = Math.round(ctx.bodyweight * multiples[slug] * 10) / 10;
      const current = Math.round(lifts[slug] * 10) / 10;
      return { earned: current >= target, current, target, unit: "kg" };
    }
    case "pullup_1":
      return { earned: ctx.maxPullupReps >= 1, current: ctx.maxPullupReps, target: 1, unit: "reps" };
    case "pullup_10":
      return { earned: ctx.maxPullupReps >= 10, current: ctx.maxPullupReps, target: 10, unit: "reps" };
    case "pullup_weighted_20":
      return { earned: ctx.maxWeightedPullup >= 20, current: Math.round(ctx.maxWeightedPullup * 10) / 10, target: 20, unit: "kg" };
    case "pushup_25":
      return { earned: ctx.maxPushupReps >= 25, current: ctx.maxPushupReps, target: 25, unit: "reps" };
    case "dip_15":
      return { earned: ctx.maxDipReps >= 15, current: ctx.maxDipReps, target: 15, unit: "reps" };

    // --- Health ---
    case "early-data":
      return { earned: ctx.healthMetricsCount >= 1, current: Math.min(ctx.healthMetricsCount, 1), target: 1 };
    case "early-riser":
      return { earned: ctx.earlyRiserCount >= 5, current: ctx.earlyRiserCount, target: 5, unit: "nights" };
    case "hydrated":
      return { earned: ctx.waterStreak >= 7, current: ctx.waterStreak, target: 7, unit: "days" };
    case "step-counter":
      return { earned: ctx.stepsDaysCount >= 5, current: ctx.stepsDaysCount, target: 5, unit: "days" };
    case "ten-k-steps":
      return { earned: ctx.maxSteps >= 10000, current: ctx.maxSteps, target: 10000, unit: "steps" };
    case "recovery-king":
      return { earned: ctx.hrvStreak >= 7, current: ctx.hrvStreak, target: 7, unit: "days" };
    case "sleep-architect":
      return { earned: ctx.sleepGood8hrCount >= 14, current: ctx.sleepGood8hrCount, target: 14, unit: "nights" };
    case "sleep-champion":
      return { earned: ctx.sleepGood8hrCount >= 30, current: ctx.sleepGood8hrCount, target: 30, unit: "nights" };
    case "optimal-hrv":
      return { earned: (ctx.maxHRV ?? 0) > 60, current: ctx.maxHRV ?? 0, target: 60, unit: "ms" };

    // --- Nutrition ---
    case "protein-start":
      return { earned: ctx.nutritionLogsCount >= 1, current: Math.min(ctx.nutritionLogsCount, 1), target: 1 };
    case "three-meals":
      return { earned: ctx.maxMealsPerDay >= 3, current: ctx.maxMealsPerDay, target: 3, unit: "meals" };
    case "supplement-streak":
      return { earned: ctx.supplementStreak >= 7, current: ctx.supplementStreak, target: 7, unit: "days" };
    case "supplement-month":
      return { earned: ctx.supplementStreak >= 30, current: ctx.supplementStreak, target: 30, unit: "days" };
    case "protein-week":
      return { earned: ctx.proteinTargetDaysCount >= 7, current: ctx.proteinTargetDaysCount, target: 7, unit: "days" };
    case "protein-champion":
      return { earned: ctx.proteinTargetDaysCount >= 30, current: ctx.proteinTargetDaysCount, target: 30, unit: "days" };

    // --- Mindset ---
    case "first-thought":
      return { earned: ctx.journalCount >= 1, current: Math.min(ctx.journalCount, 1), target: 1 };
    case "note-taker":
      return { earned: ctx.journalCount >= 5, current: ctx.journalCount, target: 5, unit: "entries" };
    case "journal-habit":
      return { earned: ctx.journalCount >= 20, current: ctx.journalCount, target: 20, unit: "entries" };
    case "mood-tracker":
      return { earned: ctx.moodStreak >= 7, current: ctx.moodStreak, target: 7, unit: "days" };
    case "mood-awareness":
      return { earned: ctx.moodLogsCount >= 10, current: ctx.moodLogsCount, target: 10, unit: "logs" };
    case "mood-month":
      return { earned: ctx.moodLogsCount >= 30, current: ctx.moodLogsCount, target: 30, unit: "days" };
    case "mood-master":
      return { earned: ctx.moodLogsCount >= 100, current: ctx.moodLogsCount, target: 100, unit: "days" };
    case "goal-setter":
      return { earned: ctx.goalsCount >= 1, current: Math.min(ctx.goalsCount, 1), target: 1 };
    case "goal-achiever":
      return { earned: ctx.completedGoalsCount >= 1, current: Math.min(ctx.completedGoalsCount, 1), target: 1 };

    default:
      return { earned: false };
  }
}

export async function getAchievementsData(userId: string): Promise<AchievementRow[]> {
  const supabase = await createServerClient();

  const [allRes, userRes, ctx] = await Promise.all([
    supabase.from("achievements").select("*").order("tier").order("name"),
    supabase.from("user_achievements").select("achievement_id, unlocked_at").eq("user_id", userId),
    buildContext(userId, supabase),
  ]);

  const unlockedMap = new Map((userRes.data ?? []).map((ua) => [ua.achievement_id as string, ua.unlocked_at as string]));

  const all = (allRes.data ?? []) as Array<{ id: string; slug: string; name: string; description: string | null; tier: string | null; category: string | null; xp_reward: number }>;

  let xpToAward = 0;
  const newlyUnlocked: string[] = [];
  const result: AchievementRow[] = [];

  for (const a of all) {
    const unlockedAt = unlockedMap.get(a.id) ?? null;
    const evaluation = evaluate(a.slug, ctx);

    if (!unlockedAt && evaluation.earned) {
      newlyUnlocked.push(a.id);
      xpToAward += a.xp_reward;
    }

    result.push({
      id: a.id,
      slug: a.slug,
      name: a.name,
      description: a.description,
      tier: a.tier,
      category: a.category,
      xp_reward: a.xp_reward,
      unlocked_at: unlockedAt ?? (evaluation.earned ? new Date().toISOString() : null),
      current: evaluation.current,
      target: evaluation.target,
      unit: evaluation.unit,
    });
  }

  if (newlyUnlocked.length > 0) {
    await supabase.from("user_achievements").insert(newlyUnlocked.map((achievement_id) => ({ user_id: userId, achievement_id })));

    const { data: profile } = await supabase.from("profiles").select("xp").eq("id", userId).single();
    if (profile) {
      await supabase.from("profiles").update({ xp: ((profile as { xp: number }).xp ?? 0) + xpToAward }).eq("id", userId);
    }
  }

  return result;
}
