"use client";

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
        hint={`set ${setNum} / ${totalSets}`}
      />
      <StepperInput
        label="Reps"
        value={reps}
        unit="reps"
        step={1}
        onChange={onRepsChange}
        min={1}
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
  hint: string;
}

function StepperInput({ label, value, unit, step, onChange, min, hint }: StepperProps) {
  return (
    <div className="flex-1 flex flex-col gap-2 rounded-r4 border border-border bg-bg-inset p-3">
      <span className="font-mono text-10 text-text-muted tracking-widest uppercase">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-9 h-9 rounded-r3 bg-bg-elevated hover:bg-bg-overlay text-text-secondary flex items-center justify-center transition-colors"
        >
          <Minus size={14} />
        </button>
        <div className="flex-1 text-center">
          <span className="font-mono text-[28px] font-bold text-text-primary tabular-nums">
            {Number.isInteger(value) ? value : value.toFixed(1)}
          </span>
          <span className="font-mono text-12 text-text-muted ml-1">{unit}</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(value + step)}
          className="w-9 h-9 rounded-r3 bg-bg-elevated hover:bg-bg-overlay text-text-secondary flex items-center justify-center transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
      <span className="font-mono text-10 text-text-muted text-center">{hint}</span>
    </div>
  );
}
