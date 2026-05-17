export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Dumbbell } from "lucide-react";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getTemplates, getWorkoutHistory } from "./actions";
import { TemplateCard } from "./_components/TemplateCard";
import { HistorySection } from "./_components/HistorySection";
import { WeekPanel } from "./_components/WeekPanel";

export default async function WorkoutsPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [templates, history] = await Promise.all([getTemplates(), getWorkoutHistory()]);

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-32 font-semibold text-text-primary tracking-tight">
            Workouts
          </h1>
          <p className="text-13 text-text-secondary mt-1">
            Track your training, build templates, and log sessions.
          </p>
        </div>
        <Link
          href="/workouts/templates/new"
          className="flex items-center gap-2 px-4 py-2 rounded-pill bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors flex-shrink-0"
        >
          <Plus size={15} />
          Log workout
        </Link>
      </div>

      {/* Templates section */}
      <div className="rounded-r5 border border-border bg-bg-surface">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="font-display text-15 font-semibold text-text-primary">Templates</span>
            <span className="font-mono text-11 text-text-muted bg-bg-elevated px-2 py-0.5 rounded-pill">
              {templates.length}
            </span>
          </div>
          <Link
            href="/workouts/templates/new"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill border border-border bg-bg-elevated hover:bg-bg-overlay text-text-secondary text-12 font-medium transition-colors"
            style={{ background: "var(--color-accent-soft)", borderColor: "var(--color-accent-ring)", color: "var(--color-accent)" }}
          >
            <Plus size={12} />
            New template
          </Link>
        </div>

        <div className="p-5">
          {templates.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="w-12 h-12 rounded-r5 bg-bg-elevated flex items-center justify-center">
                <Dumbbell size={22} className="text-text-muted" />
              </div>
              <div>
                <p className="font-display text-15 font-semibold text-text-primary">No templates yet</p>
                <p className="text-13 text-text-secondary mt-1">
                  Create a template to quickly start a workout session.
                </p>
              </div>
              <Link
                href="/workouts/templates/new"
                className="flex items-center gap-2 px-4 py-2 rounded-pill bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors"
              >
                <Plus size={14} />
                Create your first template
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((t) => (
                <TemplateCard key={t.id} template={t} />
              ))}
              <NewTemplateCard />
            </div>
          )}
        </div>
      </div>

      {/* This week section */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <HistorySection sessions={history} />
        <WeekPanel sessions={history} />
      </div>
    </div>
  );
}

function NewTemplateCard() {
  return (
    <Link
      href="/workouts/templates/new"
      className="flex flex-col items-center justify-center gap-2 rounded-r5 border-2 border-dashed border-border hover:border-border-strong bg-bg-inset hover:bg-bg-surface transition-colors min-h-[140px] group"
    >
      <div className="w-9 h-9 rounded-r4 bg-bg-elevated group-hover:bg-bg-overlay flex items-center justify-center transition-colors">
        <Plus size={16} className="text-text-muted" />
      </div>
      <span className="text-12 font-medium text-text-muted group-hover:text-text-secondary transition-colors">
        New template
      </span>
    </Link>
  );
}
