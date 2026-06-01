"use client";

import { useState } from "react";
import { saveNutritionSettings } from "@/app/(dashboard)/nutrition/actions";
import type { NutritionSettings } from "@/app/(dashboard)/nutrition/types";

const ALL_SUPPLEMENTS = ["Vitamin D", "Omega-3", "Whey protein", "Magnesium glycinate"];

export function NutritionSection({ settings }: { settings: NutritionSettings }) {
  const [proteinTarget, setProteinTarget] = useState(settings.protein_target);
  const [mealsPerDay, setMealsPerDay]     = useState(settings.meals_per_day);
  const [supplements, setSupplements]     = useState<Record<string, boolean>>(settings.supplements);
  const [saving, setSaving]               = useState(false);
  const [saved, setSaved]                 = useState(false);

  function toggleSupp(name: string) {
    setSupplements((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  async function handleSave() {
    setSaving(true);
    await saveNutritionSettings({ protein_target: proteinTarget, meals_per_day: mealsPerDay, supplements });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Protein target */}
      <div className="flex flex-col gap-2">
        <label className="text-13 font-medium text-text-primary">Daily protein target (g)</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={proteinTarget}
            onChange={(e) => setProteinTarget(Math.max(50, Math.min(300, parseInt(e.target.value) || 150)))}
            min={50}
            max={300}
            className="w-28 rounded-r3 border border-border bg-bg-base px-3 py-2 text-13 text-text-primary outline-none focus:border-accent transition-colors"
          />
          <span className="text-13 text-text-muted">g / day</span>
        </div>
        <p className="text-12 text-text-muted">Default: 150g — roughly 4 meals of ~35g each.</p>
      </div>

      {/* Meals per day */}
      <div className="flex flex-col gap-2">
        <label className="text-13 font-medium text-text-primary">Target meals per day</label>
        <div className="flex gap-2">
          {[3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => setMealsPerDay(n)}
              className={`w-12 py-2 rounded-r3 text-13 font-semibold border transition-colors ${
                mealsPerDay === n
                  ? "bg-accent text-white border-accent"
                  : "bg-bg-elevated border-border text-text-muted hover:border-border-strong"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Supplements to track */}
      <div className="flex flex-col gap-2">
        <label className="text-13 font-medium text-text-primary">Supplements to track</label>
        <div className="flex flex-col gap-1.5">
          {ALL_SUPPLEMENTS.map((name) => {
            const on = supplements[name] ?? false;
            return (
              <label key={name} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => toggleSupp(name)}
                  className={`relative w-9 h-5 rounded-pill border-2 transition-all flex-shrink-0 cursor-pointer ${
                    on ? "bg-accent border-accent" : "bg-bg-elevated border-border group-hover:border-border-strong"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-pill bg-white transition-transform shadow-sm ${
                      on ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </div>
                <span className="text-13 text-text-primary">{name}</span>
              </label>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="self-start px-4 py-2 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-50"
      >
        {saved ? "Saved ✓" : saving ? "Saving…" : "Save nutrition settings"}
      </button>
    </div>
  );
}
