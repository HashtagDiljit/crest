"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { X, Check, ChevronRight, Search, Barcode, ArrowLeft, Loader2 } from "lucide-react";
import { logMeal, getRecentMeals, getGlobalFoodPresets } from "../actions";
import { track } from "@vercel/analytics";
import type { FoodPreset } from "../actions";
import { getTodayProtein } from "@/app/(dashboard)/quick-log-actions";
import { BarcodeScanner } from "./BarcodeScanner";

// ─── types ────────────────────────────────────────────────────────────────────

type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";
type Screen = "main" | "portion" | "barcode";

interface USDAFood {
  fdcId: number;
  name: string;
  brand: string;
  protein100g: number;
  calories100g: number;
  carbs100g: number;
  fat100g: number;
}

interface PortionFood {
  name: string;
  brand: string;
  protein100g: number;
  calories100g: number;
  carbs100g: number;
  fat100g: number;
  fdcId?: number;
  barcode?: string;
}

interface Preset { key: string; label: string; protein: number }

// ─── constants ────────────────────────────────────────────────────────────────

const MEAL_TYPES: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack"];

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

// ─── USDA helpers ─────────────────────────────────────────────────────────────

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

function getCached(query: string): USDAFood[] | null {
  try {
    const raw = localStorage.getItem(`usda_${query.toLowerCase()}`);
    if (!raw) return null;
    const { results, cachedAt } = JSON.parse(raw) as { results: USDAFood[]; cachedAt: number };
    if (Date.now() - cachedAt > CACHE_TTL) return null;
    return results;
  } catch { return null; }
}

function setCache(query: string, results: USDAFood[]) {
  try {
    localStorage.setItem(`usda_${query.toLowerCase()}`, JSON.stringify({ results, cachedAt: Date.now() }));
  } catch { /* noop */ }
}

function nutrientValue(nutrients: Array<{ nutrientNumber: string; value: number }>, num: string): number {
  return nutrients.find((n) => n.nutrientNumber === num)?.value ?? 0;
}

async function searchUSDA(query: string): Promise<USDAFood[]> {
  const cached = getCached(query);
  if (cached) return cached;

  const key = process.env.NEXT_PUBLIC_USDA_API_KEY ?? "";
  if (!key) return [];

  const res = await fetch(
    `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=10&api_key=${key}`
  );
  if (!res.ok) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as { foods?: any[] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const foods: USDAFood[] = (data.foods ?? []).map((f: any) => ({
    fdcId:       f.fdcId,
    name:        f.description ?? "",
    brand:       f.brandOwner ?? "",
    protein100g: nutrientValue(f.foodNutrients ?? [], "203"),
    calories100g:nutrientValue(f.foodNutrients ?? [], "208"),
    carbs100g:   nutrientValue(f.foodNutrients ?? [], "205"),
    fat100g:     nutrientValue(f.foodNutrients ?? [], "204"),
  }));

  setCache(query, foods);
  return foods;
}

async function lookupBarcode(barcode: string): Promise<PortionFood | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
  if (!res.ok) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as { status: number; product?: any };
  if (data.status !== 1 || !data.product) return null;
  const p = data.product;
  const n = p.nutriments ?? {};
  return {
    name:        p.product_name ?? "Unknown product",
    brand:       p.brands ?? "",
    protein100g: n.proteins_100g ?? 0,
    calories100g:n["energy-kcal_100g"] ?? 0,
    carbs100g:   n.carbohydrates_100g ?? 0,
    fat100g:     n.fat_100g ?? 0,
    barcode,
  };
}

// ─── portion screen ───────────────────────────────────────────────────────────

function PortionScreen({
  food,
  mealType,
  todayProtein,
  proteinTarget,
  onBack,
  onLogged,
}: {
  food: PortionFood;
  mealType: MealType;
  todayProtein: number;
  proteinTarget: number;
  onBack: () => void;
  onLogged: (proteinAdded: number) => void;
}) {
  const [grams, setGrams]   = useState(100);
  const [saving, setSaving] = useState(false);

  const multiplier = grams / 100;
  const protein   = Math.round(food.protein100g  * multiplier * 10) / 10;
  const calories  = Math.round(food.calories100g * multiplier);
  const carbs     = Math.round(food.carbs100g    * multiplier * 10) / 10;
  const fat       = Math.round(food.fat100g      * multiplier * 10) / 10;
  const projected = todayProtein + protein;
  const pct       = Math.min(100, (projected / proteinTarget) * 100);

  async function handleSave() {
    setSaving(true);
    await logMeal(
      mealType,
      food.name + (food.brand ? ` (${food.brand})` : ""),
      food.protein100g,
      false,
      null,
      multiplier,
      {
        caloriesKcal: food.calories100g,
        carbsG:       food.carbs100g,
        fatG:         food.fat100g,
        fdcId:        food.fdcId !== undefined ? String(food.fdcId) : undefined,
        barcode:      food.barcode,
      },
    );
    setSaving(false);
    track("meal_logged", { mealType, source: food.fdcId ? "usda" : food.barcode ? "barcode" : "manual", proteinG: protein });
    onLogged(protein);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Back + food name */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-12 text-text-muted hover:text-text-secondary transition-colors self-start">
        <ArrowLeft size={14} /> Back
      </button>

      <div>
        <p className="text-14 font-semibold text-text-primary leading-tight">{food.name}</p>
        {food.brand && <p className="text-12 text-text-muted">{food.brand}</p>}
      </div>

      {/* Portion input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Serving size</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={grams}
            min={1}
            max={2000}
            onChange={(e) => setGrams(Math.max(1, parseInt(e.target.value) || 100))}
            className="w-24 rounded-r3 border border-border bg-bg-base px-3 py-2 text-13 text-text-primary outline-none focus:border-accent transition-colors text-center font-mono"
          />
          <span className="text-13 text-text-muted">g</span>
          <div className="flex gap-1 ml-auto">
            {[50, 100, 150, 200].map((g) => (
              <button key={g} onClick={() => setGrams(g)} className={`px-2 py-1.5 rounded-r2 text-11 font-semibold border transition-colors ${grams === g ? "bg-accent text-white border-accent" : "border-border text-text-muted hover:border-border-strong"}`}>{g}g</button>
            ))}
          </div>
        </div>
      </div>

      {/* Macro display */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Protein", value: `${protein}g`, color: "var(--color-accent)" },
          { label: "Calories", value: `${calories}`, color: "var(--color-text-primary)" },
          { label: "Carbs", value: `${carbs}g`, color: "var(--color-warning)" },
          { label: "Fat", value: `${fat}g`, color: "var(--color-info)" },
        ].map((m) => (
          <div key={m.label} className="rounded-r3 border border-border bg-bg-elevated p-2 text-center">
            <p className="font-mono text-14 font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="text-10 text-text-muted mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Protein progress */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-11 text-text-muted">
          <span>Today&apos;s protein</span>
          <span className="font-mono font-semibold" style={{ color: pct >= 100 ? "var(--color-success)" : "var(--color-text-primary)" }}>
            {Math.round(projected)}g / {proteinTarget}g
          </span>
        </div>
        <div className="h-1.5 rounded-pill bg-bg-elevated overflow-hidden">
          <div className="h-full rounded-pill transition-all duration-500" style={{ width: `${pct}%`, background: pct >= 100 ? "var(--color-success)" : "var(--color-accent)" }} />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-40"
      >
        {saving ? "Logging…" : `Log ${protein}g protein`}
      </button>
    </div>
  );
}

// ─── main modal ───────────────────────────────────────────────────────────────

export function MealLoggerModal({
  onClose,
  proteinTarget = 150,
}: {
  onClose: () => void;
  proteinTarget?: number;
}) {
  const [screen, setScreen]             = useState<Screen>("main");
  const [mealType, setMealType]         = useState<MealType>("Lunch");
  const [selected, setSelected]         = useState<Preset | null>(null);
  const [portion, setPortion]           = useState(1);
  const [showCustom, setShowCustom]     = useState(false);
  const [customName, setCustomName]     = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [todayProtein, setTodayProtein] = useState(0);
  const [saving, setSaving]             = useState(false);
  const [recentlySaved, setRecentlySaved] = useState<string | null>(null);
  const [recentMeals, setRecentMeals]   = useState<Array<{ meal_name: string; protein_g: number; food_preset: string | null }>>([]);
  const [foodDb, setFoodDb]             = useState<FoodPreset[]>([]);

  // USDA search
  const [searchQuery, setSearchQuery]   = useState("");
  const [usdaResults, setUsdaResults]   = useState<USDAFood[]>([]);
  const [usdaLoading, setUsdaLoading]   = useState(false);
  const debounceRef                     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Portion screen food
  const [portionFood, setPortionFood]   = useState<PortionFood | null>(null);
  // Barcode loading
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  useEffect(() => {
    getTodayProtein().then(setTodayProtein);
    getRecentMeals().then(setRecentMeals);
    getGlobalFoodPresets().then(setFoodDb);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => { setSelected(null); }, [mealType]);

  // Debounced USDA search
  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setUsdaResults([]); return; }
    setUsdaLoading(true);
    const results = await searchUSDA(q);
    setUsdaResults(results);
    setUsdaLoading(false);
  }, []);

  function handleSearchChange(q: string) {
    setSearchQuery(q);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(q), 400);
  }

  // Local food_presets filtered search (shown when no USDA results yet)
  const localResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return foodDb.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 6);
  }, [searchQuery, foodDb]);

  const showSearchResults = searchQuery.length >= 2;

  const customProteinNum = parseFloat(customProtein) || 0;
  const activeProtein = showCustom
    ? Math.round(customProteinNum * portion * 10) / 10
    : selected ? Math.round(selected.protein * portion * 10) / 10 : 0;
  const projectedTotal = todayProtein + activeProtein;
  const pct = Math.min(100, (projectedTotal / proteinTarget) * 100);
  const canSave = showCustom ? (customName.trim().length > 0 && customProteinNum > 0) : selected !== null;

  async function handleSavePreset() {
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
    track("meal_logged", { mealType, source: "preset", proteinG: activeProtein });
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

  async function handleBarcodeResult(result: { barcode: string }) {
    setBarcodeLoading(true);
    setBarcodeError(null);
    setScreen("main");
    const food = await lookupBarcode(result.barcode);
    setBarcodeLoading(false);
    if (!food) {
      setBarcodeError(`No product found for barcode ${result.barcode}. Try manual entry below.`);
      return;
    }
    setPortionFood(food);
    setScreen("portion");
  }

  function handleSelectUSDA(food: USDAFood) {
    setPortionFood({
      name:        food.name,
      brand:       food.brand,
      protein100g: food.protein100g,
      calories100g:food.calories100g,
      carbs100g:   food.carbs100g,
      fat100g:     food.fat100g,
      fdcId:       food.fdcId,
    });
    setScreen("portion");
  }

  function handlePortionLogged(proteinAdded: number) {
    setTodayProtein((prev) => prev + proteinAdded);
    setRecentlySaved("Meal logged!");
    setScreen("main");
    setPortionFood(null);
    setSearchQuery("");
    setUsdaResults([]);
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
          <h2 className="font-display text-16 font-semibold text-text-primary">
            {screen === "barcode" ? "Scan barcode" : screen === "portion" ? "Portion size" : "Log meal"}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-4 overflow-y-auto">

          {/* ── BARCODE SCREEN ── */}
          {screen === "barcode" && (
            <BarcodeScanner
              onResult={handleBarcodeResult}
              onCancel={() => setScreen("main")}
            />
          )}

          {/* ── PORTION SCREEN ── */}
          {screen === "portion" && portionFood && (
            <PortionScreen
              food={portionFood}
              mealType={mealType}
              todayProtein={todayProtein}
              proteinTarget={proteinTarget}
              onBack={() => { setScreen("main"); setPortionFood(null); }}
              onLogged={handlePortionLogged}
            />
          )}

          {/* ── MAIN SCREEN ── */}
          {screen === "main" && (
            <>
              {/* Protein progress */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-12">
                  <span className="text-text-secondary">Today&apos;s protein</span>
                  <span className="font-mono font-semibold" style={{ color: pct >= 100 ? "var(--color-success)" : "var(--color-text-primary)" }}>
                    {Math.round(projectedTotal)}g
                    {activeProtein > 0 && <span className="text-text-muted"> (+{activeProtein}g)</span>}
                    {" "}/ {proteinTarget}g
                  </span>
                </div>
                <div className="h-2 rounded-pill bg-bg-elevated overflow-hidden">
                  <div
                    className="h-full rounded-pill transition-all duration-500"
                    style={{ width: `${pct}%`, background: pct >= 100 ? "var(--color-success)" : "var(--color-accent)" }}
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
                      mealType === t ? "bg-accent text-white border-accent" : "bg-bg-elevated border-border text-text-muted hover:border-border-strong"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* USDA search bar + barcode button */}
              {!showCustom && (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search 600,000+ foods…"
                      className="w-full rounded-r3 border border-border bg-bg-base pl-8 pr-3 py-2 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
                    />
                    {usdaLoading && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted animate-spin" />}
                  </div>
                  <button
                    onClick={() => { setBarcodeError(null); setScreen("barcode"); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-r3 border border-border bg-bg-elevated text-text-muted hover:text-text-secondary hover:border-border-strong transition-colors text-12"
                    title="Scan barcode"
                  >
                    <Barcode size={15} />
                  </button>
                </div>
              )}

              {/* Barcode error */}
              {barcodeLoading && (
                <div className="flex items-center gap-2 text-12 text-text-muted">
                  <Loader2 size={13} className="animate-spin" /> Looking up barcode…
                </div>
              )}
              {barcodeError && (
                <p className="text-12 text-warning bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.3)] rounded-r3 px-3 py-2">{barcodeError}</p>
              )}

              {/* USDA search results */}
              {showSearchResults && !showCustom && (
                <div className="flex flex-col gap-1">
                  {usdaLoading && usdaResults.length === 0 && (
                    <div className="text-12 text-text-muted py-2 text-center">Searching USDA database…</div>
                  )}
                  {!usdaLoading && usdaResults.length === 0 && localResults.length === 0 && searchQuery.length >= 2 && (
                    <div className="text-12 text-text-muted py-2 text-center">No results found.</div>
                  )}

                  {/* Local food_presets results */}
                  {localResults.length > 0 && usdaResults.length === 0 && (
                    <>
                      <p className="text-11 font-semibold uppercase tracking-widest text-text-muted mb-0.5">Presets</p>
                      {localResults.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setSelected({ key: `db:${f.id}`, label: f.name, protein: f.protein_g })}
                          className={`flex items-center justify-between px-3 py-2 rounded-r3 border text-left transition-colors ${selected?.key === `db:${f.id}` ? "border-[var(--color-accent-ring)] bg-[var(--color-accent-soft)]" : "border-border bg-bg-elevated hover:border-border-strong"}`}
                        >
                          <span className="text-13 text-text-secondary">{f.name}</span>
                          <span className="font-mono text-12 text-accent">+{Math.round(f.protein_g * portion * 10) / 10}g</span>
                        </button>
                      ))}
                    </>
                  )}

                  {/* USDA results */}
                  {usdaResults.length > 0 && (
                    <>
                      <p className="text-11 font-semibold uppercase tracking-widest text-text-muted mb-0.5">USDA database</p>
                      {usdaResults.map((f) => (
                        <button
                          key={f.fdcId}
                          onClick={() => handleSelectUSDA(f)}
                          className="flex items-center justify-between px-3 py-2 rounded-r3 border border-border bg-bg-elevated hover:border-border-strong text-left transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-13 text-text-secondary truncate">{f.name}</p>
                            {f.brand && <p className="text-11 text-text-muted truncate">{f.brand}</p>}
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="font-mono text-12 text-accent">{f.protein100g.toFixed(1)}g protein</p>
                            <p className="text-10 text-text-muted">{Math.round(f.calories100g)} kcal / 100g</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Show presets + recent only when not searching */}
              {!showSearchResults && !showCustom && (
                <>
                  {/* Portion multiplier */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-11 font-semibold uppercase tracking-[0.08em] text-text-muted">Portion</span>
                    <div className="flex gap-1.5">
                      {PORTIONS.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => setPortion(p.value)}
                          className={`flex-1 py-1.5 rounded-r3 text-12 font-semibold border transition-colors ${portion === p.value ? "bg-accent text-white border-accent" : "bg-bg-elevated border-border text-text-muted hover:border-border-strong"}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recent meals */}
                  {recentMeals.length > 0 && (
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
                              className={`flex items-center justify-between px-3 py-2 rounded-r3 border text-left transition-colors ${isSelected ? "border-[var(--color-accent-ring)] bg-[var(--color-accent-soft)]" : "border-border bg-bg-elevated hover:border-border-strong"}`}
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

                  {/* Presets */}
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
                            className={`flex items-center justify-between px-3 py-2.5 rounded-r3 border text-left transition-colors ${isSelected ? "border-[var(--color-accent-ring)] bg-[var(--color-accent-soft)]" : "border-border bg-bg-elevated hover:border-border-strong"}`}
                          >
                            <span className={`text-13 ${isSelected ? "text-text-primary font-medium" : "text-text-secondary"}`}>{p.label}</span>
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
                </>
              )}

              {/* Custom form */}
              {showCustom && (
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
                  <div className="flex gap-1.5">
                    {PORTIONS.map((p) => (
                      <button key={p.value} onClick={() => setPortion(p.value)} className={`flex-1 py-1.5 rounded-r3 text-12 font-semibold border transition-colors ${portion === p.value ? "bg-accent text-white border-accent" : "bg-bg-elevated border-border text-text-muted hover:border-border-strong"}`}>{p.label}</button>
                    ))}
                  </div>
                  <button onClick={() => { setShowCustom(false); setCustomName(""); setCustomProtein(""); }} className="text-12 text-text-muted hover:text-text-secondary transition-colors text-left">
                    ← Back to presets
                  </button>
                </div>
              )}

              {/* Recently saved toast */}
              {recentlySaved && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-r3 bg-[var(--color-success-soft,rgba(52,211,153,0.15))] text-12 text-text-secondary">
                  <Check size={14} className="text-[var(--color-success)]" />
                  <span><span className="font-medium text-text-primary">{recentlySaved}</span> — add another?</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer — only on main screen with preset selected */}
        {screen === "main" && !showSearchResults && (
          <div className="px-5 pb-5 pt-1 flex-shrink-0 flex gap-2">
            <button
              onClick={handleSavePreset}
              disabled={!canSave || saving}
              className="flex-1 py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-40"
            >
              {saving ? "Saving…" : canSave ? `Log ${activeProtein > 0 ? `(+${activeProtein}g)` : "meal"}` : "Select a meal"}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 rounded-r3 border border-border text-text-muted text-13 hover:text-text-secondary transition-colors">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
