import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CorrelationsContent } from "./_components/CorrelationsContent";

const MIN_POINTS = 14;

async function getCorrelationData(userId: string) {
  const supabase = await createServerClient();
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const sinceStr = since.toISOString().split("T")[0];

  const [sleepRes, moodRes, sessionsRes, habitsRes, logsRes] = await Promise.all([
    supabase.from("sleep_logs").select("logged_date,duration_hrs,bedtime").eq("user_id", userId).gte("logged_date", sinceStr),
    supabase.from("mood_logs").select("logged_date,score").eq("user_id", userId).gte("logged_date", sinceStr),
    supabase.from("workout_sessions").select("started_at").eq("user_id", userId).not("ended_at", "is", null).gte("started_at", sinceStr),
    supabase.from("habits").select("id,name").eq("user_id", userId).is("archived_at", null),
    supabase.from("habit_logs").select("habit_id,logged_date").eq("user_id", userId).eq("completed", true).gte("logged_date", sinceStr),
  ]);

  const sleepByDate = new Map<string, { hrs: number; bedtimeMin: number | null }>();
  for (const s of sleepRes.data ?? []) {
    let bedMin: number | null = null;
    if (s.bedtime) {
      const [h, m] = (s.bedtime as string).split(":").map(Number);
      // Convert bedtime to minutes from noon (so 22:00 = 600, 00:30 = 750 wrapping)
      bedMin = h * 60 + m;
      if (bedMin < 12 * 60) bedMin += 24 * 60; // wrap midnight times
    }
    sleepByDate.set(s.logged_date as string, { hrs: (s.duration_hrs as number) ?? 0, bedtimeMin: bedMin });
  }

  const moodByDate = new Map<string, number>();
  for (const m of moodRes.data ?? []) {
    moodByDate.set(m.logged_date as string, m.score as number);
  }

  const trainingDates = new Set<string>(
    (sessionsRes.data ?? []).map((s) => (s.started_at as string).split("T")[0])
  );

  // Sleep→mood scatter points
  const sleepMoodPoints: Array<{ sleepHrs: number; mood: number; date: string }> = [];
  Array.from(sleepByDate.entries()).forEach(([date, sleep]) => {
    const mood = moodByDate.get(date);
    if (mood !== undefined && sleep.hrs > 0) {
      sleepMoodPoints.push({ sleepHrs: Math.round(sleep.hrs * 10) / 10, mood, date });
    }
  });

  // Training vs rest mood
  const trainingMoods: number[] = [];
  const restMoods: number[] = [];
  Array.from(moodByDate.entries()).forEach(([date, mood]) => {
    if (trainingDates.has(date)) trainingMoods.push(mood);
    else restMoods.push(mood);
  });
  const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;
  const trainingMoodData = [
    { name: "Training days", avgMood: avg(trainingMoods), count: trainingMoods.length },
    { name: "Rest days", avgMood: avg(restMoods), count: restMoods.length },
  ];

  // Sleep consistency (bedtime std dev)
  const bedtimeMins = Array.from(sleepByDate.values()).map((s: { hrs: number; bedtimeMin: number | null }) => s.bedtimeMin).filter((v): v is number => v !== null);
  let sleepStdDev = 0;
  let avgBedtimeStr = "";
  if (bedtimeMins.length >= 3) {
    const mean = bedtimeMins.reduce((a, b) => a + b, 0) / bedtimeMins.length;
    sleepStdDev = Math.round(Math.sqrt(bedtimeMins.reduce((a, b) => a + (b - mean) ** 2, 0) / bedtimeMins.length));
    const avgH = Math.floor(mean / 60) % 24;
    const avgM = Math.round(mean % 60);
    avgBedtimeStr = `${String(avgH).padStart(2, "0")}:${String(avgM).padStart(2, "0")}`;
  }

  // Habit→mood correlation (top habits by days done)
  const completedByHabit = new Map<string, Set<string>>();
  for (const log of logsRes.data ?? []) {
    if (!completedByHabit.has(log.habit_id as string)) completedByHabit.set(log.habit_id as string, new Set());
    completedByHabit.get(log.habit_id as string)!.add(log.logged_date as string);
  }

  const habitCorrelations: Array<{ habitName: string; avgMoodWith: number; avgMoodWithout: number; completionDays: number }> = [];
  for (const habit of habitsRes.data ?? []) {
    const doneDates = completedByHabit.get(habit.id as string) ?? new Set<string>();
    if (doneDates.size < 5) continue;
    const withMoods: number[] = [];
    const withoutMoods: number[] = [];
    Array.from(moodByDate.entries()).forEach(([date, mood]) => {
      if (doneDates.has(date)) withMoods.push(mood);
      else withoutMoods.push(mood);
    });
    if (withMoods.length < 3 || withoutMoods.length < 3) continue;
    habitCorrelations.push({
      habitName: habit.name as string,
      avgMoodWith: avg(withMoods),
      avgMoodWithout: avg(withoutMoods),
      completionDays: doneDates.size,
    });
  }
  // Sort by absolute difference
  habitCorrelations.sort((a, b) => Math.abs(b.avgMoodWith - b.avgMoodWithout) - Math.abs(a.avgMoodWith - a.avgMoodWithout));
  const topHabitCorrelations = habitCorrelations.slice(0, 3);

  return {
    sleepMoodPoints,
    trainingMoodData,
    sleepConsistency: { stdDevMinutes: sleepStdDev, avgBedtimeStr },
    topHabitCorrelations,
    dataPointCount: moodByDate.size,
  };
}

export default async function CorrelationsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getCorrelationData(user.id);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/ai-insights" className="text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">Correlations</h1>
          <p className="text-13 text-text-secondary mt-0.5">Patterns found in your last 90 days of data.</p>
        </div>
      </div>

      {data.dataPointCount < MIN_POINTS ? (
        <div className="rounded-r5 border border-border bg-bg-surface p-10 flex flex-col items-center gap-3 text-center">
          <p className="font-display text-16 font-semibold text-text-primary">Not enough data yet</p>
          <p className="text-13 text-text-secondary max-w-sm">
            Log mood alongside sleep, workouts, and habits for at least {MIN_POINTS} days to see correlations.
            You have {data.dataPointCount} mood log{data.dataPointCount !== 1 ? "s" : ""} so far.
          </p>
        </div>
      ) : (
        <CorrelationsContent data={data} />
      )}
    </div>
  );
}
