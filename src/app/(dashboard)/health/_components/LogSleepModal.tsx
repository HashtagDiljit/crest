"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { logSleep } from "../actions";
import type { SleepLogRow } from "../actions";

interface Props {
  current: SleepLogRow | null;
  onClose: () => void;
  onSaved: () => void;
}

export function LogSleepModal({ current, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const result = await logSleep(new FormData(e.currentTarget));
    if (result.error) { setError(result.error); setSaving(false); }
    else onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-sm rounded-r5 border border-border bg-bg-surface p-6 flex flex-col gap-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-18 font-semibold text-text-primary">Log sleep</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Bedtime</label>
            <input type="time" name="bedtime" defaultValue={current?.bedtime ?? ""} className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary outline-none focus:border-accent transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Wake time</label>
            <input type="time" name="wake_time" defaultValue={current?.wake_time ?? ""} className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary outline-none focus:border-accent transition-colors" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Quality (1–5)</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((q) => (
              <label key={q} className="flex-1 cursor-pointer">
                <input type="radio" name="quality" value={q} className="sr-only peer" defaultChecked={current?.quality_score === q} />
                <span className="flex h-10 w-full items-center justify-center rounded-r3 border border-border bg-bg-elevated text-13 font-semibold text-text-muted peer-checked:bg-accent peer-checked:text-white peer-checked:border-accent transition-colors">
                  {q}
                </span>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-13 text-danger">{error}</p>}

        <button type="submit" disabled={saving} className="w-full py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-50">
          {saving ? "Saving…" : "Save sleep"}
        </button>
      </form>
    </div>
  );
}
