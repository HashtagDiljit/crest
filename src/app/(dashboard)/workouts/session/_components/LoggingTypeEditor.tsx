"use client";

import { useState } from "react";
import { Dumbbell, Clock, ArrowRight, RotateCcw, Layers, X, Loader2 } from "lucide-react";
import { updateExerciseLoggingType } from "../../actions";
import type { LoggingType } from "../../actions";
import type { ExerciseRow } from "../../actions";

const OPTIONS: Array<{ type: LoggingType; label: string; sub: string; icon: React.ElementType }> = [
  { type: "weight_reps",    label: "Weight & reps",     sub: "Barbell, dumbbell, machine exercises",     icon: Dumbbell   },
  { type: "time_distance",  label: "Time & distance",   sub: "Running, rowing, cycling, swimming",       icon: ArrowRight },
  { type: "time_reps",     label: "Time & reps",        sub: "Isometric holds, planks",                  icon: RotateCcw  },
  { type: "time_weight",   label: "Time & weight",      sub: "Farmer carries, loaded carries",           icon: Layers     },
  { type: "time_floors",   label: "Time & floors",      sub: "Stair climbers, step machines",            icon: Clock      },
];

interface Props {
  exercise: ExerciseRow;
  onSave: (exerciseId: string, type: LoggingType) => void;
  onClose: () => void;
}

export function LoggingTypeEditor({ exercise, onSave, onClose }: Props) {
  const [selected, setSelected] = useState<LoggingType>(
    (exercise.logging_type as LoggingType) ?? "weight_reps"
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    await updateExerciseLoggingType(exercise.id, selected);
    onSave(exercise.id, selected);
    setSaving(false);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-r5 border-t border-border bg-bg-surface px-4 pt-5 pb-safe-bottom">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-display text-16 font-semibold text-text-primary">{exercise.name}</p>
            <p className="text-12 text-text-muted mt-0.5">Choose how to log this exercise</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2 mb-5">
          {OPTIONS.map(({ type, label, sub, icon: Icon }) => {
            const active = selected === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelected(type)}
                className={`flex items-center gap-3 p-4 rounded-r4 border text-left transition-colors ${
                  active
                    ? "border-accent bg-[var(--color-accent-soft)]"
                    : "border-border bg-bg-elevated hover:bg-bg-overlay"
                }`}
              >
                <div className={`w-9 h-9 rounded-r3 flex items-center justify-center flex-shrink-0 ${active ? "bg-accent/20" : "bg-bg-overlay"}`}>
                  <Icon size={16} className={active ? "text-accent" : "text-text-muted"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-14 font-medium ${active ? "text-text-primary" : "text-text-secondary"}`}>{label}</p>
                  <p className="text-11 text-text-muted mt-0.5">{sub}</p>
                </div>
                {active && <div className="w-4 h-4 rounded-full bg-accent flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-r3 bg-accent hover:bg-accent-hover text-white font-semibold text-14 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </>
  );
}
