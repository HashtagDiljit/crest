"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Save } from "lucide-react";
import { saveOneRepMax } from "./actions";

const PERCENTAGES = [95, 90, 85, 80, 75, 70, 65, 60, 55, 50];

function epley(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function brzycki(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps >= 37) return weight * 2; // avoid division by zero / negative
  return weight * (36 / (37 - reps));
}

export default function OneRepMaxPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [weight, setWeight] = useState(params.get("weight") ?? "");
  const [reps, setReps] = useState(params.get("reps") ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const exerciseName = params.get("exercise") ?? "";
  const exerciseId = params.get("exerciseId") ?? "";

  const w = parseFloat(weight);
  const r = parseInt(reps);
  const valid = !isNaN(w) && !isNaN(r) && w > 0 && r >= 1 && r <= 36;

  const e1rm = valid ? Math.round(epley(w, r) * 10) / 10 : null;
  const b1rm = valid ? Math.round(brzycki(w, r) * 10) / 10 : null;
  const avg1rm = e1rm && b1rm ? Math.round((e1rm + b1rm) / 2 * 10) / 10 : null;

  async function handleSave() {
    if (!avg1rm || !exerciseId) return;
    setSaving(true);
    await saveOneRepMax(exerciseId, avg1rm, r);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-24 md:text-28 font-semibold text-text-primary tracking-tight">1RM Calculator</h1>
          {exerciseName && <p className="text-13 text-text-secondary mt-0.5">{exerciseName}</p>}
        </div>
      </div>

      {/* Inputs */}
      <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Weight (kg)</label>
            <input
              autoFocus
              type="number"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="100"
              className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-18 font-mono text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Reps</label>
            <input
              type="number"
              min={1}
              max={36}
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="5"
              className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-18 font-mono text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* Result */}
        {avg1rm !== null ? (
          <div className="rounded-r4 border border-[var(--color-accent-ring)] bg-[var(--color-accent-soft)] p-4 flex items-center justify-between">
            <div>
              <p className="text-11 font-semibold uppercase tracking-widest text-accent mb-1">Estimated 1RM</p>
              <p className="font-mono text-36 font-bold text-text-primary">{avg1rm} kg</p>
              <p className="text-12 text-text-muted mt-1">Epley {e1rm} · Brzycki {b1rm}</p>
            </div>
            {exerciseId && (
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-r3 text-13 font-semibold transition-colors ${
                  saved
                    ? "bg-[var(--color-success)] text-white border-[var(--color-success)]"
                    : "bg-accent hover:bg-accent-hover text-white"
                } border`}
              >
                {saved ? <Check size={14} /> : <Save size={14} />}
                {saving ? "Saving…" : saved ? "Saved!" : "Save PR"}
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-r4 border border-dashed border-border p-4 text-center text-13 text-text-disabled">
            Enter weight and reps to calculate
          </div>
        )}
      </div>

      {/* Percentage table */}
      {avg1rm !== null && (
        <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-3">
          <h2 className="font-display text-15 font-semibold text-text-primary">Training zones</h2>
          <div className="flex flex-col divide-y divide-border">
            {PERCENTAGES.map((pct) => {
              const load = Math.round(avg1rm * pct / 100 * 10) / 10;
              const zone = pct >= 90 ? "Max strength" : pct >= 80 ? "Strength" : pct >= 70 ? "Hypertrophy" : pct >= 60 ? "Endurance" : "Active recovery";
              const color = pct >= 90 ? "var(--color-danger)" : pct >= 80 ? "var(--color-warning)" : pct >= 70 ? "var(--color-accent)" : pct >= 60 ? "var(--color-success)" : "var(--color-text-muted)";
              return (
                <div key={pct} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-13 font-semibold text-text-muted w-8">{pct}%</span>
                    <span className="text-12 text-text-secondary">{zone}</span>
                  </div>
                  <span className="font-mono text-14 font-semibold" style={{ color }}>{load} kg</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-11 text-text-disabled text-center">
        Epley: weight × (1 + reps/30) · Brzycki: weight × (36/(37−reps)) · Average shown
      </p>
    </div>
  );
}
