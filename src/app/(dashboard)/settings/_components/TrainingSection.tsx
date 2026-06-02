"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { saveTrainingPreferences } from "../actions";

interface TrainingPreferences {
  weekly_target: number;
  rest_days: string[];
  overload_increment_kg: number;
  deload_every_weeks: number;
  rest_timer_seconds: number;
}

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export function TrainingSection({ prefs }: { prefs: TrainingPreferences | null }) {
  const [weeklyTarget, setWeeklyTarget] = useState(prefs?.weekly_target ?? 4);
  const [restDays, setRestDays] = useState<string[]>(prefs?.rest_days ?? ["saturday", "sunday"]);
  const [overloadInc, setOverloadInc] = useState(prefs?.overload_increment_kg ?? 2.5);
  const [deloadEvery, setDeloadEvery] = useState(prefs?.deload_every_weeks ?? 8);
  const [restTimer, setRestTimer] = useState(prefs?.rest_timer_seconds ?? 90);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleRestDay(day: string) {
    setRestDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  }

  async function handleSave() {
    setSaving(true);
    await saveTrainingPreferences({ weekly_target: weeklyTarget, rest_days: restDays, overload_increment_kg: overloadInc, deload_every_weeks: deloadEvery, rest_timer_seconds: restTimer });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Weekly target */}
      <div className="flex flex-col gap-2">
        <label className="text-12 font-semibold text-text-muted uppercase tracking-widest">Weekly workout target</label>
        <div className="flex gap-2">
          {[2, 3, 4, 5, 6].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setWeeklyTarget(d)}
              className={`flex-1 py-2 rounded-r3 border text-13 font-semibold transition-colors ${weeklyTarget === d ? "bg-accent text-white border-accent" : "border-border text-text-secondary hover:bg-bg-elevated"}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Rest days */}
      <div className="flex flex-col gap-2">
        <label className="text-12 font-semibold text-text-muted uppercase tracking-widest">Rest days</label>
        <div className="flex gap-1.5 flex-wrap">
          {DAYS_OF_WEEK.map((label, i) => {
            const val = DAY_FULL[i];
            const on = restDays.includes(val);
            return (
              <button
                key={val}
                type="button"
                onClick={() => toggleRestDay(val)}
                className={`px-3 py-1.5 rounded-r3 border text-12 font-medium transition-colors ${on ? "bg-[var(--color-accent-soft)] border-[var(--color-accent-ring)] text-accent" : "border-border text-text-secondary hover:bg-bg-elevated"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overload increment */}
      <div className="flex flex-col gap-2">
        <label className="text-12 font-semibold text-text-muted uppercase tracking-widest">Progressive overload increment</label>
        <div className="flex gap-2">
          {[1, 1.25, 2.5, 5].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setOverloadInc(v)}
              className={`flex-1 py-2 rounded-r3 border text-13 font-semibold transition-colors ${overloadInc === v ? "bg-accent text-white border-accent" : "border-border text-text-secondary hover:bg-bg-elevated"}`}
            >
              {v}kg
            </button>
          ))}
        </div>
        <p className="text-11 text-text-muted">Added to your last weight when the system suggests a progression.</p>
      </div>

      {/* Deload frequency */}
      <div className="flex flex-col gap-2">
        <label className="text-12 font-semibold text-text-muted uppercase tracking-widest">Deload every</label>
        <div className="flex gap-2">
          {[4, 6, 8, 12].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setDeloadEvery(w)}
              className={`flex-1 py-2 rounded-r3 border text-13 font-semibold transition-colors ${deloadEvery === w ? "bg-accent text-white border-accent" : "border-border text-text-secondary hover:bg-bg-elevated"}`}
            >
              {w}w
            </button>
          ))}
        </div>
        <p className="text-11 text-text-muted">Crest will suggest a deload week after this many training weeks.</p>
      </div>

      {/* Rest timer */}
      <div className="flex flex-col gap-2">
        <label className="text-12 font-semibold text-text-muted uppercase tracking-widest">Default rest timer</label>
        <div className="flex gap-2">
          {[60, 90, 120, 180, 240].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRestTimer(s)}
              className={`flex-1 py-1.5 rounded-r3 border text-12 font-semibold transition-colors ${restTimer === s ? "bg-accent text-white border-accent" : "border-border text-text-secondary hover:bg-bg-elevated"}`}
            >
              {s < 120 ? `${s}s` : `${s / 60}m`}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || saved}
        className="flex items-center justify-center gap-2 py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-70"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
        {saving ? "Saving…" : saved ? "Saved!" : "Save training preferences"}
      </button>
    </div>
  );
}
