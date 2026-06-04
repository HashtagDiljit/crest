"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { createHabit } from "../actions";

const CATEGORIES = ["health", "fitness", "mindset", "productivity", "sleep", "nutrition"];
const TIMES = ["morning", "daytime", "evening", "anytime"];

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function HabitModal({ onClose, onCreated }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const result = await createHabit(new FormData(e.currentTarget));
    if (result.error) {
      setError(result.error);
      setSaving(false);
    } else {
      onCreated();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-sm rounded-r5 border border-border bg-bg-surface p-6 flex flex-col gap-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-18 font-semibold text-text-primary">Build a practice</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Name</label>
          <input
            name="name"
            required
            autoFocus
            placeholder="e.g. Morning meditation"
            className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Category</label>
          <select name="category" className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary outline-none focus:border-accent transition-colors">
            <option value="">— select —</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Time of day</label>
          <div className="grid grid-cols-4 gap-1.5">
            {TIMES.map((t) => (
              <label key={t} className="flex flex-col items-center gap-1 cursor-pointer">
                <input type="radio" name="frequency" value={t} className="sr-only peer" defaultChecked={t === "anytime"} />
                <span className="w-full text-center px-2 py-1.5 rounded-r3 border border-border bg-bg-base text-12 text-text-muted peer-checked:bg-accent-soft peer-checked:border-[var(--color-accent-ring)] peer-checked:text-text-primary transition-colors capitalize">
                  {t}
                </span>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-13 text-danger">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save habit"}
        </button>
      </form>
    </div>
  );
}
