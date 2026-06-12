"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { SessionSetRow } from "../../actions";

type LoggingType = "weight_reps" | "time_distance" | "time_reps" | "time_weight";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  warmup:  { label: "Warm-up", color: "text-warning" },
  working: { label: "Working", color: "text-accent" },
  dropset: { label: "Drop set", color: "text-success" },
  failure: { label: "Failure", color: "text-danger" },
};

export interface SetUpdate {
  weightKg?: number;
  reps?: number;
  durationSeconds?: number;
  distanceKm?: number;
}

interface Props {
  sets: SessionSetRow[];
  targetSets: number;
  currentSetIdx: number;
  loggingType?: LoggingType;
  onUpdateSet?: (set: SessionSetRow, updates: SetUpdate) => void;
  onDeleteSet?: (set: SessionSetRow) => void;
}

function fmtDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null) return "—";
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function SetTable({ sets, targetSets, currentSetIdx, loggingType = "weight_reps", onUpdateSet, onDeleteSet }: Props) {
  const rows = Array.from({ length: targetSets }, (_, i) => sets[i] ?? null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editReps, setEditReps] = useState("");

  const showWeight = loggingType === "weight_reps" || loggingType === "time_weight";
  const showReps = loggingType === "weight_reps";
  const showDuration = loggingType !== "weight_reps";
  const showDistance = loggingType === "time_distance";

  function startEdit(set: SessionSetRow) {
    setEditingId(set.id);
    setEditWeight(String(set.weight_kg ?? 0));
    setEditReps(String(set.reps ?? 0));
  }

  function commitEdit(set: SessionSetRow) {
    if (!onUpdateSet) { setEditingId(null); return; }
    const weightKg = Number(editWeight);
    const reps = Number(editReps);
    const updates: SetUpdate = {};
    if (showWeight && !Number.isNaN(weightKg) && weightKg !== set.weight_kg) updates.weightKg = weightKg;
    if (showReps && !Number.isNaN(reps) && reps !== set.reps) updates.reps = reps;
    if (Object.keys(updates).length > 0) onUpdateSet(set, updates);
    setEditingId(null);
  }

  return (
    <div className="rounded-r4 border border-border overflow-hidden">
      <table className="w-full text-12">
        <thead>
          <tr className="border-b border-border bg-bg-elevated">
            <th className="py-2 px-3 text-left font-mono text-10 text-text-muted tracking-widest uppercase">Set</th>
            <th className="py-2 px-2 text-center font-mono text-10 text-text-muted tracking-widest uppercase">Type</th>
            {showDuration && (
              <th className="py-2 px-3 text-right font-mono text-10 text-text-muted tracking-widest uppercase">Duration</th>
            )}
            {showDistance && (
              <th className="py-2 px-3 text-right font-mono text-10 text-text-muted tracking-widest uppercase">Distance</th>
            )}
            {showWeight && (
              <th className="py-2 px-3 text-right font-mono text-10 text-text-muted tracking-widest uppercase">Weight</th>
            )}
            {showReps && (
              <th className="py-2 px-3 text-right font-mono text-10 text-text-muted tracking-widest uppercase">Reps</th>
            )}
            <th className="py-2 px-3 text-center font-mono text-10 text-text-muted tracking-widest uppercase">✓</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((set, i) => {
            const isDone = set !== null;
            const isActive = i === currentSetIdx && !isDone;
            const isEditing = isDone && set.id === editingId;
            const typeInfo = isDone ? (TYPE_LABELS[set.set_type ?? "working"] ?? TYPE_LABELS.working) : null;
            return (
              <tr
                key={i}
                className={`group border-b border-border last:border-0 transition-colors ${isDone && !isEditing ? "opacity-60" : ""} ${
                  isDone && onUpdateSet ? "cursor-pointer" : ""
                }`}
                style={isActive ? { background: "var(--color-accent-soft)" } : undefined}
                onClick={() => {
                  if (isDone && set && !isEditing && onUpdateSet) startEdit(set);
                }}
              >
                <td className="py-2.5 px-3 font-mono text-text-secondary">{i + 1}</td>
                <td className="py-2.5 px-2 text-center">
                  {typeInfo ? (
                    <span className={`inline-block font-mono text-10 font-bold px-1.5 py-0.5 rounded-pill bg-bg-elevated whitespace-nowrap ${typeInfo.color}`}>{typeInfo.label}</span>
                  ) : (
                    <span className="text-text-disabled">—</span>
                  )}
                </td>
                {showDuration && (
                  <td className="py-2.5 px-3 text-right font-mono text-text-primary">
                    {isDone ? fmtDuration(set.duration_seconds) : "—"}
                  </td>
                )}
                {showDistance && (
                  <td className="py-2.5 px-3 text-right font-mono text-text-primary">
                    {isDone ? `${set.distance_km ?? 0}km` : "—"}
                  </td>
                )}
                {showWeight && (
                  <td className="py-2.5 px-3 text-right font-mono text-text-primary">
                    {isEditing ? (
                      <input
                        type="number"
                        inputMode="decimal"
                        autoFocus
                        value={editWeight}
                        onChange={(e) => setEditWeight(e.target.value)}
                        onBlur={() => commitEdit(set!)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                        className="w-16 bg-bg-elevated border border-border rounded-r2 px-1.5 py-0.5 text-right text-text-primary font-mono"
                      />
                    ) : isDone ? (
                      `${set.weight_kg ?? 0}kg`
                    ) : (
                      "—"
                    )}
                  </td>
                )}
                {showReps && (
                  <td className="py-2.5 px-3 text-right font-mono text-text-primary">
                    {isEditing ? (
                      <input
                        type="number"
                        inputMode="numeric"
                        value={editReps}
                        onChange={(e) => setEditReps(e.target.value)}
                        onBlur={() => commitEdit(set!)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                        className="w-14 bg-bg-elevated border border-border rounded-r2 px-1.5 py-0.5 text-right text-text-primary font-mono"
                      />
                    ) : isDone ? (
                      set.reps ?? "—"
                    ) : (
                      "—"
                    )}
                  </td>
                )}
                <td className="py-2.5 px-3 text-center">
                  {isDone ? (
                    onDeleteSet ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteSet(set); }}
                        className="text-text-disabled hover:text-danger transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Delete set"
                      >
                        <Trash2 size={13} />
                      </button>
                    ) : (
                      <span className="text-success font-bold">✓</span>
                    )
                  ) : (
                    <span className="text-text-disabled">○</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
