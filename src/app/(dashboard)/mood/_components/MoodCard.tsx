"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogMoodModal } from "./LogMoodModal";
import type { MoodLogRow } from "../actions";

const MOOD_META: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: "😞", label: "Rough", color: "#7C3AED" },
  2: { emoji: "😕", label: "Low", color: "#8B5CF6" },
  3: { emoji: "😐", label: "Okay", color: "#6C63FF" },
  4: { emoji: "🙂", label: "Good", color: "#34D399" },
  5: { emoji: "😄", label: "Great", color: "#22C55E" },
};

interface Props {
  todayLog: MoodLogRow | null;
  thirtyDayAvg: number | null;
}

export function MoodCard({ todayLog, thirtyDayAvg }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const meta = todayLog?.score ? MOOD_META[todayLog.score] : null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="rounded-r5 border border-border bg-bg-surface p-6 flex flex-col gap-4 text-left hover:border-border-strong transition-colors w-full"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-15 font-semibold text-text-primary">Today&apos;s mood</h2>
            <p className="text-12 text-text-muted mt-0.5">Tap to log</p>
          </div>
          {thirtyDayAvg !== null && (
            <div className="text-right">
              <p className="font-mono text-18 font-semibold text-text-primary">{thirtyDayAvg.toFixed(1)}</p>
              <p className="text-11 text-text-muted">30d avg</p>
            </div>
          )}
        </div>

        {meta ? (
          <div className="flex items-center gap-4">
            <span className="text-56">{meta.emoji}</span>
            <div>
              <p className="font-display text-32 font-bold" style={{ color: meta.color }}>{meta.label}</p>
              <p className="font-mono text-13 text-text-muted">{todayLog?.score}/5</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <span className="text-56 opacity-30">😐</span>
            <div>
              <p className="font-display text-20 font-semibold text-text-muted">Not logged yet</p>
              <p className="text-13 text-text-secondary">How are you feeling today?</p>
            </div>
          </div>
        )}

        {todayLog?.note && (
          <p className="text-13 text-text-secondary italic border-l-2 border-border pl-3">&ldquo;{todayLog.note}&rdquo;</p>
        )}
      </button>

      {showModal && (
        <LogMoodModal
          currentScore={todayLog?.score ?? null}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); router.refresh(); }}
        />
      )}
    </>
  );
}
