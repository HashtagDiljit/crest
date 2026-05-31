"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";

interface Props {
  weight: number;
  reps: number;
  onWeightChange: (v: number) => void;
  onRepsChange: (v: number) => void;
  setNum: number;
  totalSets: number;
}

export function Steppers({ weight, reps, onWeightChange, onRepsChange, setNum, totalSets }: Props) {
  return (
    <div className="flex gap-4">
      <StepperInput
        label="Weight"
        value={weight}
        unit="kg"
        step={2.5}
        onChange={onWeightChange}
        min={0}
        isInt={false}
        hint={`set ${setNum} / ${totalSets}`}
      />
      <StepperInput
        label="Reps"
        value={reps}
        unit="reps"
        step={1}
        onChange={onRepsChange}
        min={1}
        isInt={true}
        hint={`set ${setNum} / ${totalSets}`}
      />
    </div>
  );
}

interface StepperProps {
  label: string;
  value: number;
  unit: string;
  step: number;
  onChange: (v: number) => void;
  min: number;
  isInt: boolean;
  hint: string;
}

function fmt(v: number, isInt: boolean): string {
  if (isInt) return String(Math.round(v));
  return Number.isInteger(v) ? v.toFixed(1) : v.toFixed(1);
}

function StepperInput({ label, value, unit, step, onChange, min, isInt, hint }: StepperProps) {
  const [display, setDisplay] = useState(() => fmt(value, isInt));
  const [focused, setFocused] = useState(false);

  // Sync from parent when not editing (e.g. +/- button)
  useEffect(() => {
    if (!focused) setDisplay(fmt(value, isInt));
  }, [value, isInt, focused]);

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    setFocused(true);
    // Select all so typing immediately replaces the current value
    e.target.select();
  }

  function handleChange(raw: string) {
    if (isInt) {
      // Strip everything except digits
      setDisplay(raw.replace(/\D/g, ""));
    } else {
      // Strip everything except digits and the first decimal point
      const cleaned = raw.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
      setDisplay(cleaned);
    }
  }

  function handleBlur() {
    setFocused(false);
    const parsed = isInt ? parseInt(display, 10) : parseFloat(display);
    if (isNaN(parsed) || parsed < 0) {
      onChange(0);
      setDisplay("0");
    } else {
      const clamped = Math.max(min, parsed);
      onChange(clamped);
      setDisplay(fmt(clamped, isInt));
    }
  }

  return (
    <div className="flex-1 flex flex-col gap-2 rounded-r4 border border-border bg-bg-inset p-3">
      <span className="font-mono text-10 text-text-muted tracking-widest uppercase">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-9 h-9 rounded-r3 bg-bg-elevated hover:bg-bg-overlay text-text-secondary flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Minus size={14} />
        </button>
        <div className="flex-1 flex items-baseline justify-center gap-1 min-w-0">
          <input
            type="text"
            inputMode={isInt ? "numeric" : "decimal"}
            value={display}
            onFocus={handleFocus}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            className="w-full text-center font-mono text-[28px] font-bold text-text-primary tabular-nums bg-transparent outline-none border-b border-transparent focus:border-accent transition-colors min-w-0"
          />
          <span className="font-mono text-12 text-text-muted flex-shrink-0">{unit}</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(value + step)}
          className="w-9 h-9 rounded-r3 bg-bg-elevated hover:bg-bg-overlay text-text-secondary flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Plus size={14} />
        </button>
      </div>
      <span className="font-mono text-10 text-text-muted text-center">{hint}</span>
    </div>
  );
}
