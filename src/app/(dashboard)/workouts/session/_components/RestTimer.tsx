"use client";

import { Timer } from "lucide-react";

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface Props {
  remaining: number;
  total: number;
  onAdjust: (delta: number) => void;
  onSkip: () => void;
  onChangeTotal: (v: number) => void;
}

export function RestTimer({ remaining, total, onAdjust, onSkip, onChangeTotal }: Props) {
  if (total <= 0 && remaining <= 0) return null;

  const isResting = remaining > 0;
  const progress = total > 0 ? remaining / total : 0;

  return (
    <div
      className={`rounded-r5 border p-4 flex flex-col gap-3 transition-colors ${
        isResting ? "border-accent" : "border-border bg-bg-surface"
      }`}
      style={isResting ? { background: "linear-gradient(135deg, var(--color-bg-surface), var(--color-accent-soft))", borderColor: "var(--color-accent)" } : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer size={14} className={isResting ? "text-accent" : "text-text-muted"} />
          <span className="font-mono text-10 text-text-muted tracking-widest uppercase">Rest</span>
        </div>
        {!isResting && (
          <div className="flex items-center gap-1">
            {[60, 90, 120, 180].map((v) => (
              <button
                key={v}
                onClick={() => onChangeTotal(v)}
                className={`font-mono text-10 px-2 py-0.5 rounded-pill transition-colors ${
                  total === v ? "bg-accent text-white" : "bg-bg-elevated text-text-muted hover:text-text-secondary"
                }`}
              >
                {v / 60}m
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        <span className={`font-mono tabular-nums font-bold ${isResting ? "text-[44px] text-accent" : "text-[32px] text-text-muted"}`}>
          {formatTime(remaining > 0 ? remaining : total)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-pill bg-bg-elevated overflow-hidden">
        <div
          className={`h-full rounded-pill transition-all ${isResting ? "bg-accent" : "bg-bg-overlay"}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {isResting && (
        <div className="flex gap-2">
          <button
            onClick={() => onAdjust(-15)}
            className="flex-1 py-1.5 rounded-r3 bg-bg-elevated hover:bg-bg-overlay text-text-secondary text-12 font-mono transition-colors"
          >
            −15s
          </button>
          <button
            onClick={() => onAdjust(15)}
            className="flex-1 py-1.5 rounded-r3 bg-bg-elevated hover:bg-bg-overlay text-text-secondary text-12 font-mono transition-colors"
          >
            +15s
          </button>
          <button
            onClick={onSkip}
            className="flex-1 py-1.5 rounded-r3 bg-bg-elevated hover:bg-bg-overlay text-text-secondary text-12 font-medium transition-colors"
          >
            Skip
          </button>
        </div>
      )}
    </div>
  );
}
