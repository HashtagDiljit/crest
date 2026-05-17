export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Dumbbell, Plus } from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";
import { getTemplates } from "../actions";
import { StartButtons } from "./_components/StartButtons";
import type { TemplateRow } from "../actions";

export default async function StartWorkoutPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const templates = await getTemplates();

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/workouts"
          className="w-8 h-8 rounded-r3 border border-border bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="font-display text-32 font-semibold text-text-primary tracking-tight">
            Start workout
          </h1>
          <p className="text-13 text-text-secondary mt-0.5">
            Pick a template or start a blank session.
          </p>
        </div>
      </div>

      <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-3">
        <h2 className="font-display text-15 font-semibold text-text-primary">Quick start</h2>
        <p className="text-13 text-text-secondary">
          Jump straight in — add exercises as you go.
        </p>
        <StartButtons.Blank />
      </div>

      <div className="rounded-r5 border border-border bg-bg-surface">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display text-15 font-semibold text-text-primary">
            From template
            <span className="font-mono text-11 text-text-muted ml-2 font-normal">{templates.length}</span>
          </h2>
          <Link
            href="/workouts/templates/new"
            className="flex items-center gap-1.5 text-13 text-accent hover:text-accent-hover transition-colors"
          >
            <Plus size={13} />
            New template
          </Link>
        </div>
        <div className="p-5">
          {templates.length === 0 ? (
            <EmptyTemplates />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map((t) => (
                <StartTemplateCard key={t.id} template={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyTemplates() {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="w-12 h-12 rounded-r5 bg-bg-elevated flex items-center justify-center">
        <Dumbbell size={20} className="text-text-disabled" />
      </div>
      <p className="text-13 text-text-secondary">No templates yet.</p>
      <Link
        href="/workouts/templates/new"
        className="text-13 text-accent hover:text-accent-hover transition-colors"
      >
        Create your first template →
      </Link>
    </div>
  );
}

function StartTemplateCard({ template }: { template: TemplateRow }) {
  const names = template.exercises.slice(0, 3).map((te) => te.exercise.name);
  const more = template.exercises.length - names.length;

  return (
    <div className="flex flex-col gap-3 rounded-r4 border border-border bg-bg-inset hover:border-border-strong transition-colors p-4">
      <div>
        <p className="font-display text-14 font-semibold text-text-primary">{template.name}</p>
        <p className="font-mono text-11 text-text-muted mt-0.5">
          {template.exercises.length} exercises
        </p>
      </div>
      {names.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {names.map((n) => (
            <span key={n} className="text-11 px-2 py-0.5 rounded-pill bg-bg-surface border border-border text-text-secondary">
              {n}
            </span>
          ))}
          {more > 0 && (
            <span className="text-11 px-2 py-0.5 rounded-pill bg-bg-surface border border-border text-text-muted">
              +{more}
            </span>
          )}
        </div>
      )}
      <StartButtons.Template templateId={template.id} />
    </div>
  );
}
