"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, TrendingUp, Zap, Award, Trash2, Loader2 } from "lucide-react";
import { deleteWorkoutSession } from "../../actions";
import type { PRResult } from "../../actions";

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

interface Props {
  sessionId: string;
  setsCount: number;
  durationSecs: number;
  prs: PRResult[];
}

export function SessionSummary({ sessionId, setsCount, durationSecs, prs }: Props) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await deleteWorkoutSession(sessionId);
    router.replace("/workouts");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-md rounded-r5 border border-border bg-bg-surface shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-r4 bg-[var(--color-accent-soft)] flex items-center justify-center">
            <Trophy size={20} className="text-accent" />
          </div>
          <div>
            <h2 className="font-display text-18 font-semibold text-text-primary">Session complete</h2>
            <p className="text-12 text-text-muted">{formatDuration(durationSecs)}</p>
          </div>
        </div>

        <div className="px-6 py-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <StatTile icon={<Zap size={14} className="text-warning" />} label="Sets logged" value={String(setsCount)} />
            <StatTile icon={<TrendingUp size={14} className="text-success" />} label="Duration" value={formatDuration(durationSecs)} />
          </div>

          {prs.length > 0 && (
            <div className="rounded-r4 border border-[var(--color-warning)] bg-[rgba(245,158,11,0.08)] p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Award size={14} className="text-warning" />
                <span className="text-13 font-semibold text-text-primary">{prs.length} new personal record{prs.length > 1 ? "s" : ""}!</span>
              </div>
              {prs.map((pr) => (
                <div key={`${pr.exerciseId}-${pr.prType}`} className="flex items-center justify-between">
                  <span className="text-12 text-text-secondary truncate flex-1 mr-2">{pr.exerciseName}</span>
                  <span className="text-11 font-mono font-semibold text-warning flex-shrink-0">
                    {pr.prType === "load"
                      ? `${pr.weightKg}kg load PR`
                      : `${pr.reps} reps @ ${pr.weightKg}kg`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {confirmDelete && (
            <div className="rounded-r4 border border-danger border-opacity-40 bg-danger bg-opacity-5 p-4">
              <p className="text-13 text-text-primary font-semibold mb-1">Delete this session?</p>
              <p className="text-12 text-text-secondary mb-3">This will also remove any PRs set during this session. This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-1.5 rounded-r3 border border-border text-13 text-text-secondary">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-1.5 rounded-r3 bg-danger text-white text-13 font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  {deleting ? "Deleting…" : "Confirm delete"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex gap-2">
          {!confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-3 py-2.5 rounded-r3 border border-border text-text-muted hover:text-danger hover:border-danger transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={() => router.push("/workouts")}
            className="flex-1 py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors"
          >
            Back to workouts
          </button>
        </div>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-r4 border border-border bg-bg-elevated p-3 flex items-center gap-2">
      {icon}
      <div>
        <p className="font-mono text-16 font-semibold text-text-primary">{value}</p>
        <p className="text-11 text-text-muted">{label}</p>
      </div>
    </div>
  );
}
