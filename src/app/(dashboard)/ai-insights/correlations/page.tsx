import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CorrelationsContent } from "./_components/CorrelationsContent";

const MIN_POINTS = 14;

async function getCorrelationData(userId: string) {
  const supabase = await createServerClient();
  const DAYS = 90;

  // Run the three server-side RPC functions and the sleep consistency query in parallel.
  // The RPCs run entirely in Postgres, using the indexed columns — no raw row transfer.
  const [sleepMoodRpc, trainingMoodRpc, habitMoodRpc, sleepConsistencyRes, moodCountRes] =
    await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).rpc("get_sleep_mood_correlation",   { p_user_id: userId, p_days: DAYS }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).rpc("get_training_mood_correlation", { p_user_id: userId, p_days: DAYS }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).rpc("get_habit_mood_correlation",   { p_user_id: userId, p_days: DAYS }),
      // Bedtime std-dev still needs raw rows (time arithmetic done in JS)
      supabase.from("sleep_logs")
        .select("logged_date,bedtime")
        .eq("user_id", userId)
        .gte("logged_date", new Date(Date.now() - DAYS * 86400000).toISOString().split("T")[0]),
      supabase.from("mood_logs")
        .select("logged_date", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("logged_date", new Date(Date.now() - DAYS * 86400000).toISOString().split("T")[0]),
    ]);

  // ── Sleep → mood scatter points (from RPC) ──────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sleepMoodPoints: Array<{ sleepHrs: number; mood: number; date: string }> = (sleepMoodRpc.data ?? []).map((r: any, i: number) => ({
    sleepHrs: Math.round((r.sleep_hrs as number) * 10) / 10,
    mood:     r.next_day_mood as number,
    date:     String(i),
  }));

  // ── Training vs rest mood (from RPC) ────────────────────────────────────────
  const avg = (v: number) => Math.round(v * 10) / 10;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trainingRow = (trainingMoodRpc.data ?? []).find((r: any) => r.is_training_day === true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const restRow     = (trainingMoodRpc.data ?? []).find((r: any) => r.is_training_day === false);
  const trainingMoodData = [
    { name: "Training days", avgMood: avg(trainingRow?.avg_mood ?? 0), count: Number(trainingRow?.day_count ?? 0) },
    { name: "Rest days",     avgMood: avg(restRow?.avg_mood ?? 0),     count: Number(restRow?.day_count ?? 0)     },
  ];

  // ── Bedtime consistency (still computed in JS from raw bedtime strings) ──────
  const bedtimeMins: number[] = [];
  for (const s of sleepConsistencyRes.data ?? []) {
    if (!s.bedtime) continue;
    const [h, m] = (s.bedtime as string).split(":").map(Number);
    let mins = h * 60 + m;
    if (mins < 12 * 60) mins += 24 * 60; // wrap midnight times past noon
    bedtimeMins.push(mins);
  }
  let sleepStdDev = 0;
  let avgBedtimeStr = "";
  if (bedtimeMins.length >= 3) {
    const mean = bedtimeMins.reduce((a, b) => a + b, 0) / bedtimeMins.length;
    sleepStdDev = Math.round(Math.sqrt(bedtimeMins.reduce((a, b) => a + (b - mean) ** 2, 0) / bedtimeMins.length));
    const avgH = Math.floor(mean / 60) % 24;
    const avgM = Math.round(mean % 60);
    avgBedtimeStr = `${String(avgH).padStart(2, "0")}:${String(avgM).padStart(2, "0")}`;
  }

  // ── Habit → mood (from RPC) ──────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topHabitCorrelations = (habitMoodRpc.data ?? []).map((r: any) => ({
    habitName:       r.habit_name as string,
    avgMoodWith:     avg(r.avg_mood_with as number),
    avgMoodWithout:  avg(r.avg_mood_without as number),
    completionDays:  Number(r.completion_days),
  }));

  return {
    sleepMoodPoints,
    trainingMoodData,
    sleepConsistency: { stdDevMinutes: sleepStdDev, avgBedtimeStr },
    topHabitCorrelations,
    dataPointCount: moodCountRes.count ?? 0,
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
