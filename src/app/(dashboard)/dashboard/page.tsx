import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { DashboardContent } from "./_components/DashboardContent";

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getLastWeekRange(): { start: string; end: string } {
  const thisMonday = getWeekStart();
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);
  const lastSunday = new Date(thisMonday);
  lastSunday.setDate(lastSunday.getDate() - 1);
  return {
    start: lastMonday.toISOString().split("T")[0],
    end: lastSunday.toISOString().split("T")[0],
  };
}

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const weekStart = getWeekStart();
  const weekStartDate = weekStart.toISOString().split("T")[0];
  const lastWeek = getLastWeekRange();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    profileResult,
    workoutsThisWeek,
    habitsResult,
    habitLogsResult,
    sleepThisWeek,
    moodThisWeek,
    sleepLast7,
    restingHRResult,
    hrvResult,
    workoutDatesResult,
    aiInsightResult,
    lastWeekWorkoutsResult,
    lastWeekSleepResult,
    lastWeekHabitsResult,
    lastWeekHabitLogsResult,
    lastWeekMoodResult,
    lastSessionResult,
    weeklyVolumeResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, streak_current, dashboard_layout")
      .eq("id", user.id)
      .single(),

    supabase
      .from("workout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("started_at", weekStart.toISOString()),

    supabase
      .from("habits")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("archived_at", null),

    supabase
      .from("habit_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("logged_date", weekStartDate)
      .eq("completed", true),

    supabase
      .from("sleep_logs")
      .select("duration_hrs")
      .eq("user_id", user.id)
      .gte("logged_date", weekStartDate),

    supabase
      .from("mood_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("logged_date", weekStartDate)
      .gte("score", 3),

    supabase
      .from("sleep_logs")
      .select("duration_hrs, quality_score, logged_date")
      .eq("user_id", user.id)
      .order("logged_date", { ascending: false })
      .limit(7),

    supabase
      .from("health_metrics")
      .select("value")
      .eq("user_id", user.id)
      .eq("metric_type", "resting_hr")
      .order("logged_date", { ascending: false })
      .limit(1),

    supabase
      .from("health_metrics")
      .select("value")
      .eq("user_id", user.id)
      .eq("metric_type", "hrv")
      .order("logged_date", { ascending: false })
      .limit(1),

    supabase
      .from("workout_sessions")
      .select("started_at")
      .eq("user_id", user.id)
      .gte("started_at", sixMonthsAgo.toISOString()),

    supabase
      .from("ai_insights")
      .select("title, body, category")
      .eq("user_id", user.id)
      .is("dismissed_at", null)
      .order("generated_at", { ascending: false })
      .limit(1),

    supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("started_at", lastWeek.start).lte("started_at", lastWeek.end + "T23:59:59"),
    supabase.from("sleep_logs").select("duration_hrs").eq("user_id", user.id).gte("logged_date", lastWeek.start).lte("logged_date", lastWeek.end),
    supabase.from("habits").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("archived_at", null),
    supabase.from("habit_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("logged_date", lastWeek.start).lte("logged_date", lastWeek.end).eq("completed", true),
    supabase.from("mood_logs").select("score").eq("user_id", user.id).gte("logged_date", lastWeek.start).lte("logged_date", lastWeek.end),
    // Last completed session with template name
    supabase.from("workout_sessions").select("started_at, template_id, workout_templates(name)").eq("user_id", user.id).not("ended_at", "is", null).order("started_at", { ascending: false }).limit(1).maybeSingle(),
    // Sets from last 4 weeks for volume sparkline
    supabase.from("session_sets").select("weight_kg, reps, workout_sessions!inner(started_at, user_id)").eq("workout_sessions.user_id", user.id).gte("workout_sessions.started_at", new Date(Date.now() - 28 * 86400000).toISOString()),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileResult.data as any;
  const rawUsername: string = profile?.username ?? user.email?.split("@")[0] ?? "there";
  const firstName = rawUsername.trim().split(/\s+/)[0];

  const workoutCount = workoutsThisWeek.count ?? 0;
  const habitTotal = habitsResult.count ?? 0;
  const habitLogs = habitLogsResult.count ?? 0;

  const sleepThisWeekRows = (sleepThisWeek.data ?? []) as { duration_hrs: number | null }[];
  const sleepNights7hrs = sleepThisWeekRows.filter(
    (s) => (s.duration_hrs ?? 0) >= 7
  ).length;
  const moodDaysThisWeek = moodThisWeek.count ?? 0;

  const sleepLast7Rows = (sleepLast7.data ?? []) as {
    duration_hrs: number | null;
    quality_score: number | null;
    logged_date: string;
  }[];
  const sleepSparkline = [...sleepLast7Rows]
    .reverse()
    .map((s) => s.duration_hrs ?? 0);
  const lastSleep = sleepLast7Rows[0] ?? null;

  const restingHRVal = (restingHRResult.data ?? [])[0]?.value ?? null;
  const hrvVal = (hrvResult.data ?? [])[0]?.value ?? null;

  const workoutDates = (
    (workoutDatesResult.data ?? []) as { started_at: string }[]
  ).map((w) => w.started_at.split("T")[0]);

  const aiInsightRow = (aiInsightResult.data ?? [])[0] as
    | { title: string; body: string; category: string }
    | undefined;

  // Last session for progressive overload card
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastSessionRow = lastSessionResult.data as any;
  const lastSession = lastSessionRow ? {
    date: (lastSessionRow.started_at as string).split("T")[0],
    templateName: (lastSessionRow.workout_templates as { name: string } | null)?.name ?? null,
  } : null;

  // 4-week volume sparkline (kg lifted per week)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const volumeSets = (weeklyVolumeResult.data ?? []) as any[];
  const weeklyVolume: number[] = [0, 0, 0, 0];
  const now = Date.now();
  for (const s of volumeSets) {
    const sessionDate = new Date((s.workout_sessions?.started_at ?? s.started_at) as string);
    const weeksAgo = Math.floor((now - sessionDate.getTime()) / (7 * 86400000));
    const idx = 3 - Math.min(weeksAgo, 3);
    weeklyVolume[idx] += (s.weight_kg ?? 0) * (s.reps ?? 0);
  }
  const weeklyVolumeRounded = weeklyVolume.map((v) => Math.round(v));

  const lwWorkouts = lastWeekWorkoutsResult.count ?? 0;
  const lwSleepRows = (lastWeekSleepResult.data ?? []) as { duration_hrs: number | null }[];
  const lwSleepAvg = lwSleepRows.length > 0
    ? Math.round(lwSleepRows.reduce((s, r) => s + (r.duration_hrs ?? 0), 0) / lwSleepRows.length * 10) / 10
    : null;
  const lwHabitTotal = lastWeekHabitsResult.count ?? 0;
  const lwHabitLogs = lastWeekHabitLogsResult.count ?? 0;
  const lwHabitPct = lwHabitTotal > 0 ? Math.round((lwHabitLogs / (lwHabitTotal * 7)) * 100) : null;
  const lwMoodRows = (lastWeekMoodResult.data ?? []) as { score: number }[];
  const lwMoodAvg = lwMoodRows.length > 0
    ? Math.round(lwMoodRows.reduce((s, r) => s + r.score, 0) / lwMoodRows.length * 10) / 10
    : null;

  const rawLayout = profile?.dashboard_layout;
  const dashboardLayout =
    rawLayout &&
    typeof rawLayout === "object" &&
    Array.isArray(rawLayout.cards)
      ? (rawLayout as { cards: string[]; hidden: string[] })
      : null;

  return (
    <DashboardContent
      username={firstName}
      streak={profile?.streak_current ?? 0}
      dashboardLayout={dashboardLayout}
      workoutCount={workoutCount}
      workoutTarget={4}
      habitTotal={habitTotal}
      habitLogs={habitLogs}
      sleepNights7hrs={sleepNights7hrs}
      moodDaysThisWeek={moodDaysThisWeek}
      lastSleepDuration={lastSleep?.duration_hrs ?? null}
      lastSleepQuality={lastSleep?.quality_score ?? null}
      sleepSparkline={sleepSparkline}
      restingHR={restingHRVal !== null ? Number(restingHRVal) : null}
      hrv={hrvVal !== null ? Number(hrvVal) : null}
      workoutDates={workoutDates}
      aiInsight={aiInsightRow ?? null}
      lastWeekDigest={{ workouts: lwWorkouts, sleepAvg: lwSleepAvg, habitPct: lwHabitPct, moodAvg: lwMoodAvg }}
      lastSession={lastSession}
      weeklyVolume={weeklyVolumeRounded}
    />
  );
}
