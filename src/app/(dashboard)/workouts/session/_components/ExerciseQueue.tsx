"use client";

import { CheckCircle2, Circle, Plus, X, Link2, Unlink2 } from "lucide-react";
import type { TemplateExerciseRow, SessionSetRow } from "../../actions";

type ExerciseWithDetails = TemplateExerciseRow;

interface Props {
  exercises: ExerciseWithDetails[];
  loggedSets: SessionSetRow[];
  currentExIdx: number;
  onJump: (idx: number) => void;
  onAddExercise?: () => void;
  onRemoveExercise?: (id: string) => void;
  supersetLinks?: Set<number>;
  onToggleSuperset?: (idx: number) => void;
}

export function ExerciseQueue({
  exercises, loggedSets, currentExIdx, onJump,
  onAddExercise, onRemoveExercise,
  supersetLinks, onToggleSuperset,
}: Props) {
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
      <div>
        {exercises.map((ex, i) => {
          const done = loggedSets.filter((s) => s.exercise_id === ex.exercise_id).length;
          const target = ex.sets_target ?? 3;
          const isDone = done >= target;
          const isActive = i === currentExIdx;
          const canRemove = !isActive && done === 0;
          const isLinked = supersetLinks?.has(i) ?? false;
          const showConnector = i < exercises.length - 1;

          return (
            <div key={ex.id}>
              {/* Exercise row */}
              <div
                className="flex items-center hover:bg-bg-elevated transition-colors"
                style={isActive ? { background: "var(--color-accent-soft)" } : undefined}
              >
                <button
                  onClick={() => onJump(i)}
                  className="flex-1 flex items-center gap-3 px-4 py-3 text-left"
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
                    <span className="text-10 font-mono text-accent font-semibold">{done}/{target}</span>
                  )}
                </button>
                {canRemove && onRemoveExercise && (
                  <button
                    onClick={() => onRemoveExercise(ex.id)}
                    className="w-8 h-8 flex items-center justify-center mr-1 rounded-r2 text-text-disabled hover:text-danger hover:bg-bg-overlay transition-colors flex-shrink-0"
                    aria-label="Remove exercise"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Superset connector between this and next exercise */}
              {showConnector && onToggleSuperset && (
                <div className="flex items-center px-4 py-1 gap-2">
                  <div className="flex-1 h-px bg-border" />
                  <button
                    onClick={() => onToggleSuperset(i)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-pill text-10 font-medium border transition-colors ${
                      isLinked
                        ? "border-accent text-accent bg-[var(--color-accent-soft)]"
                        : "border-border text-text-disabled hover:text-text-muted hover:border-border-strong"
                    }`}
                  >
                    {isLinked ? <Unlink2 size={9} /> : <Link2 size={9} />}
                    {isLinked ? "superset" : "link"}
                  </button>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
