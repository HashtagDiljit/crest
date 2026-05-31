export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getTemplates, getWorkoutHistory, seedDefaultTemplates, getTrainingWeekCount } from "./actions";
import { TemplatesSection } from "./_components/TemplatesSection";
import { HistorySection } from "./_components/HistorySection";
import { WeekPanel } from "./_components/WeekPanel";
import { DeloadBanner } from "./_components/DeloadBanner";

export default async function WorkoutsPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await seedDefaultTemplates();

  const [templates, history, weekCount] = await Promise.all([
    getTemplates(), getWorkoutHistory(), getTrainingWeekCount(),
  ]);

  const showDeloadBanner = weekCount > 0 && weekCount % 4 === 0;

  return (
    <div className="flex flex-col gap-6">
      {showDeloadBanner && <DeloadBanner weekCount={weekCount} />}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-32 font-semibold text-text-primary tracking-tight">Workouts</h1>
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

      <TemplatesSection templates={templates} />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <HistorySection sessions={history} />
        <WeekPanel sessions={history} />
      </div>
    </div>
  );
}
