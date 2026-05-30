"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Check, Trophy } from "lucide-react";
import { toggleMilestone, completeGoal } from "../actions";
import { useRouter } from "next/navigation";
import type { GoalRow } from "../actions";

const CATEGORY_COLORS: Record<string, string> = {
  fitness: "var(--color-accent)",
  health: "var(--color-success)",
  career: "var(--color-warning)",
  personal: "#F472B6",
};

interface Props {
  goal: GoalRow;
}

function daysRemaining(targetDate: string | null): number | null {
  if (!targetDate) return null;
  const diff = new Date(targetDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function GoalCard({ goal }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimisticMilestones, setOptimisticMilestones] = useState(goal.milestones);
  const [completing, setCompleting] = useState(false);

  const progress = optimisticMilestones.length > 0
    ? Math.round((optimisticMilestones.filter((m) => m.completed_at).length / optimisticMilestones.length) * 100)
    : goal.progress;

  const days = daysRemaining(goal.target_date);
  const catColor = CATEGORY_COLORS[goal.category ?? ""] ?? "var(--color-text-muted)";

  function handleToggleMilestone(msId: string, done: boolean) {
    setOptimisticMilestones((prev) => prev.map((m) => m.id === msId ? { ...m, completed_at: done ? null : new Date().toISOString() } : m));
    startTransition(() => toggleMilestone(msId, !done));
  }

  async function handleComplete() {
    setCompleting(true);
    await completeGoal(goal.id);
    router.refresh();
  }

  return (
    <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-16 font-semibold text-text-primary leading-tight">{goal.title}</p>
          <div className="flex items-center gap-2 mt-1">
            {goal.category && (
              <span className="text-11 font-medium capitalize" style={{ color: catColor }}>{goal.category}</span>
            )}
            {days !== null && (
              <span className={`font-mono text-11 ${days < 0 ? "text-danger" : days < 7 ? "text-warning" : "text-text-muted"}`}>
                {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          <span className="font-mono text-20 font-bold text-text-primary">{progress}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-pill bg-bg-elevated overflow-hidden">
        <div
          className="h-full rounded-pill transition-all duration-500"
          style={{ width: `${progress}%`, background: progress >= 100 ? "var(--color-success)" : "var(--color-accent)" }}
        />
      </div>

      {/* Milestones */}
      {optimisticMilestones.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {optimisticMilestones.map((m) => {
            const done = !!m.completed_at;
            return (
              <button
                key={m.id}
                onClick={() => handleToggleMilestone(m.id, done)}
                className="flex items-center gap-2.5 text-left hover:opacity-80 transition-opacity group"
              >
                {done
                  ? <CheckCircle2 size={15} className="text-success flex-shrink-0" />
                  : <Circle size={15} className="text-text-disabled group-hover:text-accent flex-shrink-0 transition-colors" />
                }
                <span className={`text-13 ${done ? "text-text-muted line-through" : "text-text-secondary"}`}>{m.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {progress < 100 && (
        <button
          onClick={handleComplete}
          disabled={completing}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-r3 border border-success text-success text-12 font-semibold hover:bg-success hover:text-white transition-colors disabled:opacity-50"
        >
          <Check size={13} />
          {completing ? "Completing…" : "Mark complete"}
        </button>
      )}

      {progress >= 100 && (
        <div className="flex items-center gap-1.5 text-12 text-success font-semibold">
          <Trophy size={13} />
          Goal reached!
        </div>
      )}
    </div>
  );
}
