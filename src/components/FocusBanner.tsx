"use client";

import { Target, X } from "lucide-react";
import { useState } from "react";

interface Props {
  focus: string;
  startDate: string;
  endDate: string;
}

function daysLeft(endDate: string): number {
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));
}

function elapsed(startDate: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000));
}

export function FocusBanner({ focus, startDate, endDate }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const day = elapsed(startDate);
  const left = daysLeft(endDate);
  const pct = Math.min(Math.round((day / 90) * 100), 100);

  return (
    <div className="rounded-r4 border border-[var(--color-accent-ring)] bg-[var(--color-accent-soft)] px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-r3 bg-accent flex items-center justify-center flex-shrink-0">
        <Target size={14} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-12 font-semibold text-text-muted uppercase tracking-widest">90-day focus · day {day}</span>
        </div>
        <p className="text-13 font-semibold text-text-primary truncate">{focus}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1 rounded-pill bg-bg-overlay overflow-hidden">
            <div className="h-full rounded-pill bg-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-11 text-text-muted flex-shrink-0">{left}d left</span>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-text-muted hover:text-text-secondary transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
