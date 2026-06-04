"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { setTrainingBlock } from "../actions";
import type { TrainingBlock, TrainingBlockData } from "../actions";

interface BlockMeta {
  id: TrainingBlock;
  label: string;
  duration: string;
  focus: string;
  cue: string;
  color: string;
}

const BLOCKS: BlockMeta[] = [
  {
    id: "base",
    label: "Base",
    duration: "4–6 weeks",
    focus: "Technique + volume",
    cue: "Build the foundation. Higher reps (8–12), moderate load, focus on movement quality and muscle-mind connection.",
    color: "var(--color-info)",
  },
  {
    id: "build",
    label: "Build",
    duration: "4–6 weeks",
    focus: "Hypertrophy + progressive overload",
    cue: "Increase weight systematically. Target 6–10 reps. Apply the overload increment from your training settings each session.",
    color: "var(--color-accent)",
  },
  {
    id: "peak",
    label: "Peak",
    duration: "2–3 weeks",
    focus: "Strength expression",
    cue: "Lower reps (3–5), high intensity. Test near-maximal loads. RPE 8–9+. Minimal volume, maximum effort per set.",
    color: "var(--color-warning)",
  },
  {
    id: "deload",
    label: "Deload",
    duration: "1 week",
    focus: "Recovery",
    cue: "Reduce volume by 40–50% and intensity by 20%. Keep movement patterns fresh. Sleep, eat well, and prepare for the next cycle.",
    color: "var(--color-success)",
  },
];

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000));
}

interface Props {
  blockData: TrainingBlockData;
}

export function TrainingBlockSection({ blockData }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState<TrainingBlock | null>(blockData.current_training_block);
  const [blockStart, setBlockStart] = useState<string | null>(blockData.block_start_date);

  const currentMeta = BLOCKS.find((b) => b.id === current);
  const days = daysSince(blockStart);

  async function handleSelect(block: TrainingBlock) {
    setSaving(true);
    const result = await setTrainingBlock(block);
    if (!result.error) {
      setCurrent(block);
      setBlockStart(new Date().toISOString().split("T")[0]);
    }
    setSaving(false);
  }

  return (
    <div className="rounded-r5 border border-border bg-bg-surface overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-bg-elevated transition-colors"
      >
        <div className="flex items-center gap-3">
          <div>
            <span className="font-display text-15 font-semibold text-text-primary">Training block</span>
            {currentMeta ? (
              <span className="ml-2 text-12 font-medium px-2 py-0.5 rounded-pill" style={{ color: currentMeta.color, background: "var(--color-bg-elevated)" }}>
                {currentMeta.label} · day {days}
              </span>
            ) : (
              <span className="ml-2 text-12 text-text-disabled">Not set</span>
            )}
          </div>
        </div>
        {open ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
      </button>

      {open && (
        <div className="px-5 pb-5 flex flex-col gap-4">
          {currentMeta && (
            <div className="rounded-r3 border p-3 text-13 text-text-secondary leading-relaxed" style={{ borderColor: `color-mix(in srgb, ${currentMeta.color} 30%, transparent)`, background: `color-mix(in srgb, ${currentMeta.color} 8%, transparent)` }}>
              <span className="font-semibold text-text-primary">{currentMeta.focus}:</span> {currentMeta.cue}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BLOCKS.map((b) => {
              const isActive = current === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  disabled={saving}
                  onClick={() => handleSelect(b.id)}
                  className={`flex flex-col gap-1 p-3 rounded-r4 border text-left transition-all ${isActive ? "border-[var(--color-accent-ring)] bg-[var(--color-accent-soft)]" : "border-border bg-bg-elevated hover:bg-bg-overlay"}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
                    <span className={`text-13 font-semibold ${isActive ? "text-text-primary" : "text-text-secondary"}`}>{b.label}</span>
                  </div>
                  <span className="text-11 text-text-muted">{b.duration}</span>
                  <span className="text-11 text-text-muted leading-snug">{b.focus}</span>
                </button>
              );
            })}
          </div>

          <p className="text-11 text-text-disabled">
            Periodisation: cycle Base → Build → Peak → Deload. One full cycle ≈ 13–16 weeks. After deload, start Base again or repeat the phase that needs more work.
          </p>
        </div>
      )}
    </div>
  );
}
