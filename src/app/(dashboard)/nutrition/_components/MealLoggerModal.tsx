"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Check, ChevronRight, Search } from "lucide-react";
import { logMeal, getRecentMeals, getGlobalFoodPresets } from "../actions";
import type { FoodPreset } from "../actions";
import { getTodayProtein } from "@/app/(dashboard)/quick-log-actions";

type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";

const MEAL_TYPES: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack"];

interface Preset { key: string; label: string; protein: number }

const BREAKFAST_PRESETS: Preset[] = [
  { key: "oats_protein_powder", label: "Oats with protein powder", protein: 35 },
  { key: "eggs_3_scrambled",    label: "3 eggs scrambled",         protein: 18 },
  { key: "greek_yogurt_fruit",  label: "Greek yogurt with fruit",  protein: 15 },
  { key: "protein_shake_b",     label: "Protein shake",            protein: 25 },
];

const LUNCH_DINNER_PRESETS: Preset[] = [
  { key: "chicken_breast",     label: "Chicken breast portion",     protein: 35 },
  { key: "chapatti_dal_curry", label: "Chapatti with dal & curry",  protein: 20 },
  { key: "paneer_chapatti",    label: "Paneer curry with chapatti", protein: 22 },
  { key: "salmon_fillet",      label: "Salmon fillet",              protein: 30 },
  { key: "lentil_dal",         label: "Lentil dal (large bowl)",    protein: 18 },
  { key: "tuna_rice",          label: "Tuna with rice",             protein: 35 },
];

const SNACK_PRESETS: Preset[] = [
  { key: "whey_shake",    label: "Whey protein shake",      protein: 25 },
  { key: "greek_yogurt",  label: "Greek yogurt / dahi",     protein: 10 },
  { key: "paneer_100g",   label: "Cottage cheese (paneer) 100g", protein: 18 },
  { key: "nuts",          label: "Handful of nuts",         protein: 6  },
  { key: "boiled_eggs_2", label: "Boiled eggs ×2",          protein: 12 },
];

const PRESETS: Record<MealType, Preset[]> = {
  Breakfast: BREAKFAST_PRESETS,
  Lunch:     LUNCH_DINNER_PRESETS,
  Dinner:    LUNCH_DINNER_PRESETS,
  Snack:     SNACK_PRESETS,
};

const PORTIONS: Array<{ value: number; label: string }> = [
  { value: 0.5, label: "½×" },
  { value: 1,   label: "1×" },
  { value: 1.5, label: "1½×" },
  { value: 2,   label: "2×" },
];

export function MealLoggerModal({
  onClose,
  proteinTarget = 150,
}: {
  onClose: () => void;
  proteinTarget?: number;
}) {
  const [mealType, setMealType]       = useState<MealType>("Lunch");
  const [selected, setSelected]       = useState<Preset | null>(null);
  const [portion, setPortion]         = useState(1);
  const [showCustom, setShowCustom]   = useState(false);
  const [customName, setCustomName]   = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [todayProtein, setTodayProtein] = useState(0);
  const [saving, setSaving]           = useState(false);
  const [recentlySaved, setRecentlySaved] = useState<string | null>(null);
  const [recentMeals, setRecentMeals] = useState<Array<{ meal_name: string; protein_g: number; food_preset: string | null }>>([]);
  const [foodDb, setFoodDb]           = useState<FoodPreset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getTodayProtein().then(setTodayProtein);
    getRecentMeals().then(setRecentMeals);
    getGlobalFoodPresets().then(setFoodDb);
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return foodDb.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 8);
  }, [searchQuery, foodDb]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Deselect preset when meal type changes (presets change)
  useEffect(() => { setSelected(null); }, [mealType]);

  const customProteinNum = parseFloat(customProtein) || 0;
  const activeProtein = showCustom
    ? Math.round(customProteinNum * portion * 10) / 10
    : selected ? Math.round(selected.protein * portion * 10) / 10 : 0;
  const projectedTotal = todayProtein + activeProtein;
  const pct = Math.min(100, (projectedTotal / proteinTarget) * 100);
  const canSave = showCustom ? (customName.trim().length > 0 && customProteinNum > 0) : selected !== null;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    let res: { error?: string };
    if (showCustom) {
      res = await logMeal(mealType, customName.trim(), customProteinNum, false, null, portion);
    } else {
      res = await logMeal(mealType, selected!.label, selected!.protein, true, selected!.key, portion);
    }
    setSaving(false);
    if (res.error) return;
    const savedLabel = showCustom ? customName.trim() : selected!.label;
    setTodayProtein(projectedTotal);
    setRecentlySaved(savedLabel);
    setSelected(null);
    setShowCustom(false);
    setCustomName("");
    setCustomProtein("");
    setPortion(1);
    setTimeout(() => setRecentlySaved(null), 2000);
  }

  const presets = PRESETS[mealType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative z-10 w-full max-w-md rounded-r5 border border-border bg-bg-surface shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-0 flex-shrink-0">
          <h2 className="font-display text-16 font-semibold text-text-primary">Log meal</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-4 overflow-y-auto">
          {/* Protein progress */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-12">
              <span className="text-text-secondary">Today&apos;s protein</span>
              <span className="font-mono font-semibold" style={{ color: pct >= 100 ? "var(--color-success)" : "var(--color-text-primary)" }}>
                {Math.round(projectedTotal)}g
                {activeProtein > 0 && (
                  <span className="text-text-muted"> (+{activeProtein}g)</span>
                )}
                {" "}/ {proteinTarget}g
              </span>
            </div>
            <div className="h-2 rounded-pill bg-bg-elevated overflow-hidden">
              <div
                className="h-full rounded-pill transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: pct >= 100 ? "var(--color-success)" : "var(--color-accent)",
                }}
              />
            </div>
          </div>

          {/* Meal type pills */}
          <div className="flex gap-1.5">
            {MEAL_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setMealType(t)}
                className={`flex-1 py-1.5 rounded-r3 text-12 font-semibold border transition-colors ${
                  mealType === t
                    ? "bg-accent text-white border-accent"
                    : "bg-bg-elevated border-border text-text-muted hover:border-border-strong"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Portion multiplier */}
          <div className="flex flex-col gap-1.5">
            <span className="text-11 font-semibold uppercase tracking-[0.08em] text-text-muted">Portion</span>
            <div className="flex gap-1.5">
              {PORTIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPortion(p.value)}
                  className={`flex-1 py-1.5 rounded-r3 text-12 font-semibold border transition-colors ${
                    portion === p.value
                      ? "bg-accent text-white border-accent"
                      : "bg-bg-elevated border-border text-text-muted hover:border-border-strong"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent meals quick-log */}
          {recentMeals.length > 0 && !showCustom && (
            <div className="flex flex-col gap-1.5">
              <span className="text-11 font-semibold uppercase tracking-[0.08em] text-text-muted">Recent</span>
              <div className="flex flex-col gap-1">
                {recentMeals.map((m) => {
                  const protein = Math.round(m.protein_g * portion * 10) / 10;
                  const isSelected = selected?.key === (m.food_preset ?? `recent:${m.meal_name}`) && selected?.label === m.meal_name;
                  return (
                    <button
                      key={m.meal_name}
                      onClick={() => setSelected(isSelected ? null : { key: m.food_preset ?? `recent:${m.meal_name}`, label: m.meal_name, protein: m.protein_g })}
                      className={`flex items-center justify-between px-3 py-2 rounded-r3 border text-left transition-colors ${
                        isSelected
                          ? "border-[var(--color-accent-ring)] bg-[var(--color-accent-soft)]"
                          : "border-border bg-bg-elevated hover:border-border-strong"
                      }`}
                    >
                      <span className={`text-13 ${isSelected ? "text-text-primary font-medium" : "text-text-secondary"}`}>{m.meal_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-12 text-accent">+{protein}g</span>
                        {isSelected && <Check size={14} className="text-accent" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recently saved toast */}
          {recentlySaved && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-r3 bg-[var(--color-success-soft,rgba(52,211,153,0.15))] text-12 text-text-secondary">
              <Check size={14} className="text-[var(--color-success)]" />
              <span><span className="font-medium text-text-primary">{recentlySaved}</span> logged — add another?</span>
            </div>
          )}

          {/* Food database search */}
          {!showCustom && (
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSelected(null); }}
                  placeholder="Search food database…"
                  className="w-full rounded-r3 border border-border bg-bg-base pl-8 pr-3 py-2 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="flex flex-col gap-1">
                  {searchResults.map((f) => {
                    const isSelected = selected?.key === `db:${f.id}`;
                    const protein = Math.round(f.protein_g * portion * 10) / 10;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setSelected(isSelected ? null : { key: `db:${f.id}`, label: f.name, protein: f.protein_g })}
                        className={`flex items-center justify-between px-3 py-2 rounded-r3 border text-left transition-colors ${isSelected ? "border-[var(--color-accent-ring)] bg-[var(--color-accent-soft)]" : "border-border bg-bg-elevated hover:border-border-strong"}`}
                      >
                        <div>
                          <span className={`text-13 ${isSelected ? "text-text-primary font-medium" : "text-text-secondary"}`}>{f.name}</span>
                          <span className="text-10 text-text-muted ml-2">{f.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-12 text-accent">+{protein}g</span>
                          {isSelected && <Check size={14} className="text-accent" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Custom form OR presets */}
          {showCustom ? (
            <div className="flex flex-col gap-2">
              <input
                autoFocus
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Meal name"
                className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
              />
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={customProtein}
                  onChange={(e) => setCustomProtein(e.target.value)}
                  placeholder="Protein (g)"
                  className="flex-1 rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary outline-none focus:border-accent transition-colors"
                />
                <span className="text-13 text-text-muted">g</span>
              </div>
              <button
                onClick={() => { setShowCustom(false); setCustomName(""); setCustomProtein(""); }}
                className="text-12 text-text-muted hover:text-text-secondary transition-colors text-left"
              >
                ← Back to presets
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="text-11 font-semibold uppercase tracking-[0.08em] text-text-muted mb-0.5">
                {mealType === "Lunch" || mealType === "Dinner" ? "Lunch / Dinner" : mealType} presets
              </span>
              <div className="grid grid-cols-1 gap-1">
                {presets.map((p) => {
                  const isSelected = selected?.key === p.key;
                  const finalProtein = Math.round(p.protein * portion * 10) / 10;
                  return (
                    <button
                      key={p.key}
                      onClick={() => setSelected(isSelected ? null : p)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-r3 border text-left transition-colors ${
                        isSelected
                          ? "border-[var(--color-accent-ring)] bg-[var(--color-accent-soft)]"
                          : "border-border bg-bg-elevated hover:border-border-strong"
                      }`}
                    >
                      <span className={`text-13 ${isSelected ? "text-text-primary font-medium" : "text-text-secondary"}`}>
                        {p.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-12 text-accent">+{finalProtein}g</span>
                        {isSelected && <Check size={14} className="text-accent" />}
                      </div>
                    </button>
                  );
                })}
                <button
                  onClick={() => { setShowCustom(true); setSelected(null); }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-r3 border border-dashed border-border bg-bg-elevated hover:border-border-strong text-left transition-colors"
                >
                  <span className="text-13 text-text-muted">Custom meal…</span>
                  <ChevronRight size={14} className="text-text-muted" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 pb-5 pt-1 flex-shrink-0 flex gap-2">
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="flex-1 py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-40"
          >
            {saving ? "Saving…" : canSave ? `Log ${activeProtein > 0 ? `(+${activeProtein}g)` : "meal"}` : "Select a meal"}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-r3 border border-border text-text-muted text-13 hover:text-text-secondary transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
