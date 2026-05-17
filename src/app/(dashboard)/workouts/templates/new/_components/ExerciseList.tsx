"use client";

import { Minus, Plus, ArrowUp, ArrowDown, X } from "lucide-react";
import type { TemplateExerciseEntry } from "../page";

interface Props {
  exercises: TemplateExerciseEntry[];
  onRemove: (idx: number) => void;
  onMove: (idx: number, dir: -1 | 1) => void;
  onChange: (idx: number, field: "setsTarget" | "repsTarget", val: number) => void;
}

export function ExerciseList({ exercises, onRemove, onMove, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-10 text-text-muted tracking-widest uppercase mb-1">
        Exercises ({exercises.length})
      </label>
      {exercises.map((ex, i) => (
        <ExerciseListRow
          key={ex.exerciseId}
          entry={ex}
          index={i}
          total={exercises.length}
          onRemove={() => onRemove(i)}
          onMoveUp={() => onMove(i, -1)}
          onMoveDown={() => onMove(i, 1)}
          onChangeSets={(v) => onChange(i, "setsTarget", v)}
          onChangeReps={(v) => onChange(i, "repsTarget", v)}
        />
      ))}
    </div>
  );
}

interface RowProps {
  entry: TemplateExerciseEntry;
  index: number;
  total: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onChangeSets: (v: number) => void;
  onChangeReps: (v: number) => void;
}

function ExerciseListRow({ entry, index, total, onRemove, onMoveUp, onMoveDown, onChangeSets, onChangeReps }: RowProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-r4 border border-border bg-bg-inset">
      <div className="flex flex-col gap-0.5">
        <button type="button" onClick={onMoveUp} disabled={index === 0} className="text-text-disabled hover:text-text-muted disabled:opacity-30 transition-colors">
          <ArrowUp size={12} />
        </button>
        <button type="button" onClick={onMoveDown} disabled={index === total - 1} className="text-text-disabled hover:text-text-muted disabled:opacity-30 transition-colors">
          <ArrowDown size={12} />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-13 font-medium text-text-primary truncate">{entry.name}</p>
        <p className="text-11 text-text-muted">{entry.muscle ?? "—"}</p>
      </div>

      <NumberInput label="Sets" value={entry.setsTarget} min={1} max={10} onChange={onChangeSets} />
      <NumberInput label="Reps" value={entry.repsTarget} min={1} max={100} onChange={onChangeReps} />

      <button type="button" onClick={onRemove} className="text-text-muted hover:text-danger transition-colors ml-1">
        <X size={14} />
      </button>
    </div>
  );
}

function NumberInput({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-mono text-9 text-text-muted uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
          <Minus size={10} />
        </button>
        <span className="font-mono text-13 text-text-primary w-6 text-center">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
          <Plus size={10} />
        </button>
      </div>
    </div>
  );
}
