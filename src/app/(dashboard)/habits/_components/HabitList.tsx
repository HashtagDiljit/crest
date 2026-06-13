"use client";

import { useState, useOptimistic, useTransition } from "react";
import { Flame, Plus, Check, Copy } from "lucide-react";
import { toggleHabit, copyYesterdayHabits, createHabit } from "../actions";
import { track } from "@vercel/analytics";
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

const STREAK_MILESTONES = [7, 14, 30, 60, 90];

const SUGGESTED_HABITS: { name: string; category: string; frequency: string }[] = [
  { name: "Drink water", category: "health", frequency: "anytime" },
  { name: "Read 10 minutes", category: "mindset", frequency: "evening" },
  { name: "Meditate", category: "mindset", frequency: "morning" },
  { name: "Stretch", category: "fitness", frequency: "morning" },
  { name: "Walk 20 minutes", category: "fitness", frequency: "daytime" },
  { name: "Sleep by 11pm", category: "sleep", frequency: "evening" },
];

function milestoneMessage(habitName: string, streak: number): string | null {
  if (!STREAK_MILESTONES.includes(streak)) return null;
  return `You're becoming someone who ${habitName.toLowerCase()} consistently.`;
}

interface Props {
  habits: HabitRow[];
  username?: string;
}

export function HabitList({ habits, username }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [addingSuggestion, setAddingSuggestion] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [optimistic, setOptimistic] = useOptimistic(
    habits,
    (prev, { id, done }: { id: string; done: boolean }) =>
      prev.map((h) => h.id === id ? { ...h, completedToday: done } : h)
  );

  const today = new Date().toISOString().split("T")[0];
  const doneCount = optimistic.filter((h) => h.completedToday).length;
  const totalCount = optimistic.length;
  const beforeAfternoon = new Date().getHours() < 14;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function handleToggle(habit: HabitRow) {
    const done = !habit.completedToday;
    startTransition(async () => {
      setOptimistic({ id: habit.id, done });
      await toggleHabit(habit.id, today, habit.completedToday);
      if (done) {
        track("habit_completed", { habitId: habit.id, streak: habit.streak + 1 });
        const milestone = milestoneMessage(habit.name, habit.streak + 1);
        if (milestone) {
          showToast(milestone);
        } else if (username) {
          showToast(`That's what ${username} does.`);
        }
      }
    });
  }

  async function handleAddSuggestion(suggestion: { name: string; category: string; frequency: string }) {
    setAddingSuggestion(suggestion.name);
    const formData = new FormData();
    formData.set("name", suggestion.name);
    formData.set("category", suggestion.category);
    formData.set("frequency", suggestion.frequency);
    const result = await createHabit(formData);
    setAddingSuggestion(null);
    if (result.error) {
      showToast(result.error);
    } else {
      router.refresh();
      showToast(`Added "${suggestion.name}" to your practices.`);
    }
  }

  async function handleCopyYesterday() {
    setCopying(true);
    const result = await copyYesterdayHabits();
    setCopying(false);
    if (result.count > 0) {
      router.refresh();
      showToast(`Carried over ${result.count} practice${result.count > 1 ? "s" : ""} from yesterday.`);
    } else {
      showToast("Nothing was completed yesterday to carry over.");
    }
  }

  return (
    <>
      {toast && (
        <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-pill bg-bg-surface border border-border shadow-2xl text-13 text-text-primary font-medium max-w-xs text-center whitespace-nowrap">
          {toast}
        </div>
      )}

      <div className="rounded-r5 border border-border bg-bg-surface flex flex-col">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display text-15 font-semibold text-text-primary">Today</h2>
            <p className="font-mono text-11 text-text-muted mt-0.5">
              {doneCount > 0
                ? `${doneCount} of ${totalCount} done`
                : `${totalCount} practice${totalCount !== 1 ? "s" : ""} today`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {beforeAfternoon && totalCount > 0 && (
              <button
                onClick={handleCopyYesterday}
                disabled={copying}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-r3 text-12 font-medium border border-border bg-bg-elevated hover:bg-bg-overlay text-text-muted hover:text-text-secondary transition-colors"
              >
                <Copy size={12} />
                {copying ? "Copying…" : "Same as yesterday"}
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-r3 text-13 font-medium border transition-colors"
              style={{ background: "var(--color-accent-soft)", borderColor: "var(--color-accent-ring)", color: "var(--color-accent)" }}
            >
              <Plus size={13} /> Build a practice
            </button>
          </div>
        </div>

        {optimistic.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center px-8">
            <div className="w-12 h-12 rounded-r5 bg-bg-elevated flex items-center justify-center">
              <Flame size={20} className="text-text-disabled" />
            </div>
            <div>
              <p className="text-15 font-semibold text-text-primary">Start with one habit</p>
              <p className="text-13 text-text-secondary mt-1">Pick something small below, or build your own.</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
              {SUGGESTED_HABITS.map((s) => (
                <button
                  key={s.name}
                  onClick={() => handleAddSuggestion(s)}
                  disabled={addingSuggestion !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill border border-border bg-bg-elevated hover:bg-bg-overlay text-12 font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                >
                  <Plus size={12} />
                  {addingSuggestion === s.name ? "Adding…" : s.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="text-13 text-accent hover:text-accent-hover transition-colors"
            >
              Build your own practice →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {optimistic.map((habit) => (
              <HabitRowItem key={habit.id} habit={habit} onToggle={() => handleToggle(habit)} />
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

function HabitRowItem({ habit, onToggle }: { habit: HabitRow; onToggle: () => void }) {
  const catColor = CATEGORY_COLORS[habit.category ?? ""] ?? "var(--color-text-muted)";

  return (
    <div className="grid items-center px-5 py-3.5" style={{ gridTemplateColumns: "1fr auto 40px" }}>
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

      <div className="flex items-center gap-1 pr-3">
        <Flame size={13} className={habit.streak > 0 ? "text-orange-400" : "text-text-disabled"} />
        <span className={`font-mono text-12 font-semibold ${habit.streak > 0 ? "text-orange-400" : "text-text-disabled"}`}>
          {habit.streak}
        </span>
        {habit.skipUsed && (
          <span className="text-10 text-text-disabled ml-0.5" title="1 skip used this week">↩</span>
        )}
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
