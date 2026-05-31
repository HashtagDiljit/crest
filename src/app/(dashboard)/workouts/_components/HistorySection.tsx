"use client";

import { useState, useRef, useEffect } from "react";
import { Activity, MoreHorizontal, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteWorkoutSession } from "../actions";
import type { HistorySession } from "../actions";

const FILTERS = ["All", "Strength", "Cardio", "Mobility"] as const;
type Filter = (typeof FILTERS)[number];

function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return "--";
  const mins = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface Props {
  sessions: HistorySession[];
}

export function HistorySection({ sessions: initialSessions }: Props) {
  const [filter, setFilter] = useState<Filter>("All");
  const [sessions, setSessions] = useState(initialSessions);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const filtered = filter === "All" ? sessions : [];

  async function handleDelete(sessionId: string) {
    setDeleting(true);
    await deleteWorkoutSession(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setConfirmDeleteId(null);
    setDeleting(false);
    router.refresh();
  }

  return (
    <>
      <div className="rounded-r5 border border-border bg-bg-surface">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-3">
          <span className="font-display text-15 font-semibold text-text-primary">This week</span>
          <div className="flex items-center gap-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-pill text-12 font-medium transition-colors ${
                  filter === f
                    ? "bg-accent text-white"
                    : "bg-bg-elevated text-text-muted hover:text-text-secondary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="w-10 h-10 rounded-r4 bg-bg-elevated flex items-center justify-center">
                <Activity size={18} className="text-text-muted" />
              </div>
              <div>
                <p className="text-14 font-medium text-text-primary">No sessions yet</p>
                <p className="text-12 text-text-secondary mt-0.5">Start a workout to see your history here.</p>
              </div>
            </div>
          ) : (
            filtered.map((session) => (
              <HistoryRow
                key={session.id}
                session={session}
                onDeleteRequest={() => setConfirmDeleteId(session.id)}
              />
            ))
          )}
        </div>
      </div>

      {confirmDeleteId && (
        <ConfirmDeleteDialog
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
          deleting={deleting}
        />
      )}
    </>
  );
}

function HistoryRow({
  session,
  onDeleteRequest,
}: {
  session: HistorySession;
  onDeleteRequest: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div className="flex items-center gap-4 px-5 py-3 hover:bg-bg-elevated transition-colors">
      <div className="w-9 h-9 rounded-r4 bg-bg-elevated flex items-center justify-center flex-shrink-0">
        <Activity size={15} className="text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-13 font-semibold text-text-primary truncate">
          {session.template_name ?? "Workout"}
        </p>
        <p className="text-11 text-text-muted">
          {session.sets_count} sets · {formatDuration(session.started_at, session.ended_at)}
        </p>
      </div>
      <span className="text-11 font-mono text-text-muted flex-shrink-0">
        {formatDate(session.started_at)}
      </span>
      <div className="relative flex-shrink-0" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-7 h-7 rounded-r2 hover:bg-bg-overlay flex items-center justify-center text-text-disabled hover:text-text-muted transition-colors"
          aria-label="Options"
        >
          <MoreHorizontal size={14} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 w-40 rounded-r4 border border-border bg-bg-elevated shadow-2xl z-30">
            <button
              onClick={() => { setMenuOpen(false); onDeleteRequest(); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-13 text-danger hover:bg-bg-overlay rounded-r4 transition-colors"
            >
              <Trash2 size={13} />
              Delete session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmDeleteDialog({
  onConfirm,
  onCancel,
  deleting,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-r5 border border-border bg-bg-surface p-6 flex flex-col gap-5">
        <div>
          <p className="font-display text-16 font-semibold text-text-primary">Delete this session?</p>
          <p className="text-13 text-text-secondary mt-2 leading-relaxed">
            This will also remove any PRs set during this session. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2 rounded-r3 border border-border text-13 text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2 rounded-r3 bg-danger text-white text-13 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
