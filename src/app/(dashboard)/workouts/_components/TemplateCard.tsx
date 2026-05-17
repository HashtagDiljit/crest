"use client";

import { Dumbbell, Play } from "lucide-react";
import { startSession } from "../actions";
import type { TemplateRow } from "../actions";

function estimateDuration(template: TemplateRow): number {
  if (!template.exercises.length) return 0;
  return template.exercises.reduce((total, te) => {
    const sets = te.sets_target ?? 3;
    return total + Math.round((sets * (120 + 45)) / 60);
  }, 0);
}

interface Props {
  template: TemplateRow;
}

export function TemplateCard({ template }: Props) {
  const exerciseNames = template.exercises.map((te) => te.exercise.name).filter(Boolean);
  const shown = exerciseNames.slice(0, 3);
  const remaining = exerciseNames.length - shown.length;
  const duration = estimateDuration(template);

  async function handleStart() {
    await startSession(template.id);
  }

  return (
    <div className="flex flex-col gap-3 rounded-r4 border border-border bg-bg-inset p-4 hover:border-border-strong transition-colors cursor-default">
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-r3 flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-strong)" }}
        >
          <Dumbbell size={17} className="text-accent" strokeWidth={1.75} />
        </div>
      </div>

      <div>
        <p className="font-display text-[14px] font-semibold text-text-primary leading-tight">
          {template.name}
        </p>
        <p className="font-mono text-11 text-text-muted mt-1">
          {template.exercises.length} exercises · ~{duration} min
        </p>
      </div>

      {shown.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {shown.map((name) => (
            <span key={name} className="text-11 px-2 py-0.5 rounded-pill bg-bg-surface border border-border text-text-secondary">
              {name}
            </span>
          ))}
          {remaining > 0 && (
            <span className="text-11 px-2 py-0.5 rounded-pill bg-bg-surface border border-border text-text-muted">
              +{remaining}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="font-mono text-11 text-text-muted">last · never</span>
        <button
          type="button"
          onClick={handleStart}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-accent hover:bg-accent-hover text-white text-11 font-semibold transition-colors"
          style={{ boxShadow: "0 0 0 1px var(--color-accent-ring), 0 4px 14px rgba(108,99,255,0.2)" }}
        >
          <Play size={10} fill="white" />
          Start
        </button>
      </div>
    </div>
  );
}
