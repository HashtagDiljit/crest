import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

interface InsightCard {
  category: string;
  title: string;
  body: string;
  action_cta: string | null;
  action_type: string;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function fmt(n: number, dp = 1): string {
  return n.toFixed(dp);
}

/** ISO date string for N days ago */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

// ─── rule engine ────────────────────────────────────────────────────────────

async function runRules(userId: string, db: DB): Promise<InsightCard[]> {
  const insights: InsightCard[] = [];
  const today = new Date().toISOString().split("T")[0];
  const yesterday = daysAgo(1);
  const since30 = daysAgo(30);
  const since7 = daysAgo(7);
  const since3 = daysAgo(3);

  // ── SLEEP ─────────────────────────────────────────────────────────────────
  const { data: sleepRows } = await db
    .from("sleep_logs")
    .select("logged_date, duration_hrs")
    .eq("user_id", userId)
    .gte("logged_date", since30)
    .order("logged_date");

  const sleepLogs: Array<{ logged_date: string; duration_hrs: number }> =
    (sleepRows ?? []).filter((r: { duration_hrs: unknown }) => r.duration_hrs != null);

  if (sleepLogs.length >= 5) {
    const durations = sleepLogs.map((r) => Number(r.duration_hrs));
    const avgDur = avg(durations);

    // Rule S1: avg < 7hrs
    if (avgDur < 7) {
      insights.push({
        category: "sleep",
        title: "Sleep deficit detected",
        body: `Your average sleep over the last 30 days is ${fmt(avgDur)} hours — below the recommended 7–9 hours. Consistent under-sleeping impairs recovery, mood, and performance. Try moving your bedtime 15–30 minutes earlier.`,
        action_cta: "Log sleep",
        action_type: "navigate_to",
      });
    }

    // Rule S2: high variance (max > 8 and min < 6)
    const maxDur = Math.max(...durations);
    const minDur = Math.min(...durations);
    if (maxDur >= 8 && minDur < 6) {
      insights.push({
        category: "sleep",
        title: "Inconsistent sleep schedule",
        body: `Your sleep duration swings from ${fmt(minDur)}h to ${fmt(maxDur)}h. An irregular schedule disrupts your circadian rhythm even if total hours look fine. Aim to sleep and wake within a 30-minute window each day.`,
        action_cta: "View sleep trends",
        action_type: "navigate_to",
      });
    }

    // Rule S3: sleep on training days vs rest days
    const { data: workoutDatesRaw } = await db
      .from("workout_sessions")
      .select("started_at")
      .eq("user_id", userId)
      .gte("started_at", since30)
      .not("ended_at", "is", null);

    const workoutDays = new Set<string>(
      (workoutDatesRaw ?? []).map((w: { started_at: string }) => w.started_at.split("T")[0])
    );

    const trainingDaySleep = sleepLogs.filter((r) => workoutDays.has(r.logged_date)).map((r) => Number(r.duration_hrs));
    const restDaySleep = sleepLogs.filter((r) => !workoutDays.has(r.logged_date)).map((r) => Number(r.duration_hrs));

    if (trainingDaySleep.length >= 3 && restDaySleep.length >= 3) {
      const avgTrain = avg(trainingDaySleep);
      const avgRest = avg(restDaySleep);
      const diff = avgRest - avgTrain;
      if (diff > 0.5) {
        insights.push({
          category: "sleep",
          title: "Less sleep on training days",
          body: `You average ${fmt(avgTrain)}h sleep on training days vs ${fmt(avgRest)}h on rest days — a ${fmt(diff * 60, 0)}-minute gap. Post-workout recovery peaks during sleep, so training days actually need more, not less. Try scheduling workouts earlier in the day.`,
          action_cta: "View health",
          action_type: "navigate_to",
        });
      }
    }
  }

  // ── WORKOUTS ──────────────────────────────────────────────────────────────
  const { data: sessionRows } = await db
    .from("workout_sessions")
    .select("id, started_at, ended_at")
    .eq("user_id", userId)
    .gte("started_at", since30)
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false });

  const sessions: Array<{ id: string; started_at: string; ended_at: string }> = sessionRows ?? [];

  // Rule W1: no session in 5+ days
  if (sessions.length > 0) {
    const lastSessionDate = sessions[0].started_at.split("T")[0];
    const daysSince = Math.floor((Date.now() - new Date(lastSessionDate).getTime()) / 86400000);
    if (daysSince >= 5) {
      insights.push({
        category: "workout",
        title: `${daysSince}-day training gap`,
        body: `Your last workout was ${daysSince} days ago on ${new Date(lastSessionDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}. Consistency matters more than intensity — even a short session today will maintain momentum.`,
        action_cta: "Start workout",
        action_type: "navigate_to",
      });
    }
  }

  // Rule W2: same muscle group 3+ times in last 7 days
  const sessions7 = sessions.filter((s) => s.started_at >= since7);
  if (sessions7.length >= 3) {
    const sessionIds = sessions7.map((s) => s.id);
    const { data: setsRaw } = await db
      .from("session_sets")
      .select("exercise_id, exercises(muscle_primary)")
      .in("session_id", sessionIds);

    const muscleCount: Record<string, number> = {};
    for (const row of (setsRaw ?? []) as Array<{ exercises: { muscle_primary: string | null } | null }>) {
      const muscle = row.exercises?.muscle_primary;
      if (muscle) muscleCount[muscle] = (muscleCount[muscle] ?? 0) + 1;
    }
    for (const [muscle, count] of Object.entries(muscleCount)) {
      if (count >= 3) {
        insights.push({
          category: "recovery",
          title: `${muscle} overtraining risk`,
          body: `You've trained ${muscle} ${count} times in the last 7 days. Muscle tissue needs 48–72 hours to recover; repeated loading without rest can stall progress and raise injury risk. Schedule a rest or deload day for this group.`,
          action_cta: "Plan deload",
          action_type: "dismiss",
        });
        break; // one overtraining insight is enough
      }
    }
  }

  // Rule W3: PR set in last 7 days
  const { data: prRows } = await db
    .from("personal_records")
    .select("weight_kg, reps, achieved_at, exercises(name)")
    .eq("user_id", userId)
    .gte("achieved_at", since7)
    .order("achieved_at", { ascending: false })
    .limit(1);

  if (prRows?.length) {
    const pr = prRows[0] as { weight_kg: number; reps: number; achieved_at: string; exercises: { name: string } | null };
    const exName = pr.exercises?.name ?? "an exercise";
    const prDate = new Date(pr.achieved_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    insights.push({
      category: "workout",
      title: `New personal record — ${exName}`,
      body: `You hit a new PR on ${exName} — ${pr.weight_kg}kg × ${pr.reps} reps on ${prDate}. Consistent progressive overload is working. Keep it up and make sure to allow adequate recovery before your next heavy set.`,
      action_cta: "View workouts",
      action_type: "navigate_to",
    });
  }

  // Rule W4: volume increased >20% week on week
  const week1Start = daysAgo(14);
  const week2Start = daysAgo(7);

  const sessions14 = sessions.filter((s) => s.started_at >= week1Start && s.started_at < week2Start);
  const sessions7b = sessions.filter((s) => s.started_at >= week2Start);

  if (sessions14.length > 0 && sessions7b.length > 0) {
    const getVolume = async (ids: string[]) => {
      const { data } = await db
        .from("session_sets")
        .select("weight_kg, reps")
        .in("session_id", ids);
      return ((data ?? []) as Array<{ weight_kg: number; reps: number }>)
        .reduce((s, r) => s + (Number(r.weight_kg ?? 0) * (r.reps ?? 0)), 0);
    };

    const [volPrev, volCurr] = await Promise.all([
      getVolume(sessions14.map((s) => s.id)),
      getVolume(sessions7b.map((s) => s.id)),
    ]);

    if (volPrev > 0 && volCurr > volPrev * 1.2) {
      const pct = Math.round(((volCurr - volPrev) / volPrev) * 100);
      insights.push({
        category: "recovery",
        title: "Volume spike — monitor recovery",
        body: `Your training volume jumped ${pct}% this week (${Math.round(volCurr / 1000)}t vs ${Math.round(volPrev / 1000)}t last week). Rapid load increases raise injury risk. Consider scaling back 10–15% next session and prioritising sleep and protein.`,
        action_cta: "View workouts",
        action_type: "navigate_to",
      });
    }
  }

  // ── HABITS ────────────────────────────────────────────────────────────────
  const { data: activeHabits } = await db
    .from("habits")
    .select("id, name")
    .eq("user_id", userId)
    .is("archived_at", null);

  if ((activeHabits ?? []).length > 0) {
    const habitList: Array<{ id: string; name: string }> = activeHabits ?? [];
    const habitIds = habitList.map((h) => h.id);

    const { data: logsRaw } = await db
      .from("habit_logs")
      .select("habit_id, logged_date, completed")
      .eq("user_id", userId)
      .gte("logged_date", since7)
      .in("habit_id", habitIds);

    const logs: Array<{ habit_id: string; logged_date: string; completed: boolean }> = logsRaw ?? [];

    // Rule H1: any habit < 50% this week by name
    for (const habit of habitList) {
      const habitLogs = logs.filter((l) => l.habit_id === habit.id);
      if (habitLogs.length >= 3) {
        const rate = habitLogs.filter((l) => l.completed).length / habitLogs.length;
        if (rate < 0.5) {
          insights.push({
            category: "habit",
            title: `Low completion: ${habit.name}`,
            body: `"${habit.name}" was completed ${Math.round(rate * 100)}% of logged days this week (${habitLogs.filter((l) => l.completed).length}/${habitLogs.length} days). Small habits are the hardest to restart once dropped — try reducing friction by pairing it with an existing routine.`,
            action_cta: "View habits",
            action_type: "navigate_to",
          });
          break; // one low-habit insight per run
        }
      }
    }

    // Rule H2: streak at risk — completed yesterday, not yet today
    const logsByHabit = new Map<string, Set<string>>();
    for (const l of logs.filter((l) => l.completed)) {
      if (!logsByHabit.has(l.habit_id)) logsByHabit.set(l.habit_id, new Set());
      logsByHabit.get(l.habit_id)!.add(l.logged_date);
    }

    for (const habit of habitList) {
      const done = logsByHabit.get(habit.id) ?? new Set();
      if (done.has(yesterday) && !done.has(today)) {
        insights.push({
          category: "habit",
          title: `Streak at risk: ${habit.name}`,
          body: `You completed "${habit.name}" yesterday but haven't logged it yet today. Don't break the chain — logging it now keeps your streak alive and reinforces the behaviour.`,
          action_cta: "Log habits",
          action_type: "navigate_to",
        });
        break;
      }
    }

    // Rule H3: all habits completed 7 consecutive days
    const allHabitIds = new Set(habitIds);
    const dayMap = new Map<string, Set<string>>();
    for (const l of logs.filter((l) => l.completed)) {
      if (!dayMap.has(l.logged_date)) dayMap.set(l.logged_date, new Set());
      dayMap.get(l.logged_date)!.add(l.habit_id);
    }
    const last7Days = Array.from({ length: 7 }, (_, i) => daysAgo(i + 1));
    const perfectWeek = last7Days.every((d) => {
      const done = dayMap.get(d);
      return done && allHabitIds.size > 0 && Array.from(allHabitIds).every((id) => done.has(id));
    });
    if (perfectWeek && allHabitIds.size > 0) {
      insights.push({
        category: "habit",
        title: "Perfect habit week",
        body: `You completed all ${allHabitIds.size} habits every day for the past 7 days. Consistency at this level drives compounding results — keep the streak going and consider adding a new challenge.`,
        action_cta: "Add habit",
        action_type: "add_habit",
      });
    }
  }

  // ── RECOVERY ──────────────────────────────────────────────────────────────
  const { data: readinessRaw } = await db
    .from("readiness_logs")
    .select("logged_date, score")
    .eq("user_id", userId)
    .gte("logged_date", since3)
    .order("logged_date");

  const readiness: Array<{ logged_date: string; score: number }> = readinessRaw ?? [];

  // Rule R1: readiness avg < 6 for last 3 days
  if (readiness.length >= 2) {
    const avgReadiness = avg(readiness.map((r) => r.score));
    if (avgReadiness < 6) {
      insights.push({
        category: "recovery",
        title: "Low readiness score",
        body: `Your average readiness score over the last 3 days is ${fmt(avgReadiness)}/10. Pushing hard when your body signals low readiness increases injury risk and can stall progress. Consider a light active recovery session or rest day.`,
        action_cta: "Log readiness",
        action_type: "navigate_to",
      });
    }
  }

  // Rule R2: resting HR trended up over 7 days
  const { data: hrRaw } = await db
    .from("health_metrics")
    .select("logged_date, value")
    .eq("user_id", userId)
    .eq("metric_type", "heart_rate_resting")
    .gte("logged_date", since7)
    .order("logged_date");

  const hrData: Array<{ logged_date: string; value: number }> = hrRaw ?? [];
  if (hrData.length >= 4) {
    const halfLen = Math.floor(hrData.length / 2);
    const earlyAvg = avg(hrData.slice(0, halfLen).map((r) => r.value));
    const lateAvg = avg(hrData.slice(halfLen).map((r) => r.value));
    if (lateAvg > earlyAvg + 3) {
      insights.push({
        category: "recovery",
        title: "Resting HR trending up",
        body: `Your resting heart rate has risen from ~${fmt(earlyAvg, 0)} bpm to ~${fmt(lateAvg, 0)} bpm over the past 7 days. An upward trend often signals accumulated fatigue, dehydration, or oncoming illness. Prioritise rest and hydration.`,
        action_cta: "View health",
        action_type: "navigate_to",
      });
    }
  }

  // Rule R3: HRV trend declining
  const { data: hrvRaw } = await db
    .from("health_metrics")
    .select("logged_date, value")
    .eq("user_id", userId)
    .eq("metric_type", "hrv")
    .gte("logged_date", since7)
    .order("logged_date");

  const hrvData: Array<{ logged_date: string; value: number }> = hrvRaw ?? [];
  if (hrvData.length >= 4) {
    const halfLen = Math.floor(hrvData.length / 2);
    const earlyHrv = avg(hrvData.slice(0, halfLen).map((r) => r.value));
    const lateHrv = avg(hrvData.slice(halfLen).map((r) => r.value));
    const delta = lateHrv - earlyHrv;
    if (delta < -5) {
      insights.push({
        category: "recovery",
        title: "HRV declining this week",
        body: `Your HRV has dropped ${fmt(Math.abs(delta), 0)} ms over the past 7 days (from ~${fmt(earlyHrv, 0)} to ~${fmt(lateHrv, 0)} ms). Declining HRV is a reliable early signal of under-recovery. Reduce training intensity and focus on sleep quality.`,
        action_cta: "View health",
        action_type: "navigate_to",
      });
    }
  }

  return insights;
}

// ─── route handlers ──────────────────────────────────────────────────────────

export async function POST() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db: DB = supabase;
  const today = new Date().toISOString().split("T")[0];

  // Already generated today?
  const { data: recent } = await db
    .from("ai_insights")
    .select("id")
    .eq("user_id", user.id)
    .gte("generated_at", `${today}T00:00:00.000Z`)
    .limit(1);

  if (recent?.length) {
    return NextResponse.json({ cached: true, message: "Already generated today" }, { status: 429 });
  }

  const insights = await runRules(user.id, db);

  if (insights.length === 0) {
    return NextResponse.json({ error: "Not enough data yet. Log workouts, sleep, and habits for a week to unlock your first insights." }, { status: 422 });
  }

  const toInsert = insights.map((ins) => ({
    user_id: user.id,
    category: ins.category,
    title: ins.title,
    body: ins.body,
    action_cta: ins.action_cta,
    action_type: ins.action_type,
    data_source: "last_30_days",
    generated_at: new Date().toISOString(),
  }));

  const { data: saved, error: dbError } = await db.from("ai_insights").insert(toInsert).select();
  if (dbError) return NextResponse.json({ error: "DB insert failed" }, { status: 500 });

  return NextResponse.json({ insights: saved });
}

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db: DB = supabase;

  const { data } = await db
    .from("ai_insights")
    .select("*")
    .eq("user_id", user.id)
    .is("dismissed_at", null)
    .order("generated_at", { ascending: false });

  const { data: dismissed } = await db
    .from("ai_insights")
    .select("*")
    .eq("user_id", user.id)
    .not("dismissed_at", "is", null)
    .order("dismissed_at", { ascending: false })
    .limit(10);

  const today = new Date().toISOString().split("T")[0];
  const { data: todayInsights } = await db
    .from("ai_insights")
    .select("generated_at")
    .eq("user_id", user.id)
    .gte("generated_at", `${today}T00:00:00.000Z`)
    .limit(1);

  const lastGenerated =
    (todayInsights as Array<{ generated_at: string }> | null)?.[0]?.generated_at ?? null;

  return NextResponse.json({ insights: data ?? [], dismissed: dismissed ?? [], lastGenerated });
}

export async function PATCH(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = (await request.json()) as { id: string };
  const db: DB = supabase;
  await db
    .from("ai_insights")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
