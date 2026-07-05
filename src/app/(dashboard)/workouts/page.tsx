export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, BookOpen, Play } from "lucide-react";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getTemplates, getWorkoutHistory, seedDefaultTemplates, getTrainingWeekCount, getActiveSession } from "./actions";
import { TemplatesSection } from "./_components/TemplatesSection";
import { HistorySection } from "./_components/HistorySection";
import { WeekPanel } from "./_components/WeekPanel";
import { DeloadBanner } from "./_components/DeloadBanner";
import { WorkoutSuggestion } from "./_components/WorkoutSuggestion";
import { computeReadiness } from "@/lib/readiness";

export default async function WorkoutsPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await seedDefaultTemplates();

  const today = new Date().toISOString().split("T")[0];
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();

  const [templates, history, weekCount, activeSession, sleepResult, hrvResult, rhrResult, sessionsLast3Result] = await Promise.all([
    getTemplates(),
    getWorkoutHistory(),
    getTrainingWeekCount(),
    getActiveSession(),
    supabase.from("sleep_logs").select("duration_hrs").eq("user_id", user.id).order("logged_date", { ascending: false }).limit(1),
    supabase.from("health_metrics").select("value").eq("user_id", user.id).eq("metric_type", "hrv").order("logged_date", { ascending: false }).limit(1),
    supabase.from("health_metrics").select("value").eq("user_id", user.id).eq("metric_type", "resting_hr").order("logged_date", { ascending: false }).limit(1),
    supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("started_at", threeDaysAgo),
  ]);

  const lastSleepHrs = (sleepResult.data ?? [])[0]?.duration_hrs ?? null;
  const hrv = (hrvResult.data ?? [])[0]?.value ?? null;
  const rhr = (rhrResult.data ?? [])[0]?.value ?? null;
  const sessionsLast3 = sessionsLast3Result.count ?? 0;

  const readiness = computeReadiness({
    lastSleepHrs,
    hrv: hrv !== null ? Number(hrv) : null,
    restingHR: rhr !== null ? Number(rhr) : null,
    sessionsLast3Days: sessionsLast3,
  });
  const hasReadinessData = lastSleepHrs !== null || hrv !== null || rhr !== null;

  const showDeloadBanner = weekCount > 0 && weekCount % 4 === 0;
  void today;

  return (
    <div className="flex flex-col gap-6 overflow-x-hidden">
      {showDeloadBanner && <DeloadBanner weekCount={weekCount} />}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">Workouts</h1>
          <p className="text-13 text-text-secondary mt-1">Track your training, build templates, and log sessions.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            href="/workouts/exercises"
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-pill border border-border bg-bg-elevated hover:bg-bg-overlay text-text-secondary text-13 font-medium transition-colors flex-1 sm:flex-none"
          >
            <BookOpen size={14} />
            Exercises
          </Link>
          <Link
            href="/workouts/start"
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-pill bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors flex-1 sm:flex-none"
          >
            <Plus size={15} />
            Log workout
          </Link>
        </div>
      </div>

      {activeSession && (
        <Link
          href={`/workouts/session?id=${activeSession.id}`}
          className="flex items-center justify-between px-5 py-4 rounded-r5 border border-[var(--color-accent-ring)] bg-[var(--color-accent-soft)] hover:bg-accent/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-r4 bg-accent flex items-center justify-center flex-shrink-0">
              <Play size={15} className="text-white" fill="white" />
            </div>
            <div>
              <p className="text-14 font-semibold text-text-primary">Resume workout</p>
              <p className="text-12 text-text-muted">
                {activeSession.templateName ?? "Ad-hoc session"} · started {new Date(activeSession.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <span className="text-13 font-medium text-accent">Continue →</span>
        </Link>
      )}

      <WorkoutSuggestion
        readinessScore={readiness.score}
        readinessLabel={readiness.label}
        lastSleepHrs={lastSleepHrs}
        hrv={hrv !== null ? Number(hrv) : null}
        hasEnoughData={hasReadinessData}
      />

      <TemplatesSection templates={templates} />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <HistorySection sessions={history} />
        <WeekPanel sessions={history} />
      </div>
    </div>
  );
}
