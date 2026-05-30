"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { createGoal } from "../actions";

const CATEGORIES = ["fitness", "health", "career", "personal"];

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function GoalModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("fitness");
  const [targetDate, setTargetDate] = useState("");
  const [milestones, setMilestones] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    const ms = milestones.map((m) => m.trim()).filter(Boolean);
    const result = await createGoal(title, category, targetDate, ms);
    if (result.error) { setError(result.error); setSaving(false); }
    else onCreated();
  }

  function updateMilestone(i: number, val: string) {
    setMilestones((prev) => prev.map((m, j) => j === i ? val : m));
  }

  function addMilestone() {
    if (milestones.length >= 10) return;
    setMilestones((prev) => [...prev, ""]);
  }

  function removeMilestone(i: number) {
    setMilestones((prev) => prev.filter((_, j) => j !== i));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-md rounded-r5 border border-border bg-bg-surface p-6 flex flex-col gap-4 shadow-2xl my-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-18 font-semibold text-text-primary">New goal</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors"><X size={18} /></button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Title</label>
          <input required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Bench press 100kg" className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary outline-none focus:border-accent transition-colors">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Target date</label>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary outline-none focus:border-accent transition-colors" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Milestones (up to 10)</label>
          {milestones.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={m}
                onChange={(e) => updateMilestone(i, e.target.value)}
                placeholder={`Milestone ${i + 1}…`}
                className="flex-1 rounded-r3 border border-border bg-bg-base px-3 py-2 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
              />
              {milestones.length > 1 && (
                <button type="button" onClick={() => removeMilestone(i)} className="text-text-muted hover:text-danger transition-colors px-1"><Trash2 size={14} /></button>
              )}
            </div>
          ))}
          {milestones.length < 10 && (
            <button type="button" onClick={addMilestone} className="flex items-center gap-1.5 text-12 text-accent hover:text-accent-hover transition-colors self-start">
              <Plus size={12} /> Add milestone
            </button>
          )}
        </div>

        {error && <p className="text-13 text-danger">{error}</p>}

        <button type="submit" disabled={saving} className="w-full py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-50">
          {saving ? "Saving…" : "Create goal"}
        </button>
      </form>
    </div>
  );
}
