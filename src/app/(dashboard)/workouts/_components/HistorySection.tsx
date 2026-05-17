"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
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

export function HistorySection({ sessions }: Props) {
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = filter === "All" ? sessions : [];

  return (
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
            <HistoryRow key={session.id} session={session} />
          ))
        )}
      </div>
    </div>
  );
}

function HistoryRow({ session }: { session: HistorySession }) {
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
    </div>
  );
}
