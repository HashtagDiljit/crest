"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { X, Check, ChevronRight, Search, Barcode, ArrowLeft, Loader2, EyeOff, Trash2 } from "lucide-react";
import { logMeal, getRecentMeals, getGlobalFoodPresets, hidePreset, deleteCustomPreset } from "../actions";
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
  defaultGrams?: number;
  presetId?: string;
  isGlobalPreset?: boolean;
}

// ─── hardcoded preset data ────────────────────────────────────────────────────
// Used as the preset list when not searching. Values = per typical serving.
// protein100g/calories100g are computed at runtime via servingG.

interface Preset {
  key: string;
  label: string;
  proteinG: number;
  caloriesKcal: number;
  servingG: number;
}

const BREAKFAST: Preset[] = [
  { key: "oats",          label: "Oats (100g dry)",               proteinG: 13, caloriesKcal: 389, servingG: 100 },
  { key: "oats_whey",     label: "Oats with whey",                proteinG: 38, caloriesKcal: 500, servingG: 130 },
  { key: "eggs_3",        label: "Scrambled eggs ×3",             proteinG: 18, caloriesKcal: 210, servingG: 150 },
  { key: "greek_yogurt",  label: "Greek yogurt (200g)",           proteinG: 20, caloriesKcal: 130, servingG: 200 },
  { key: "skyr",          label: "Skyr (170g)",                   proteinG: 17, caloriesKcal: 100, servingG: 170 },
  { key: "shake_b",       label: "Protein shake (whey + water)",  proteinG: 24, caloriesKcal: 130, servingG: 300 },
];

const SOUTH_ASIAN: Preset[] = [
  { key: "chicken_curry_rice",   label: "Chicken curry with rice (300g)", proteinG: 32, caloriesKcal: 480, servingG: 300 },
  { key: "dal_tadka_rice",       label: "Dal tadka with rice (300g)",     proteinG: 14, caloriesKcal: 420, servingG: 300 },
  { key: "chana_masala",         label: "Chana masala (200g)",            proteinG: 10, caloriesKcal: 280, servingG: 200 },
  { key: "paneer_curry",         label: "Paneer curry (200g)",            proteinG: 18, caloriesKcal: 360, servingG: 200 },
  { key: "egg_bhurji",           label: "Egg bhurji ×3 eggs",             proteinG: 18, caloriesKcal: 220, servingG: 150 },
  { key: "chicken_biryani",      label: "Chicken biryani (300g)",         proteinG: 30, caloriesKcal: 520, servingG: 300 },
  { key: "lamb_keema",           label: "Lamb keema (200g)",              proteinG: 26, caloriesKcal: 380, servingG: 200 },
  { key: "chapatti_x2",          label: "Chapatti ×2 (plain)",            proteinG:  8, caloriesKcal: 280, servingG: 120 },
  { key: "dal_makhani",          label: "Dal makhani (200g)",             proteinG: 10, caloriesKcal: 260, servingG: 200 },
  { key: "tandoori_chicken",     label: "Tandoori chicken breast (150g)", proteinG: 38, caloriesKcal: 220, servingG: 150 },
];

const PROTEIN_SOURCES: Preset[] = [
  { key: "chicken_breast",  label: "Chicken breast (150g cooked)",  proteinG: 44, caloriesKcal: 248, servingG: 150 },
  { key: "salmon",          label: "Salmon fillet (150g)",          proteinG: 34, caloriesKcal: 280, servingG: 150 },
  { key: "tuna",            label: "Tuna steak (150g)",             proteinG: 38, caloriesKcal: 195, servingG: 150 },
  { key: "beef_mince",      label: "Beef mince 5% fat (150g)",      proteinG: 36, caloriesKcal: 260, servingG: 150 },
  { key: "turkey_breast",   label: "Turkey breast (150g)",          proteinG: 42, caloriesKcal: 195, servingG: 150 },
  { key: "boiled_eggs_2",   label: "Boiled eggs ×2",                proteinG: 12, caloriesKcal: 140, servingG: 100 },
  { key: "cottage_cheese",  label: "Cottage cheese (200g)",         proteinG: 24, caloriesKcal: 180, servingG: 200 },
  { key: "tofu_firm",       label: "Firm tofu (150g)",              proteinG: 18, caloriesKcal: 120, servingG: 150 },
];

const SNACKS: Preset[] = [
  { key: "whey_shake",    label: "Whey protein shake",          proteinG: 24, caloriesKcal: 130, servingG: 300 },
  { key: "greek_snack",   label: "Greek yogurt (150g)",         proteinG: 15, caloriesKcal: 100, servingG: 150 },
  { key: "nuts",          label: "Mixed nuts (30g)",            proteinG:  6, caloriesKcal: 185, servingG:  30 },
  { key: "rice_pb",       label: "Rice cakes ×2 + peanut butter", proteinG: 8, caloriesKcal: 200, servingG: 80 },
  { key: "boiled_eggs_s", label: "Boiled eggs ×2",              proteinG: 12, caloriesKcal: 140, servingG: 100 },
];

const PRESETS: Record<MealType, Preset[]> = {
  Breakfast: BREAKFAST,
  Lunch:     [...SOUTH_ASIAN, ...PROTEIN_SOURCES],
  Dinner:    [...SOUTH_ASIAN, ...PROTEIN_SOURCES],
  Snack:     SNACKS,
};

const MEAL_TYPES: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack"];

// ─── USDA helpers ─────────────────────────────────────────────────────────────

const CACHE_TTL = 24 * 60 * 60 * 1000;

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
  const data = await res.json() as { foods?: any[] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const foods: USDAFood[] = (data.foods ?? []).map((f: any) => ({
    fdcId:        f.fdcId,
    name:         f.description ?? "",
    brand:        f.brandOwner ?? "",
    protein100g:  nutrientValue(f.foodNutrients ?? [], "203"),
    calories100g: nutrientValue(f.foodNutrients ?? [], "208"),
    carbs100g:    nutrientValue(f.foodNutrients ?? [], "205"),
    fat100g:      nutrientValue(f.foodNutrients ?? [], "204"),
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
    name:         p.product_name ?? "Unknown product",
    brand:        p.brands ?? "",
    protein100g:  n.proteins_100g ?? 0,
    calories100g: n["energy-kcal_100g"] ?? 0,
    carbs100g:    n.carbohydrates_100g ?? 0,
    fat100g:      n.fat_100g ?? 0,
    barcode,
  };
}

// ─── portion / confirmation screen ───────────────────────────────────────────

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
  const [grams, setGrams] = useState(food.defaultGrams ?? 100);
  const [saving, setSaving] = useState(false);

  const multiplier = grams / 100;
  const protein  = Math.round(food.protein100g  * multiplier * 10) / 10;
  const calories = Math.round(food.calories100g * multiplier);
  const carbs    = Math.round(food.carbs100g    * multiplier * 10) / 10;
  const fat      = Math.round(food.fat100g      * multiplier * 10) / 10;
  const projected = todayProtein + protein;
  const pct = Math.min(100, (projected / proteinTarget) * 100);

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
    track("meal_logged", { mealType, source: food.fdcId ? "usda" : food.barcode ? "barcode" : "preset", proteinG: protein });
    onLogged(protein);
  }

  const macroKnown = food.calories100g > 0;

  return (
    <div className="flex flex-col gap-4">
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
            onChange={(e) => setGrams(Math.max(1, parseInt(e.target.value) || (food.defaultGrams ?? 100)))}
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
      {macroKnown ? (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Protein",  value: `${protein}g`,   color: "var(--color-accent)" },
            { label: "Calories", value: `${calories}`,   color: "var(--color-text-primary)" },
            { label: "Carbs",    value: carbs > 0 ? `${carbs}g` : "—", color: "var(--color-warning)" },
            { label: "Fat",      value: fat   > 0 ? `${fat}g`   : "—", color: "var(--color-info)" },
          ].map((m) => (
            <div key={m.label} className="rounded-r3 border border-border bg-bg-elevated p-2 text-center">
              <p className="font-mono text-14 font-bold" style={{ color: m.color }}>{m.value}</p>
              <p className="text-10 text-text-muted mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-r3 border border-border bg-bg-elevated p-3 text-center">
          <p className="font-mono text-20 font-bold text-accent">{protein}g</p>
          <p className="text-11 text-text-muted mt-0.5">protein</p>
        </div>
      )}

      {/* Protein progress */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-11 text-text-muted">
          <span>Today&apos;s protein after adding</span>
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
        {saving ? "Adding…" : "Add to today's log"}
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
  const [screen, setScreen]         = useState<Screen>("main");
  const [mealType, setMealType]     = useState<MealType>("Lunch");
  const [todayProtein, setTodayProtein] = useState(0);
  const [recentlySaved, setRecentlySaved] = useState<string | null>(null);
  const [recentMeals, setRecentMeals] = useState<Array<{ meal_name: string; protein_g: number; food_preset: string | null }>>([]);
  const [foodDb, setFoodDb]         = useState<FoodPreset[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [usdaResults, setUsdaResults] = useState<USDAFood[]>([]);
  const [usdaLoading, setUsdaLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [portionFood, setPortionFood] = useState<PortionFood | null>(null);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customProtein, setCustomProtein] = useState("");

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

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setUsdaResults([]); return; }
    setUsdaLoading(true);
    const results = await searchUSDA(q);
    setUsdaResults(results);
    setUsdaLoading(false);
  }, []);

  function handleSearchChange(q: string) {
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(q), 400);
  }

  const localResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return foodDb.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 8);
  }, [searchQuery, foodDb]);

  const showSearchResults = searchQuery.length >= 2;

  function openPortionForPreset(p: Preset) {
    setPortionFood({
      name:         p.label,
      brand:        "",
      protein100g:  (p.proteinG  / p.servingG) * 100,
      calories100g: (p.caloriesKcal / p.servingG) * 100,
      carbs100g:    0,
      fat100g:      0,
      defaultGrams: p.servingG,
    });
    setScreen("portion");
  }

  function openPortionForDbPreset(f: FoodPreset) {
    setPortionFood({
      name:         f.name,
      brand:        f.category,
      protein100g:  f.protein_g,
      calories100g: f.calories_kcal,
      carbs100g:    f.carbs_g,
      fat100g:      f.fat_g,
      defaultGrams: f.serving_g,
      presetId:     f.id,
      isGlobalPreset: f.is_global,
    });
    setScreen("portion");
  }

  function openPortionForUSDA(food: USDAFood) {
    setPortionFood({
      name:         food.name,
      brand:        food.brand,
      protein100g:  food.protein100g,
      calories100g: food.calories100g,
      carbs100g:    food.carbs100g,
      fat100g:      food.fat100g,
      fdcId:        food.fdcId,
    });
    setScreen("portion");
  }

  function openPortionForCustom() {
    const p = parseFloat(customProtein);
    if (!customName.trim() || isNaN(p) || p <= 0) return;
    setPortionFood({
      name:         customName.trim(),
      brand:        "",
      protein100g:  p,
      calories100g: 0,
      carbs100g:    0,
      fat100g:      0,
      defaultGrams: 100,
    });
    setScreen("portion");
  }

  async function handleBarcodeResult(result: { barcode: string }) {
    setBarcodeLoading(true);
    setBarcodeError(null);
    setScreen("main");
    const food = await lookupBarcode(result.barcode);
    setBarcodeLoading(false);
    if (!food) {
      setBarcodeError(`No product found for barcode ${result.barcode}. Try manual search below.`);
      return;
    }
    setPortionFood(food);
    setScreen("portion");
  }

  function handlePortionLogged(proteinAdded: number) {
    setTodayProtein((prev) => prev + proteinAdded);
    setRecentlySaved("Meal added!");
    setScreen("main");
    setPortionFood(null);
    setSearchQuery("");
    setUsdaResults([]);
    setShowCustom(false);
    setCustomName("");
    setCustomProtein("");
    setTimeout(() => setRecentlySaved(null), 2000);
  }

  async function handleHidePreset(presetId: string) {
    await hidePreset(presetId);
    setFoodDb((prev) => prev.filter((f) => f.id !== presetId));
    setScreen("main");
    setPortionFood(null);
  }

  async function handleDeleteCustom(presetId: string) {
    await deleteCustomPreset(presetId);
    setFoodDb((prev) => prev.filter((f) => f.id !== presetId));
    setScreen("main");
    setPortionFood(null);
  }

  const presets = PRESETS[mealType];
  const pct = Math.min(100, (todayProtein / proteinTarget) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative z-10 w-full max-w-md rounded-r5 border border-border bg-bg-surface shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0 border-b border-border">
          <h2 className="font-display text-16 font-semibold text-text-primary">
            {screen === "barcode" ? "Scan barcode" : screen === "portion" ? "Confirm & add" : "Log meal"}
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

          {/* ── PORTION / CONFIRM SCREEN ── */}
          {screen === "portion" && portionFood && (
            <>
              <PortionScreen
                food={portionFood}
                mealType={mealType}
                todayProtein={todayProtein}
                proteinTarget={proteinTarget}
                onBack={() => { setScreen("main"); setPortionFood(null); }}
                onLogged={handlePortionLogged}
              />
              {/* Hide / Delete preset options */}
              {portionFood.presetId && (
                <div className="flex gap-2 mt-1 pt-3 border-t border-border">
                  {portionFood.isGlobalPreset ? (
                    <button
                      onClick={() => handleHidePreset(portionFood.presetId!)}
                      className="flex items-center gap-1.5 text-12 text-text-muted hover:text-text-secondary transition-colors"
                    >
                      <EyeOff size={12} /> Hide this preset
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDeleteCustom(portionFood.presetId!)}
                      className="flex items-center gap-1.5 text-12 text-error hover:opacity-80 transition-opacity"
                    >
                      <Trash2 size={12} /> Delete custom preset
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── MAIN SCREEN ── */}
          {screen === "main" && (
            <>
              {/* Protein progress */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-12">
                  <span className="text-text-secondary">Today&apos;s protein</span>
                  <span className="font-mono font-semibold" style={{ color: pct >= 100 ? "var(--color-success)" : "var(--color-text-primary)" }}>
                    {Math.round(todayProtein)}g / {proteinTarget}g
                  </span>
                </div>
                <div className="h-2 rounded-pill bg-bg-elevated overflow-hidden">
                  <div className="h-full rounded-pill transition-all duration-500" style={{ width: `${pct}%`, background: pct >= 100 ? "var(--color-success)" : "var(--color-accent)" }} />
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

              {/* Search bar + barcode */}
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
                    className="flex items-center px-3 py-2 rounded-r3 border border-border bg-bg-elevated text-text-muted hover:text-text-secondary hover:border-border-strong transition-colors"
                    title="Scan barcode"
                  >
                    <Barcode size={15} />
                  </button>
                </div>
              )}

              {/* Barcode states */}
              {barcodeLoading && (
                <div className="flex items-center gap-2 text-12 text-text-muted">
                  <Loader2 size={13} className="animate-spin" /> Looking up barcode…
                </div>
              )}
              {barcodeError && (
                <p className="text-12 text-warning bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.3)] rounded-r3 px-3 py-2">{barcodeError}</p>
              )}

              {/* Search results */}
              {showSearchResults && !showCustom && (
                <div className="flex flex-col gap-1">
                  {usdaLoading && usdaResults.length === 0 && (
                    <div className="text-12 text-text-muted py-2 text-center">Searching USDA database…</div>
                  )}
                  {!usdaLoading && usdaResults.length === 0 && localResults.length === 0 && (
                    <div className="text-12 text-text-muted py-2 text-center">No results found.</div>
                  )}

                  {/* Local DB presets */}
                  {localResults.length > 0 && (
                    <>
                      <p className="text-11 font-semibold uppercase tracking-widest text-text-muted mb-0.5">Presets</p>
                      {localResults.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => openPortionForDbPreset(f)}
                          className="flex items-center justify-between px-3 py-2 rounded-r3 border border-border bg-bg-elevated hover:border-border-strong text-left transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-13 text-text-secondary truncate">{f.name}</p>
                            <p className="text-11 text-text-muted">{f.category}</p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="font-mono text-12 text-accent">{f.protein_g}g protein</p>
                            {f.calories_kcal > 0 && <p className="text-10 text-text-muted">{f.calories_kcal} kcal</p>}
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {/* USDA results */}
                  {usdaResults.length > 0 && (
                    <>
                      <p className="text-11 font-semibold uppercase tracking-widest text-text-muted mb-0.5 mt-1">USDA database</p>
                      {usdaResults.map((f) => (
                        <button
                          key={f.fdcId}
                          onClick={() => openPortionForUSDA(f)}
                          className="flex items-center justify-between px-3 py-2 rounded-r3 border border-border bg-bg-elevated hover:border-border-strong text-left transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-13 text-text-secondary truncate">{f.name}</p>
                            {f.brand && <p className="text-11 text-text-muted truncate">{f.brand}</p>}
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="font-mono text-12 text-accent">{f.protein100g.toFixed(1)}g / 100g</p>
                            <p className="text-10 text-text-muted">{Math.round(f.calories100g)} kcal</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Presets + recents (not searching) */}
              {!showSearchResults && !showCustom && (
                <>
                  {/* Recent meals */}
                  {recentMeals.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">Recent</span>
                      <div className="flex flex-col gap-1">
                        {recentMeals.map((m) => (
                          <button
                            key={m.meal_name}
                            onClick={() => { setPortionFood({ name: m.meal_name, brand: "", protein100g: m.protein_g, calories100g: 0, carbs100g: 0, fat100g: 0, defaultGrams: 100 }); setScreen("portion"); }}
                            className="flex items-center justify-between px-3 py-2 rounded-r3 border border-border bg-bg-elevated hover:border-border-strong text-left transition-colors"
                          >
                            <span className="text-13 text-text-secondary truncate">{m.meal_name}</span>
                            <span className="font-mono text-12 text-accent flex-shrink-0 ml-2">{m.protein_g}g</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preset list */}
                  <div className="flex flex-col gap-1">
                    <span className="text-11 font-semibold uppercase tracking-widest text-text-muted mb-0.5">
                      {mealType === "Lunch" || mealType === "Dinner" ? "South Asian + protein sources" : mealType}
                    </span>
                    {presets.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => openPortionForPreset(p)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-r3 border border-border bg-bg-elevated hover:border-border-strong text-left transition-colors"
                      >
                        <span className="text-13 text-text-secondary">{p.label}</span>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="font-mono text-12 text-accent">{p.proteinG}g</span>
                          <span className="text-11 text-text-muted">{p.caloriesKcal} kcal</span>
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={() => setShowCustom(true)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-r3 border border-dashed border-border bg-bg-elevated hover:border-border-strong text-left transition-colors"
                    >
                      <span className="text-13 text-text-muted">Custom entry…</span>
                      <ChevronRight size={14} className="text-text-muted" />
                    </button>
                  </div>
                </>
              )}

              {/* Custom entry form */}
              {showCustom && (
                <div className="flex flex-col gap-3">
                  <button onClick={() => setShowCustom(false)} className="flex items-center gap-1 text-12 text-text-muted hover:text-text-secondary transition-colors self-start">
                    <ArrowLeft size={13} /> Back to presets
                  </button>
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
                      placeholder="Protein per 100g"
                      className="flex-1 rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary outline-none focus:border-accent transition-colors"
                    />
                    <span className="text-13 text-text-muted flex-shrink-0">g / 100g</span>
                  </div>
                  <button
                    onClick={openPortionForCustom}
                    disabled={!customName.trim() || !customProtein}
                    className="w-full py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-40"
                  >
                    Continue →
                  </button>
                </div>
              )}

              {/* Success toast */}
              {recentlySaved && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-r3 bg-[rgba(52,211,153,0.12)] border border-[rgba(52,211,153,0.25)] text-12 text-text-secondary">
                  <Check size={14} className="text-[var(--color-success)]" />
                  <span><span className="font-medium text-text-primary">{recentlySaved}</span> — add another?</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
