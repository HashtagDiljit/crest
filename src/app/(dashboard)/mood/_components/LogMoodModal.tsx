"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { logMood } from "../actions";

const MOODS: Array<{ score: number; emoji: string; label: string }> = [
  { score: 1, emoji: "😞", label: "Rough" },
  { score: 2, emoji: "😕", label: "Low" },
  { score: 3, emoji: "😐", label: "Okay" },
  { score: 4, emoji: "🙂", label: "Good" },
  { score: 5, emoji: "😄", label: "Great" },
];

interface Props {
  currentScore: number | null;
  onClose: () => void;
  onSaved: () => void;
}

export function LogMoodModal({ currentScore, onClose, onSaved }: Props) {
  const [selected, setSelected] = useState<number>(currentScore ?? 3);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const result = await logMood(selected, note);
    if (result.error) {
      setError(result.error);
      setSaving(false);
    } else {
      onSaved();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-sm rounded-r5 border border-border bg-bg-surface p-6 flex flex-col gap-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-18 font-semibold text-text-primary">Log mood</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-between gap-1">
          {MOODS.map((m) => (
            <button
              key={m.score}
              type="button"
              onClick={() => setSelected(m.score)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-r4 border transition-all ${
                selected === m.score
                  ? "border-[var(--color-accent-ring)] bg-[var(--color-accent-soft)]"
                  : "border-border bg-bg-elevated hover:border-border-strong"
              }`}
            >
              <span className="text-24">{m.emoji}</span>
              <span className={`text-11 font-medium ${selected === m.score ? "text-text-primary" : "text-text-muted"}`}>
                {m.label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors resize-none"
          />
        </div>

        {error && <p className="text-13 text-danger">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save mood"}
        </button>
      </form>
    </div>
  );
}
