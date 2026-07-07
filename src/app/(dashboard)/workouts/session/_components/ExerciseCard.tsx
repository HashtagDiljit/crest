"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Minus, Link2, Trash2, Check } from "lucide-react";
import type { TemplateExerciseRow, SessionSetRow } from "../../actions";
import type { LoggingType } from "../../actions";

// Muscle group accent colours
const CAT_COLORS: Record<string, { accent: string; bg: string }> = {
  back:      { accent: "#3B82F6", bg: "rgba(59,130,246,0.18)" },
  legs:      { accent: "#EAB308", bg: "rgba(234,179,8,0.18)" },
  chest:     { accent: "#22C55E", bg: "rgba(34,197,94,0.18)" },
  arms:      { accent: "#F97316", bg: "rgba(249,115,22,0.18)" },
  shoulders: { accent: "#A855F7", bg: "rgba(168,85,247,0.18)" },
  core:      { accent: "#14B8A6", bg: "rgba(20,184,166,0.18)" },
  cardio:    { accent: "#EF4444", bg: "rgba(239,68,68,0.18)" },
  olympic:   { accent: "#EC4899", bg: "rgba(236,72,153,0.18)" },
  full_body: { accent: "#64b4a0", bg: "rgba(100,180,160,0.18)" },
};

export function categoryStyle(cat: string | null | undefined) {
  return CAT_COLORS[cat?.toLowerCase() ?? ""] ?? { accent: "#94A3B8", bg: "rgba(148,163,184,0.14)" };
}

// ─── Set pill ────────────────────────────────────────────────────────────────
interface SetPillProps { set: SessionSetRow; loggingType: LoggingType; isLatest: boolean }

function SetPill({ set, loggingType, isLatest }: SetPillProps) {
  let top = "";
  let bot = "";
  const secs = set.duration_seconds ?? 0;
  const mins = Math.floor(secs / 60);
  const sec = secs % 60;
  const dur = `${mins}:${String(sec).padStart(2, "0")}`;

  if (loggingType === "weight_reps") {
    top = `${set.weight_kg ?? 0}kg`;
    bot = `${set.reps ?? 0} rep`;
  } else if (loggingType === "time_distance") {
    top = `${set.distance_km ?? 0}km`;
    bot = dur;
  } else if (loggingType === "time_reps") {
    top = dur;
    bot = `${set.reps ?? 0} rep`;
  } else if (loggingType === "time_weight") {
    top = `${set.weight_kg ?? 0}kg`;
    bot = dur;
  } else {
    top = dur;
    bot = `${set.reps ?? 0} fl`;
  }

  return (
    <div className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-r2 min-w-[54px] transition-colors ${isLatest ? "bg-bg-overlay" : "bg-bg-elevated"}`}>
      <span className="text-11 font-bold text-text-primary leading-none">{top}</span>
      <span className="text-10 text-text-muted leading-none mt-0.5">{bot}</span>
    </div>
  );
}

// ─── Inline numeric stepper ─────────────────────────────────────────────────
interface NumStepperProps {
  label: string;
  value: number;
  unit: string;
  step: number;
  min?: number;
  isInt?: boolean;
  focusFirst?: boolean;
  onChange: (v: number) => void;
}

function NumStepper({ label, value, unit, step, min = 0, isInt = false, focusFirst, onChange }: NumStepperProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [display, setDisplay] = useState(() => isInt ? String(Math.round(value)) : value.toFixed(1));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDisplay(isInt ? String(Math.round(value)) : value.toFixed(1));
  }, [value, isInt, focused]);

  useEffect(() => {
    if (focusFirst) { setTimeout(() => ref.current?.focus(), 100); }
  }, [focusFirst]);

  function commit(raw: string) {
    setFocused(false);
    const parsed = isInt ? parseInt(raw, 10) : parseFloat(raw);
    if (isNaN(parsed)) { onChange(min); setDisplay(isInt ? String(min) : min.toFixed(1)); return; }
    const v = Math.max(min, parsed);
    onChange(v);
    setDisplay(isInt ? String(Math.round(v)) : v.toFixed(1));
  }

  return (
    <div className="flex-1 flex flex-col gap-1.5">
      <span className="text-10 font-semibold uppercase tracking-widest text-text-muted">{label}</span>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => { const v = Math.max(min, value - step); onChange(v); }}
          className="w-8 h-8 rounded-r2 bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-primary transition-colors flex-shrink-0">
          <Minus size={12} />
        </button>
        <div className="flex-1 flex items-baseline justify-center gap-0.5">
          <input
            ref={ref}
            type={isInt ? "tel" : "text"}
            inputMode={isInt ? "numeric" : "decimal"}
            pattern={isInt ? "[0-9]*" : "[0-9]*\\.?[0-9]*"}
            value={focused ? display : (isInt ? String(Math.round(value)) : value.toFixed(1))}
            onFocus={(e) => { setFocused(true); setDisplay(e.target.value); const len = e.target.value.length; e.target.setSelectionRange(len, len); }}
            onChange={(e) => setDisplay(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            className="w-full text-center font-mono text-[22px] font-bold text-text-primary bg-transparent outline-none min-w-0"
          />
          <span className="text-11 text-text-muted flex-shrink-0">{unit}</span>
        </div>
        <button type="button" onClick={() => onChange(value + step)}
          className="w-8 h-8 rounded-r2 bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-primary transition-colors flex-shrink-0">
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

// Duration MM:SS stepper
function DurStepper({ value, onChange, focusFirst }: { value: number; onChange: (v: number) => void; focusFirst?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [display, setDisplay] = useState(() => { const m = Math.floor(value / 60), s = value % 60; return `${m}:${String(s).padStart(2, "0")}`; });
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) { const m = Math.floor(value / 60), s = value % 60; setDisplay(`${m}:${String(s).padStart(2, "0")}`); }
  }, [value, focused]);

  useEffect(() => {
    if (focusFirst) setTimeout(() => ref.current?.focus(), 100);
  }, [focusFirst]);

  function commit(raw: string) {
    setFocused(false);
    const parts = raw.split(":");
    let secs = 0;
    if (parts.length === 2) { secs = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0); }
    else { secs = parseInt(raw, 10) || 0; }
    onChange(Math.max(0, secs));
    const m = Math.floor(secs / 60), s = secs % 60;
    setDisplay(`${m}:${String(s).padStart(2, "0")}`);
  }

  return (
    <div className="flex-1 flex flex-col gap-1.5">
      <span className="text-10 font-semibold uppercase tracking-widest text-text-muted">Duration</span>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => onChange(Math.max(0, value - 15))} className="w-8 h-8 rounded-r2 bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-primary transition-colors flex-shrink-0">
          <Minus size={12} />
        </button>
        <div className="flex-1 flex items-baseline justify-center gap-0.5">
          <input
            ref={ref}
            type="text"
            inputMode="decimal"
            value={focused ? display : (() => { const m = Math.floor(value / 60), s = value % 60; return `${m}:${String(s).padStart(2, "0")}`; })()}
            onFocus={(e) => { setFocused(true); setDisplay(e.target.value); const len = e.target.value.length; e.target.setSelectionRange(len, len); }}
            onChange={(e) => setDisplay(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            className="w-full text-center font-mono text-[22px] font-bold text-text-primary bg-transparent outline-none min-w-0"
          />
          <span className="text-11 text-text-muted flex-shrink-0">min</span>
        </div>
        <button type="button" onClick={() => onChange(value + 15)} className="w-8 h-8 rounded-r2 bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-primary transition-colors flex-shrink-0">
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── ExerciseCard ─────────────────────────────────────────────────────────────
export interface ExerciseCardProps {
  exercise: TemplateExerciseRow;
  index: number;
  loggedSets: SessionSetRow[];
  isActive: boolean;
  targetSets: number | null;
  weight: number;
  reps: number;
  durationSeconds: number;
  distanceKm: number;
  floors: number;
  currentSetType: "warmup" | "working" | "dropset" | "failure";
  isDeload: boolean;
  suggestedWeight: number;
  focusSignal: number;
  isSupersetLinked: boolean;
  isLastExercise: boolean;
  onActivate: () => void;
  onCompleteSet: () => Promise<void>;
  onWeightChange: (v: number) => void;
  onRepsChange: (v: number) => void;
  onDurationChange: (v: number) => void;
  onDistanceChange: (v: number) => void;
  onFloorsChange: (v: number) => void;
  onSetTypeChange: (t: "warmup" | "working" | "dropset" | "failure") => void;
  onAddSet: () => void;
  onRemoveSet: () => void;
  onRemoveExercise: () => void;
  onToggleSuperset: () => void;
  onUpdateSet: (set: SessionSetRow, updates: { weightKg?: number; reps?: number; durationSeconds?: number; distanceKm?: number }) => Promise<void>;
  onDeleteSet: (set: SessionSetRow) => Promise<void>;
}

export function ExerciseCard({
  exercise, loggedSets, isActive, targetSets,
  weight, reps, durationSeconds, distanceKm, floors,
  currentSetType, isDeload, suggestedWeight, focusSignal,
  isSupersetLinked, isLastExercise,
  onActivate, onCompleteSet, onWeightChange, onRepsChange,
  onDurationChange, onDistanceChange, onFloorsChange,
  onSetTypeChange, onAddSet, onRemoveSet,
  onRemoveExercise, onToggleSuperset,
}: ExerciseCardProps) {
  const ex = exercise.exercise;
  const loggingType: LoggingType = (ex.logging_type as LoggingType) ?? "weight_reps";
  const style = categoryStyle(ex.category);
  const done = loggedSets.length;
  const allDone = targetSets !== null && done >= targetSets;
  const showInput = isActive;
  const [completing, setCompleting] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  async function handleComplete() {
    if (completing) return;
    setCompleting(true);
    await onCompleteSet();
    setCompleting(false);
  }

  const SET_TYPES = [
    { t: "warmup"  as const, lbl: "W-up", col: "text-warning" },
    { t: "working" as const, lbl: "Work", col: "text-accent" },
    { t: "dropset" as const, lbl: "Drop", col: "text-success" },
    { t: "failure" as const, lbl: "Fail", col: "text-danger" },
  ];

  const completeLabel = allDone
    ? `Add extra set ${done + 1}`
    : targetSets !== null
      ? `Complete set ${done + 1} / ${targetSets}`
      : `Complete set ${done + 1}`;

  return (
    <div
      className={`rounded-r4 border transition-all ${
        isActive ? "border-accent/40 bg-bg-surface" : "border-border bg-bg-surface"
      } ${isSupersetLinked ? "rounded-b-none border-b-0" : ""}`}
      onClick={!isActive ? onActivate : undefined}
    >
      {/* Card header row */}
      <div className="flex items-start gap-3 p-4">
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-r3 flex-shrink-0 flex items-center justify-center text-20 font-bold select-none" style={{ background: style.bg, color: style.accent }}>
          {ex.name.charAt(0).toUpperCase()}
        </div>

        {/* Name + equipment + set pills */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-display text-15 font-bold text-text-primary leading-tight truncate">{ex.name}</span>
            {ex.equipment && <span className="text-12 text-text-muted flex-shrink-0">· {ex.equipment}</span>}
            {isDeload && <span className="text-10 font-semibold text-warning px-1.5 py-0.5 rounded-pill bg-warning/10">Deload</span>}
          </div>

          {/* Set pills */}
          {loggedSets.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-2">
              {loggedSets.map((s, i) => (
                <SetPill key={s.id} set={s} loggingType={loggingType} isLatest={i === loggedSets.length - 1} />
              ))}
            </div>
          )}

          {/* Overload hint */}
          {suggestedWeight > 0 && loggingType === "weight_reps" && loggedSets.length === 0 && (
            <p className="text-11 text-accent mt-1.5">
              {isDeload ? `Deload: ${suggestedWeight}kg` : `Try ${suggestedWeight}kg`}
            </p>
          )}

          {/* Progress dots — only shown when there is a target */}
          {targetSets !== null && (
            <div className="flex gap-1 mt-2">
              {Array.from({ length: targetSets }).map((_, i) => (
                <div key={i} className="h-1 flex-1 rounded-pill" style={{ background: i < done ? style.accent : "var(--color-bg-elevated)" }} />
              ))}
            </div>
          )}
        </div>

        {/* Right buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Superset link button */}
          {!isLastExercise && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleSuperset(); }}
              title={isSupersetLinked ? "Unlink superset" : "Link as superset"}
              className={`w-8 h-8 rounded-r3 flex items-center justify-center transition-colors ${
                isSupersetLinked ? "text-accent bg-accent/10" : "text-text-muted hover:text-text-primary bg-bg-elevated"
              }`}
            >
              <Link2 size={14} />
            </button>
          )}

          {/* + / activate button */}
          {!isActive && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onActivate(); }}
              className="w-8 h-8 rounded-r3 flex items-center justify-center transition-colors bg-bg-elevated text-text-muted hover:text-text-primary"
            >
              <Plus size={16} />
            </button>
          )}

          {/* Trash / remove */}
          {confirmRemove ? (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemoveExercise(); }}
                className="px-2 h-7 rounded-r2 text-10 font-semibold bg-error/15 text-error hover:bg-error/25 transition-colors"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setConfirmRemove(false); }}
                className="px-2 h-7 rounded-r2 text-10 font-semibold bg-bg-elevated text-text-muted hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setConfirmRemove(true); }}
              className="w-8 h-8 rounded-r3 flex items-center justify-center text-text-disabled hover:text-error transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Inline set input — always visible when this exercise is active */}
      {showInput && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3 flex flex-col gap-3">
          {/* Set type pills + inputs on same row */}
          <div className="flex items-stretch gap-3">
            {/* Set type pills — vertical stack on the left */}
            <div className="flex flex-col gap-1 justify-center flex-shrink-0">
              {SET_TYPES.map(({ t, lbl, col }) => (
                <button
                  key={t}
                  onClick={() => onSetTypeChange(t)}
                  className={`px-2 h-6 rounded-pill text-10 font-semibold border transition-colors whitespace-nowrap ${
                    currentSetType === t ? `border-current bg-bg-elevated ${col}` : "border-border text-text-disabled"
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>

            {/* Input fields based on logging type */}
            <div className="flex-1 flex gap-2">
              {loggingType === "weight_reps" && (
                <>
                  <NumStepper label="Weight" value={weight} unit="kg" step={2.5} min={0} isInt={false} focusFirst={focusSignal > 0} onChange={onWeightChange} />
                  <NumStepper label="Reps" value={reps} unit="rep" step={1} min={1} isInt onChange={onRepsChange} />
                </>
              )}
              {loggingType === "time_distance" && (
                <>
                  <DurStepper value={durationSeconds} onChange={onDurationChange} focusFirst={focusSignal > 0} />
                  <NumStepper label="Distance" value={distanceKm} unit="km" step={0.1} min={0} isInt={false} onChange={onDistanceChange} />
                </>
              )}
              {loggingType === "time_reps" && (
                <>
                  <DurStepper value={durationSeconds} onChange={onDurationChange} focusFirst={focusSignal > 0} />
                  <NumStepper label="Reps" value={reps} unit="rep" step={1} min={1} isInt onChange={onRepsChange} />
                </>
              )}
              {loggingType === "time_weight" && (
                <>
                  <DurStepper value={durationSeconds} onChange={onDurationChange} focusFirst={focusSignal > 0} />
                  <NumStepper label="Weight" value={weight} unit="kg" step={2.5} min={0} isInt={false} onChange={onWeightChange} />
                </>
              )}
              {loggingType === "time_floors" && (
                <>
                  <DurStepper value={durationSeconds} onChange={onDurationChange} focusFirst={focusSignal > 0} />
                  <NumStepper label="Floors" value={floors} unit="fl" step={1} min={0} isInt onChange={onFloorsChange} />
                </>
              )}
            </div>
          </div>

          {/* Complete / extra set button */}
          <button
            onClick={handleComplete}
            disabled={completing}
            className="w-full h-11 rounded-r3 text-white font-semibold text-14 transition-colors flex items-center justify-center gap-2"
            style={{ background: allDone ? "var(--color-accent)" : style.accent }}
          >
            {completing ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Check size={16} strokeWidth={2.5} />
            )}
            {completing ? "Logging…" : completeLabel}
          </button>

          {/* Add / remove set */}
          <div className="flex items-center justify-between">
            <button
              onClick={onRemoveSet}
              disabled={targetSets !== null ? targetSets <= done + 1 : done <= 0}
              className="flex items-center gap-1 text-11 text-text-muted hover:text-text-secondary transition-colors disabled:opacity-30"
            >
              <Minus size={11} /> Remove set
            </button>
            <span className="font-mono text-10 text-text-disabled">
              {targetSets !== null ? `${done}/${targetSets} sets` : `${done} sets`}
            </span>
            <button onClick={onAddSet} className="flex items-center gap-1 text-11 text-text-muted hover:text-text-secondary transition-colors">
              <Plus size={11} /> Add set
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Superset connector ───────────────────────────────────────────────────────
export function SupersetConnector() {
  return (
    <div className="flex items-center gap-2 px-4 -my-0.5 relative z-10">
      <div className="w-14 flex items-center justify-center flex-shrink-0">
        <div className="w-px h-6 bg-accent/40" />
      </div>
      <div className="flex items-center gap-1.5 text-10 text-accent/60">
        <Link2 size={11} />
        <span className="font-semibold uppercase tracking-wider">Superset</span>
      </div>
    </div>
  );
}
