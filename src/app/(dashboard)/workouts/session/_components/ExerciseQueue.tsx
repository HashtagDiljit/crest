"use client";

import { CheckCircle2, Circle, Plus } from "lucide-react";
import type { TemplateExerciseRow, SessionSetRow } from "../../actions";

type ExerciseWithDetails = TemplateExerciseRow;

interface Props {
  exercises: ExerciseWithDetails[];
  loggedSets: SessionSetRow[];
  currentExIdx: number;
  onJump: (idx: number) => void;
  onAddExercise?: () => void;
}

export function ExerciseQueue({ exercises, loggedSets, currentExIdx, onJump, onAddExercise }: Props) {
  return (
    <div className="rounded-r5 border border-border bg-bg-surface">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="font-display text-13 font-semibold text-text-primary">Up next</span>
        {onAddExercise && (
          <button
            onClick={onAddExercise}
            className="flex items-center gap-1 text-12 font-medium transition-colors"
            style={{ color: "var(--color-accent)" }}
          >
            <Plus size={12} /> Add
          </button>
        )}
      </div>
      <div className="divide-y divide-border">
        {exercises.map((ex, i) => {
          const done = loggedSets.filter((s) => s.exercise_id === ex.exercise_id).length;
          const target = ex.sets_target ?? 3;
          const isDone = done >= target;
          const isActive = i === currentExIdx;
          return (
            <button
              key={ex.id}
              onClick={() => onJump(i)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-elevated transition-colors ${
                isActive ? "" : ""
              }`}
              style={isActive ? { background: "var(--color-accent-soft)" } : undefined}
            >
              {isDone ? (
                <CheckCircle2 size={16} className="text-success flex-shrink-0" />
              ) : (
                <Circle
                  size={16}
                  className={`flex-shrink-0 ${isActive ? "text-accent" : "text-text-disabled"}`}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-13 font-medium truncate ${isDone ? "text-text-muted" : "text-text-primary"}`}>
                  {ex.exercise?.name ?? "Exercise"}
                </p>
                <p className="font-mono text-10 text-text-muted">
                  {target}×{ex.reps_target ?? 5} · 2m rest
                </p>
              </div>
              {isActive && (
                <span className="text-10 font-mono text-accent font-semibold">
                  {done}/{target}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
