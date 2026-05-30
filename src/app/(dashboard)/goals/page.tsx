"use client";

import { useState, useEffect } from "react";
import { Plus, ChevronDown, ChevronUp, Target } from "lucide-react";
import { getGoals } from "./actions";
import { GoalCard } from "./_components/GoalCard";
import { GoalModal } from "./_components/GoalModal";
import { useRouter } from "next/navigation";
import type { GoalRow } from "./actions";

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await getGoals();
    setGoals(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const active = goals.filter((g) => !g.completed_at);
  const completed = goals.filter((g) => g.completed_at);

  return (
    <>
      <div className="flex flex-col gap-6 max-w-4xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-32 font-semibold text-text-primary tracking-tight">Goals</h1>
            <p className="text-13 text-text-secondary mt-0.5">
              {active.length} active goal{active.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-pill bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors"
          >
            <Plus size={14} /> Add goal
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-text-muted text-13">Loading…</div>
        ) : active.length === 0 ? (
          <div className="rounded-r5 border border-border bg-bg-surface p-12 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-r5 bg-bg-elevated flex items-center justify-center">
              <Target size={20} className="text-text-disabled" />
            </div>
            <div>
              <p className="font-display text-15 font-semibold text-text-primary">No active goals</p>
              <p className="text-13 text-text-secondary mt-1">Set a goal to stay focused and track progress.</p>
            </div>
            <button onClick={() => setShowModal(true)} className="text-13 text-accent hover:text-accent-hover transition-colors">
              Create your first goal →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {active.map((g) => <GoalCard key={g.id} goal={g} />)}
          </div>
        )}

        {completed.length > 0 && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowCompleted((v) => !v)}
              className="flex items-center gap-2 text-13 font-semibold text-text-muted hover:text-text-secondary transition-colors"
            >
              {showCompleted ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Completed goals ({completed.length})
            </button>
            {showCompleted && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 opacity-60">
                {completed.map((g) => <GoalCard key={g.id} goal={g} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <GoalModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); load(); router.refresh(); }}
        />
      )}
    </>
  );
}
