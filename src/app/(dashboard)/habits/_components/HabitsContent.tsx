"use client";

import { HabitList } from "./HabitList";
import { StreaksPanel } from "./StreaksPanel";
import { StreakGrid } from "./StreakGrid";
import type { HabitRow, HabitLogEntry } from "../actions";

// Kept for page.tsx import compatibility — no longer used for grid layout
export interface LayoutItem {
  i: string; x: number; y: number; w: number; h: number;
}

export interface HabitsContentProps {
  habits: HabitRow[];
  allLogs: HabitLogEntry[];
  username: string;
  habitsLayout?: unknown;
}

export function HabitsContent({ habits, allLogs, username }: HabitsContentProps) {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">Habits</h1>
        <p className="text-13 text-text-secondary mt-0.5">These aren&apos;t tasks — they&apos;re practices that define who you&apos;re becoming.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <HabitList habits={habits} username={username} />
        <StreaksPanel habits={habits} allLogs={allLogs} />
      </div>
      <StreakGrid habits={habits} allLogs={allLogs} />
    </div>
  );
}
