"use client";

import { Timer } from "lucide-react";

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface Props {
  templateName: string;
  exerciseName: string;
  elapsed: number;
  onEnd: () => void;
  ending: boolean;
}

export function SessionHeader({ templateName, exerciseName, elapsed, onEnd, ending }: Props) {
  return (
    <div className="rounded-r5 border border-border bg-bg-surface px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-mono text-10 text-text-muted tracking-widest uppercase">
          In session · {templateName}
        </span>
        <h3 className="font-display text-18 font-semibold text-text-primary leading-tight truncate">
          {exerciseName || templateName}
        </h3>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Timer size={14} className="text-text-muted" />
          <span className="font-mono text-[22px] font-semibold text-text-primary tabular-nums">
            {formatTime(elapsed)}
          </span>
        </div>
        <button
          onClick={onEnd}
          disabled={ending}
          className="px-4 py-2 rounded-pill border border-danger text-danger text-13 font-semibold hover:bg-danger hover:text-white transition-colors disabled:opacity-50"
        >
          {ending ? "Ending…" : "End session"}
        </button>
      </div>
    </div>
  );
}
