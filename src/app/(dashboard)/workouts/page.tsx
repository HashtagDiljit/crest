export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, BookOpen, Play } from "lucide-react";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getTemplates, getWorkoutHistory, seedDefaultTemplates, getTrainingWeekCount, getActiveSession, getTrainingBlock } from "./actions";
import { TemplatesSection } from "./_components/TemplatesSection";
import { HistorySection } from "./_components/HistorySection";
import { WeekPanel } from "./_components/WeekPanel";
import { DeloadBanner } from "./_components/DeloadBanner";
import { TrainingBlockSection } from "./_components/TrainingBlockSection";

export default async function WorkoutsPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await seedDefaultTemplates();

  const [templates, history, weekCount, activeSession, blockData] = await Promise.all([
    getTemplates(), getWorkoutHistory(), getTrainingWeekCount(), getActiveSession(), getTrainingBlock(),
  ]);

  const showDeloadBanner = weekCount > 0 && weekCount % 4 === 0;

  return (
    <div className="flex flex-col gap-6">
      {showDeloadBanner && <DeloadBanner weekCount={weekCount} />}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">Workouts</h1>
          <p className="text-13 text-text-secondary mt-1">Track your training, build templates, and log sessions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/workouts/exercises"
            className="flex items-center gap-2 px-4 py-2 rounded-pill border border-border bg-bg-elevated hover:bg-bg-overlay text-text-secondary text-13 font-medium transition-colors flex-shrink-0"
          >
            <BookOpen size={14} />
            Exercises
          </Link>
          <Link
            href="/workouts/start"
            className="flex items-center gap-2 px-4 py-2 rounded-pill bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors flex-shrink-0"
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

      <TrainingBlockSection blockData={blockData} />

      <TemplatesSection templates={templates} />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <HistorySection sessions={history} />
        <WeekPanel sessions={history} />
      </div>
    </div>
  );
}
