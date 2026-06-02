"use client";

import { useState } from "react";
import type { HabitRow, HabitLogEntry } from "../actions";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

interface Props {
  habits: HabitRow[];
  allLogs: HabitLogEntry[];
}

export function StreaksPanel({ habits, allLogs }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(habits[0]?.id ?? null);

  const activeCount = habits.length;
  const longestStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    weekDates.push(d.toISOString().split("T")[0]);
  }

  const logSet = new Set(allLogs.filter((l) => l.completed).map((l) => `${l.habitId}:${l.date}`));

  // Count days this week where at least one habit was completed
  const thisWeekDone = weekDates.filter((date) =>
    habits.some((h) => logSet.has(`${h.id}:${date}`))
  ).length;

  const selected = habits.find((h) => h.id === selectedId);
  const todayStr = new Date().toISOString().split("T")[0];

  // For the selected habit, build last 7 days with done/skip/missed status
  const selectedWeekDots = weekDates.map((date) => {
    const done = selected ? logSet.has(`${selected.id}:${date}`) : false;
    const isFuture = date > todayStr;
    return { date, done, isFuture };
  });

  // Pattern summary (neutral language)
  let patternSummary: string | null = null;
  if (selected && selected.streak > 0) {
    const last7 = weekDates.filter((d) => d <= todayStr);
    const last7Done = last7.filter((d) => logSet.has(`${selected.id}:${d}`)).length;
    patternSummary = `${last7Done} of the last ${last7.length} days`;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-4">
        <h2 className="font-display text-15 font-semibold text-text-primary">Patterns</h2>

        <div className="grid grid-cols-3 gap-2">
          <StatTile label="Practices" value={String(activeCount)} />
          <StatTile label="Best run" value={`${longestStreak}d`} />
          <StatTile label="This week" value={`${thisWeekDone}/7`} />
        </div>

        {habits.length > 0 && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Practice</label>
              <select
                value={selectedId ?? ""}
                onChange={(e) => setSelectedId(e.target.value)}
                className="rounded-r3 border border-border bg-bg-base px-3 py-2 text-13 text-text-primary outline-none focus:border-accent transition-colors"
              >
                {habits.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            {patternSummary && (
              <p className="text-12 text-text-muted">
                Logged <span className="font-semibold text-text-primary">{patternSummary}</span>
              </p>
            )}

            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-7 gap-1 text-center">
                {DAYS.map((d, i) => (
                  <span key={i} className="text-10 font-mono text-text-muted">{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {selectedWeekDots.map(({ date, done, isFuture }) => (
                  <div
                    key={date}
                    title={date}
                    className={`h-7 rounded-r3 transition-colors ${
                      isFuture
                        ? "bg-bg-elevated border border-dashed border-border opacity-30"
                        : done
                          ? "bg-accent"
                          : "bg-bg-elevated border border-border"
                    }`}
                  />
                ))}
              </div>
            </div>

            {selected?.skipUsed && (
              <p className="text-11 text-text-muted flex items-center gap-1">
                <span className="text-orange-400">↩</span>
                {selected.streak} day run · 1 skip used this week
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-r4 border border-border bg-bg-elevated p-3 flex flex-col gap-0.5">
      <span className="font-mono text-18 font-semibold text-text-primary">{value}</span>
      <span className="text-11 text-text-muted">{label}</span>
    </div>
  );
}
