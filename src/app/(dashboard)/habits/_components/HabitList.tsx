"use client";

import { useState, useOptimistic, useTransition } from "react";
import { Flame, Plus, Check } from "lucide-react";
import { toggleHabit } from "../actions";
import { HabitModal } from "./HabitModal";
import type { HabitRow } from "../actions";
import { useRouter } from "next/navigation";

const CATEGORY_COLORS: Record<string, string> = {
  health: "#22C55E",
  fitness: "#6C63FF",
  mindset: "#A39CFF",
  productivity: "#F59E0B",
  sleep: "#38BDF8",
  nutrition: "#FB923C",
};

interface Props {
  habits: HabitRow[];
}

export function HabitList({ habits }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(habits, (prev, { id, done }: { id: string; done: boolean }) =>
    prev.map((h) => h.id === id ? { ...h, completedToday: done, streak: done ? h.streak + 1 : Math.max(0, h.streak - 1) } : h)
  );

  const today = new Date().toISOString().split("T")[0];
  const doneCount = optimistic.filter((h) => h.completedToday).length;

  function handleToggle(habit: HabitRow) {
    const done = !habit.completedToday;
    startTransition(async () => {
      setOptimistic({ id: habit.id, done });
      await toggleHabit(habit.id, today, habit.completedToday);
    });
  }

  return (
    <>
      <div className="rounded-r5 border border-border bg-bg-surface flex flex-col">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-display text-15 font-semibold text-text-primary">Today</h2>
            <p className="font-mono text-11 text-text-muted mt-0.5">
              {doneCount} of {optimistic.length} done
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-r3 text-13 font-medium border transition-colors"
            style={{ background: "var(--color-accent-soft)", borderColor: "var(--color-accent-ring)", color: "var(--color-accent)" }}
          >
            <Plus size={13} /> New habit
          </button>
        </div>

        {optimistic.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="w-12 h-12 rounded-r5 bg-bg-elevated flex items-center justify-center">
              <Flame size={20} className="text-text-disabled" />
            </div>
            <p className="text-13 text-text-secondary">No habits yet.</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-13 text-accent hover:text-accent-hover transition-colors"
            >
              Add your first habit →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {optimistic.map((habit) => (
              <HabitRow key={habit.id} habit={habit} onToggle={() => handleToggle(habit)} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <HabitModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); router.refresh(); }}
        />
      )}
    </>
  );
}

function HabitRow({ habit, onToggle }: { habit: HabitRow; onToggle: () => void }) {
  const catColor = CATEGORY_COLORS[habit.category ?? ""] ?? "var(--color-text-muted)";

  return (
    <div className="grid items-center px-5 py-3.5" style={{ gridTemplateColumns: "1fr 80px 40px" }}>
      <div className="min-w-0">
        <p className="text-14 font-medium text-text-primary truncate">{habit.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {habit.category && (
            <span className="text-11 font-medium capitalize" style={{ color: catColor }}>
              {habit.category}
            </span>
          )}
          {habit.frequency && (
            <span className="text-11 text-text-muted capitalize">{habit.frequency}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 justify-end pr-3">
        <Flame size={13} className={habit.streak > 0 ? "text-[var(--color-streak)]" : "text-text-disabled"} />
        <span className={`font-mono text-12 font-semibold ${habit.streak > 0 ? "text-[var(--color-streak)]" : "text-text-disabled"}`}>
          {habit.streak}
        </span>
      </div>

      <button
        onClick={onToggle}
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
          habit.completedToday
            ? "bg-accent border-accent text-white"
            : "border-border-strong bg-bg-elevated hover:border-accent"
        }`}
        aria-label={habit.completedToday ? "Mark incomplete" : "Mark complete"}
      >
        {habit.completedToday && <Check size={14} strokeWidth={3} />}
      </button>
    </div>
  );
}
