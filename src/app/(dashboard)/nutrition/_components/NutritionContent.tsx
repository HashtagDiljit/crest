"use client";

import { useState, useEffect, useCallback, useOptimistic, useTransition } from "react";
import { Plus, Trash2, Clock, AlertCircle, X, EyeOff } from "lucide-react";
import { WidthProvider, ResponsiveReactGridLayout, type LayoutItem as RGLItem, type ResponsiveLayouts } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { MealLoggerModal } from "./MealLoggerModal";
import { WeeklyOverviewCard } from "./WeeklyOverviewCard";
import { SupplementLogSection } from "./SupplementLogSection";
import { toggleSupplement, deleteMeal, saveNutritionLayout } from "../actions";
import type { MealLogRow, SupplementLogRow, NutritionSettings } from "../types";

// ─── types ───────────────────────────────────────────────────────────────────

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const ResponsiveGridLayout = WidthProvider(ResponsiveReactGridLayout);

// ─── constants ────────────────────────────────────────────────────────────────

const BREAKPOINTS = { lg: 1200, md: 768, sm: 0 };
const COLS = { lg: 12, md: 4, sm: 2 };
const ROW_HEIGHT = 80;
const MARGIN: [number, number] = [16, 16];

const DEFAULT_CARDS = ["daily-summary", "todays-meals", "weekly-overview", "supplement-log"];

const CARD_LABELS: Record<string, string> = {
  "daily-summary": "Daily summary",
  "todays-meals": "Today's meals",
  "weekly-overview": "Weekly overview",
  "supplement-log": "Supplement log",
};

const DEFAULT_LAYOUT_LG: LayoutItem[] = [
  { i: "daily-summary",   x: 0, y: 0,  w: 12, h: 4 },
  { i: "todays-meals",    x: 0, y: 4,  w: 12, h: 5 },
  { i: "weekly-overview", x: 0, y: 9,  w: 12, h: 5 },
  { i: "supplement-log",  x: 0, y: 14, w: 12, h: 4 },
];

const DEFAULT_LAYOUT_MD: LayoutItem[] = [
  { i: "daily-summary",   x: 0, y: 0,  w: 4, h: 4 },
  { i: "todays-meals",    x: 0, y: 4,  w: 4, h: 5 },
  { i: "weekly-overview", x: 0, y: 9,  w: 4, h: 5 },
  { i: "supplement-log",  x: 0, y: 14, w: 4, h: 4 },
];

const DEFAULT_LAYOUT_SM: LayoutItem[] = [
  { i: "daily-summary",   x: 0, y: 0,  w: 2, h: 4 },
  { i: "todays-meals",    x: 0, y: 4,  w: 2, h: 5 },
  { i: "weekly-overview", x: 0, y: 9,  w: 2, h: 5 },
  { i: "supplement-log",  x: 0, y: 14, w: 2, h: 4 },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function mergeLayout(saved: LayoutItem[], defaults: LayoutItem[]): LayoutItem[] {
  const map = new Map(saved.map((it) => [it.i, it]));
  return defaults.map((d) => map.get(d.i) ?? d);
}

function fmtTime(isoStr: string) {
  try {
    return new Date(isoStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function mealTypeLabel(type: string | null): string {
  if (!type) return "Meal";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// ─── main export ──────────────────────────────────────────────────────────────

export function NutritionContent({
  todayMeals: initialMeals,
  weeklyTotals,
  supplementLogs: initialSupplLogs,
  settings,
  today,
  nutritionLayout,
}: {
  todayMeals: MealLogRow[];
  weeklyTotals: Array<{ date: string; protein_g: number }>;
  supplementLogs: SupplementLogRow[];
  settings: NutritionSettings;
  today: string;
  nutritionLayout?: { lg: LayoutItem[]; hidden: string[] } | null;
}) {
  const [showModal, setShowModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // ─── edit layout state ────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [layouts, setLayouts] = useState<{ lg: RGLItem[]; md: RGLItem[]; sm: RGLItem[] }>({
    lg: nutritionLayout?.lg
      ? (mergeLayout(nutritionLayout.lg, DEFAULT_LAYOUT_LG) as RGLItem[])
      : (DEFAULT_LAYOUT_LG as RGLItem[]),
    md: DEFAULT_LAYOUT_MD as RGLItem[],
    sm: DEFAULT_LAYOUT_SM as RGLItem[],
  });
  const [hiddenCards, setHiddenCards] = useState<string[]>(nutritionLayout?.hidden ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => setMounted(true), []);

  // Optimistic supplement state
  const todaySupplements = new Set(
    initialSupplLogs
      .filter((l) => l.logged_date === today)
      .map((l) => l.supplement_name)
  );
  const [optimisticSupplements, updateOptimisticSupplements] = useOptimistic(
    todaySupplements,
    (state: Set<string>, name: string) => {
      const next = new Set(state);
      if (next.has(name)) { next.delete(name); } else { next.add(name); }
      return next;
    }
  );

  // Optimistic meal delete
  const [optimisticMeals, removeMealOptimistic] = useOptimistic(
    initialMeals,
    (state: MealLogRow[], id: string) => state.filter((m) => m.id !== id)
  );

  const totalProtein = optimisticMeals.reduce((s, m) => s + (m.protein_g ?? 0), 0);
  const target = settings.protein_target || 150;
  const pct = target > 0 ? Math.min(100, Math.max(0, (totalProtein / target) * 100)) : 0;
  const mealCount = optimisticMeals.length;
  const targetMeals = settings.meals_per_day || 4;
  const proteinAnchored = optimisticMeals.filter((m) => (m.protein_g ?? 0) >= 20).length;

  const activeSupplements = Object.entries(settings.supplements)
    .filter(([, on]) => on)
    .map(([name]) => name);

  function handleToggleSupplement(name: string) {
    startTransition(async () => {
      updateOptimisticSupplements(name);
      await toggleSupplement(name);
    });
  }

  function handleDeleteMeal(id: string) {
    setConfirmDeleteId(null);
    startTransition(async () => {
      removeMealOptimistic(id);
      await deleteMeal(id);
    });
  }

  // ─── layout handlers ────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLayoutChange = useCallback((_layout: any, allLayouts: any) => {
    setLayouts((prev) => ({
      lg: (allLayouts.lg as RGLItem[] | undefined) ?? prev.lg,
      md: prev.md,
      sm: prev.sm,
    }));
  }, []);

  function hideCard(id: string) {
    setHiddenCards((prev) => [...prev, id]);
  }

  function showCard(id: string) {
    setHiddenCards((prev) => prev.filter((h) => h !== id));
  }

  function handleReset() {
    setLayouts({ lg: DEFAULT_LAYOUT_LG, md: DEFAULT_LAYOUT_MD, sm: DEFAULT_LAYOUT_SM });
    setHiddenCards([]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveNutritionLayout({ lg: layouts.lg, hidden: hiddenCards });
    } finally {
      setSaving(false);
      setEditMode(false);
    }
  }

  function handleCancel() {
    setLayouts({
      lg: nutritionLayout?.lg
        ? (mergeLayout(nutritionLayout.lg, DEFAULT_LAYOUT_LG) as RGLItem[])
        : (DEFAULT_LAYOUT_LG as RGLItem[]),
      md: DEFAULT_LAYOUT_MD as RGLItem[],
      sm: DEFAULT_LAYOUT_SM as RGLItem[],
    });
    setHiddenCards(nutritionLayout?.hidden ?? []);
    setEditMode(false);
  }

  const visibleIds = DEFAULT_CARDS.filter((id) => !hiddenCards.includes(id));
  const hiddenIds = DEFAULT_CARDS.filter((id) => hiddenCards.includes(id));

  // ─── render card by id ────────────────────────────────────────────────────

  function renderCard(id: string): React.ReactNode {
    switch (id) {
      case "daily-summary":
        return (
          <div className={`h-full rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-5 ${editMode ? "overflow-y-auto" : "overflow-hidden"}`}>
            {/* Date + header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-16 font-semibold text-text-primary">
                  {new Date(today + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                </h2>
                <p className="text-12 text-text-muted mt-0.5">Daily nutrition overview</p>
              </div>
              <div className="text-right">
                <div className="text-24 font-display font-semibold text-text-primary leading-none">{Math.round(totalProtein)}g</div>
                <div className="text-11 text-text-muted">/ {target}g protein</div>
              </div>
            </div>

            {/* Protein progress bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-12 text-text-muted">
                <span>{Math.round(pct)}% of daily target</span>
                <span>{mealCount} / {targetMeals} meals</span>
              </div>
              <div className="h-3 rounded-pill bg-bg-elevated overflow-hidden">
                <div
                  className="h-full rounded-pill transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 100 ? "var(--color-success)" : "var(--color-accent)",
                  }}
                />
              </div>
            </div>

            {/* Distribution warning */}
            {mealCount > 0 && proteinAnchored < 3 && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-r3 bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.2)]">
                <AlertCircle size={14} className="text-[var(--color-warning)] flex-shrink-0 mt-0.5" />
                <p className="text-12 text-text-secondary">
                  Log another protein-anchored meal (20g+) to hit your distribution target.
                </p>
              </div>
            )}

            {/* Supplement checklist */}
            {activeSupplements.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-11 font-semibold uppercase tracking-[0.08em] text-text-muted">Today&apos;s supplements</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {activeSupplements.map((name) => {
                    const taken = optimisticSupplements.has(name);
                    return (
                      <button
                        key={name}
                        onClick={() => handleToggleSupplement(name)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-r3 border text-left transition-all ${
                          taken
                            ? "border-[var(--color-success)] bg-[rgba(52,211,153,0.08)]"
                            : "border-border bg-bg-elevated hover:border-border-strong"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-r2 border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            taken
                              ? "bg-[var(--color-success)] border-[var(--color-success)]"
                              : "border-border"
                          }`}
                        >
                          {taken && (
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1.5 4L3 5.5L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span className={`text-12 font-medium ${taken ? "text-text-primary" : "text-text-secondary"}`}>
                          {name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      case "todays-meals":
        return (
          <div className={`h-full rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-4 ${editMode ? "overflow-y-auto" : "overflow-hidden"}`}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-16 font-semibold text-text-primary">Today&apos;s meals</h2>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-12 font-semibold transition-colors"
              >
                <Plus size={14} />
                Add meal
              </button>
            </div>

            {optimisticMeals.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <div className="w-10 h-10 rounded-r4 bg-bg-elevated flex items-center justify-center">
                  <Plus size={18} className="text-text-disabled" />
                </div>
                <p className="text-13 text-text-muted">No meals logged yet today</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-1 text-12 font-semibold text-accent hover:underline"
                >
                  Log your first meal →
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {optimisticMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-r3 bg-bg-elevated group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-13 font-medium text-text-primary truncate">{meal.food_name ?? "Meal"}</span>
                        <span className="text-11 text-text-disabled flex-shrink-0">{mealTypeLabel(meal.meal_type)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={11} className="text-text-disabled" />
                        <span className="text-11 text-text-muted">{fmtTime(meal.logged_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="font-mono text-13 font-semibold text-accent">+{meal.protein_g ?? 0}g</span>
                      {confirmDeleteId === meal.id ? (
                        <>
                          <button
                            onClick={() => handleDeleteMeal(meal.id)}
                            className="ml-1 px-2 py-0.5 rounded-r2 bg-red-500 text-white text-11 font-semibold hover:bg-red-600 transition-colors"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1 rounded text-text-muted hover:text-text-primary transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(meal.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-red-400 transition-all"
                          title="Remove from log"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-r3 border border-dashed border-border text-12 text-text-muted hover:text-text-secondary hover:border-border-strong transition-colors mt-1"
                >
                  <Plus size={13} />
                  Add another meal
                </button>
              </div>
            )}
          </div>
        );

      case "weekly-overview":
        return (
          <div className={`h-full ${editMode ? "overflow-y-auto" : "overflow-hidden"}`}>
            <WeeklyOverviewCard
              weeklyTotals={weeklyTotals}
              supplementLogs={initialSupplLogs}
              settings={settings}
            />
          </div>
        );

      case "supplement-log":
        return (
          <div className={`h-full ${editMode ? "overflow-y-auto" : "overflow-hidden"}`}>
            <SupplementLogSection supplementLogs={initialSupplLogs} settings={settings} />
          </div>
        );

      default:
        return null;
    }
  }

  // Supplement log card renders nothing when there are no active supplements —
  // exclude it from the grid (and the hidden-widgets panel) in that case.
  const renderableIds = activeSupplements.length > 0 ? DEFAULT_CARDS : DEFAULT_CARDS.filter((id) => id !== "supplement-log");
  const gridVisibleIds = visibleIds.filter((id) => renderableIds.includes(id));
  const gridHiddenIds = hiddenIds.filter((id) => renderableIds.includes(id));

  // ─── render ─────────────────────────────────────────────────────────────────

  // Pre-mount skeleton avoids WidthProvider SSR mismatch
  const gridContent = !mounted ? (
    <div className="flex flex-col gap-6">
      {gridVisibleIds.map((id) => (
        <div key={id} className="h-40 rounded-r5 border border-border bg-bg-surface" />
      ))}
    </div>
  ) : (
    <div className={editMode ? "rgl-edit-container" : ""}>
      <ResponsiveGridLayout
        layouts={layouts as unknown as ResponsiveLayouts}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        margin={MARGIN}
        isDraggable={editMode}
        isResizable={editMode}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".rgl-drag-handle"
        resizeHandles={["se"]}
        useCSSTransforms
      >
        {gridVisibleIds.map((id) => (
          <div key={id} className="rgl-drag-handle">
            <div className="relative h-full group">
              {renderCard(id)}
              {editMode && (
                <div className="absolute inset-0 rounded-r5 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
              )}
              {editMode && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); hideCard(id); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-pill bg-bg-elevated/90 border border-border flex items-center justify-center text-text-muted hover:text-danger hover:border-danger transition-colors z-10"
                  aria-label={`Hide ${CARD_LABELS[id] ?? id}`}
                >
                  <EyeOff size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* Hidden cards panel */}
      {editMode && gridHiddenIds.length > 0 && (
        <div className="mt-6 p-4 rounded-r4 border border-dashed border-border bg-bg-surface">
          <p className="text-11 font-semibold uppercase tracking-widest text-text-muted mb-3">Hidden widgets — click to restore</p>
          <div className="flex flex-wrap gap-2">
            {gridHiddenIds.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => showCard(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-r3 border border-border bg-bg-elevated hover:bg-bg-overlay text-13 text-text-secondary hover:text-text-primary transition-colors"
              >
                <Plus size={12} />
                <span>{CARD_LABELS[id] ?? id}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {showModal && (
        <MealLoggerModal onClose={() => setShowModal(false)} proteinTarget={target} />
      )}

      <div className="flex flex-col gap-4 md:gap-5">
        {/* Header */}
        <div className="flex items-center justify-end gap-2">
          {editMode ? (
            <>
              <button type="button" onClick={handleReset} className="text-13 text-text-muted hover:text-text-secondary transition-colors px-2 py-1.5">
                Reset
              </button>
              <button type="button" onClick={handleCancel} className="p-1.5 rounded-r2 text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors" aria-label="Cancel">
                <X size={16} />
              </button>
              <button type="button" onClick={handleSave} disabled={saving} className="px-3 py-1.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-medium transition-colors disabled:opacity-50">
                {saving ? "Saving…" : "Done"}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setEditMode(true)} className="px-3 py-1.5 rounded-r3 border border-border text-13 text-text-secondary hover:bg-bg-elevated transition-colors">
              Edit layout
            </button>
          )}
        </div>

        {gridContent}
      </div>
    </>
  );
}
