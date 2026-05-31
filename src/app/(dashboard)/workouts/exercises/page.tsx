export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";
import { getExercises } from "../actions";
import { ExerciseLibrary } from "./_components/ExerciseLibrary";

export default async function ExercisesPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const exercises = await getExercises();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/workouts"
          className="w-8 h-8 rounded-r3 border border-border bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">
            Exercise library
          </h1>
          <p className="text-13 text-text-secondary mt-0.5">
            {exercises.length} exercises · search, filter, or add your own.
          </p>
        </div>
      </div>
      <ExerciseLibrary exercises={exercises} />
    </div>
  );
}
