"use client";

import { useState } from "react";
import { Clock, ChefHat, Check, Heart } from "lucide-react";
import { RECIPES, type Recipe } from "../data";
import { logMeal } from "@/app/(dashboard)/nutrition/actions";

type Tag = "all" | "south-asian" | "meal-prep" | "quick" | "vegetarian";

const TABS: { id: Tag; label: string }[] = [
  { id: "all",         label: "All" },
  { id: "south-asian", label: "South Asian" },
  { id: "meal-prep",   label: "Meal prep" },
  { id: "quick",       label: "Quick (< 20 min)" },
  { id: "vegetarian",  label: "Vegetarian" },
];

const DIFFICULTY_COLOR: Record<string, string> = {
  easy:   "var(--color-success)",
  medium: "var(--color-warning)",
  hard:   "var(--color-danger)",
};

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [expanded, setExpanded] = useState(false);
  const [logging, setLogging]   = useState(false);
  const [logged, setLogged]     = useState(false);
  const [saved, setSaved]       = useState(false);

  async function handleLog() {
    setLogging(true);
    await logMeal("Dinner", recipe.name, recipe.proteinG, true, `recipe:${recipe.id}`, 1);
    setLogging(false);
    setLogged(true);
    setTimeout(() => setLogged(false), 2500);
  }

  return (
    <div className="rounded-r5 border border-border bg-bg-surface flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-15 font-semibold text-text-primary leading-tight">{recipe.name}</h3>
          <button
            onClick={() => { setSaved((s) => !s); }}
            className={`flex-shrink-0 transition-colors ${saved ? "text-danger" : "text-text-muted hover:text-danger"}`}
            title={saved ? "Remove from favourites" : "Save to favourites"}
          >
            <Heart size={15} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-13 font-bold text-accent">{recipe.proteinG}g protein</span>
          <span className="text-12 text-text-muted">{recipe.caloriesKcal} kcal</span>
          <span className="flex items-center gap-1 text-12 text-text-muted">
            <Clock size={11} />
            {recipe.prepTimeMin} min
          </span>
          <span className="flex items-center gap-1 text-11 font-medium capitalize" style={{ color: DIFFICULTY_COLOR[recipe.difficulty] }}>
            <ChefHat size={11} />
            {recipe.difficulty}
          </span>
        </div>
      </div>

      {/* Expand / collapse */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="px-4 py-2 text-12 text-accent hover:text-accent-hover border-t border-border text-left transition-colors"
      >
        {expanded ? "Hide details ↑" : "Show ingredients & method ↓"}
      </button>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-4 border-t border-border pt-4">
          {/* Ingredients */}
          <div>
            <p className="text-11 font-semibold uppercase tracking-widest text-text-muted mb-2">Ingredients</p>
            <div className="flex flex-col gap-1">
              {recipe.ingredients.map((ing) => (
                <div key={ing.item} className="flex justify-between text-12">
                  <span className="text-text-secondary">{ing.item}</span>
                  <span className="text-text-muted font-mono">{ing.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <p className="text-11 font-semibold uppercase tracking-widest text-text-muted mb-2">Method</p>
            <ol className="flex flex-col gap-2">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-12 text-text-secondary">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-bg-elevated text-10 font-bold text-text-muted flex items-center justify-center mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-auto px-4 pb-4 pt-3 flex gap-2">
        <button
          onClick={handleLog}
          disabled={logging}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-r3 bg-accent hover:bg-accent-hover text-white text-12 font-semibold transition-colors disabled:opacity-60"
        >
          {logged ? <><Check size={13} /> Logged!</> : logging ? "Logging…" : `Log this meal (+${recipe.proteinG}g)`}
        </button>
      </div>
    </div>
  );
}

export function RecipesContent() {
  const [activeTag, setActiveTag] = useState<Tag>("all");

  const filtered = activeTag === "all"
    ? RECIPES
    : activeTag === "quick"
    ? RECIPES.filter((r) => r.prepTimeMin < 20)
    : RECIPES.filter((r) => r.tags.includes(activeTag));

  return (
    <div className="flex flex-col gap-5">
      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTag(tab.id)}
            className={`px-3 py-1.5 rounded-r3 border text-12 font-medium transition-colors ${
              activeTag === tab.id
                ? "bg-accent text-white border-accent"
                : "border-border text-text-secondary hover:bg-bg-elevated"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-12 text-text-muted">{filtered.length} recipes</p>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((r) => (
          <RecipeCard key={r.id} recipe={r} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-text-muted text-13">No recipes match this filter.</div>
      )}
    </div>
  );
}
