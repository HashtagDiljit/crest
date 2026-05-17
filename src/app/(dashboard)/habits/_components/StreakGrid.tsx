"use client";

import type { HabitRow, HabitLogEntry } from "../actions";

const HABIT_COLORS = [
  "#6C63FF", "#22C55E", "#F59E0B", "#38BDF8", "#FB923C", "#F472B6",
  "#A78BFA", "#34D399", "#FBBF24", "#60A5FA",
];

const WEEKS = 26;

interface Props {
  habits: HabitRow[];
  allLogs: HabitLogEntry[];
}

export function StreakGrid({ habits, allLogs }: Props) {
  if (habits.length === 0) return null;

  const logSet = new Set(allLogs.filter((l) => l.completed).map((l) => `${l.habitId}:${l.date}`));

  // Build grid: 26 weeks × 7 days, ending today
  const today = new Date();
  const todayDow = today.getDay(); // 0=Sun → we want Sun=6 in Mon-first grid
  const mondayOffset = todayDow === 0 ? -6 : 1 - todayDow;
  const gridStart = new Date(today);
  gridStart.setDate(today.getDate() + mondayOffset - (WEEKS - 1) * 7);

  const columns: Date[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + w * 7 + d);
      week.push(day);
    }
    columns.push(week);
  }

  return (
    <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-5">
      <h2 className="font-display text-15 font-semibold text-text-primary">All habits — last 6 months</h2>
      <div className="flex flex-col gap-3 overflow-x-auto">
        {habits.map((habit, hi) => {
          const color = HABIT_COLORS[hi % HABIT_COLORS.length];
          return (
            <div key={habit.id} className="flex items-center gap-3 min-w-0">
              <span
                className="text-12 font-medium text-text-secondary truncate flex-shrink-0"
                style={{ width: "100px" }}
                title={habit.name}
              >
                {habit.name}
              </span>
              <div className="flex gap-0.5 flex-shrink-0">
                {columns.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-0.5">
                    {week.map((day) => {
                      const dateStr = day.toISOString().split("T")[0];
                      const isFuture = day > today;
                      const done = !isFuture && logSet.has(`${habit.id}:${dateStr}`);
                      return (
                        <div
                          key={dateStr}
                          title={`${dateStr}${done ? " ✓" : ""}`}
                          className="w-3 h-3 rounded-[2px] transition-colors"
                          style={{ background: isFuture ? "transparent" : done ? color : "var(--color-bg-elevated)" }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
