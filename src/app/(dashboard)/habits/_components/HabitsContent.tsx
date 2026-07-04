"use client";

import { useState, useEffect, useCallback } from "react";
import { WidthProvider, ResponsiveReactGridLayout, type LayoutItem as RGLItem, type ResponsiveLayouts } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { X } from "lucide-react";
import { HabitList } from "./HabitList";
import { StreaksPanel } from "./StreaksPanel";
import { StreakGrid } from "./StreakGrid";
import { saveHabitsLayout } from "../actions";
import type { HabitRow, HabitLogEntry } from "../actions";

// ─── types ───────────────────────────────────────────────────────────────────

/** Simplified grid item — matches RGLItem but without optional fields */
export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const ResponsiveGridLayout = WidthProvider(ResponsiveReactGridLayout);

export interface HabitsContentProps {
  habits: HabitRow[];
  allLogs: HabitLogEntry[];
  username: string;
  habitsLayout: { lg: LayoutItem[] } | null;
}

// ─── constants ────────────────────────────────────────────────────────────────

const BREAKPOINTS = { lg: 1200, md: 768, sm: 0 };
const COLS = { lg: 12, md: 4, sm: 2 };
const ROW_HEIGHT = 80;
const MARGIN: [number, number] = [16, 16];

const SECTION_IDS = ["habit-list", "streaks-panel", "streak-grid"];

const DEFAULT_LAYOUT_LG: LayoutItem[] = [
  { i: "habit-list",    x: 0, y: 0, w: 8,  h: 6 },
  { i: "streaks-panel", x: 8, y: 0, w: 4,  h: 6 },
  { i: "streak-grid",   x: 0, y: 6, w: 12, h: 5 },
];

const DEFAULT_LAYOUT_MD: LayoutItem[] = [
  { i: "habit-list",    x: 0, y: 0,  w: 4, h: 6 },
  { i: "streaks-panel", x: 0, y: 6,  w: 4, h: 6 },
  { i: "streak-grid",   x: 0, y: 12, w: 4, h: 5 },
];

const DEFAULT_LAYOUT_SM: LayoutItem[] = [
  { i: "habit-list",    x: 0, y: 0,  w: 2, h: 6 },
  { i: "streaks-panel", x: 0, y: 6,  w: 2, h: 6 },
  { i: "streak-grid",   x: 0, y: 12, w: 2, h: 5 },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function mergeLayout(saved: LayoutItem[], defaults: LayoutItem[]): LayoutItem[] {
  const map = new Map(saved.map((it) => [it.i, it]));
  return defaults.map((d) => map.get(d.i) ?? d);
}

function renderSection(id: string, props: HabitsContentProps): React.ReactNode {
  switch (id) {
    case "habit-list":    return <HabitList habits={props.habits} username={props.username} />;
    case "streaks-panel": return <StreaksPanel habits={props.habits} allLogs={props.allLogs} />;
    case "streak-grid":   return <StreakGrid habits={props.habits} allLogs={props.allLogs} />;
    default:              return null;
  }
}

// ─── main export ──────────────────────────────────────────────────────────────

export function HabitsContent(props: HabitsContentProps) {
  const [mounted, setMounted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [layouts, setLayouts] = useState<{ lg: RGLItem[]; md: RGLItem[]; sm: RGLItem[] }>({
    lg: props.habitsLayout?.lg
      ? mergeLayout(props.habitsLayout.lg, DEFAULT_LAYOUT_LG) as RGLItem[]
      : DEFAULT_LAYOUT_LG as RGLItem[],
    md: DEFAULT_LAYOUT_MD as RGLItem[],
    sm: DEFAULT_LAYOUT_SM as RGLItem[],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => setMounted(true), []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLayoutChange = useCallback((_layout: any, allLayouts: any) => {
    setLayouts((prev) => ({
      lg: (allLayouts.lg as RGLItem[] | undefined) ?? prev.lg,
      md: prev.md,
      sm: prev.sm,
    }));
  }, []);

  function handleReset() {
    setLayouts({ lg: DEFAULT_LAYOUT_LG, md: DEFAULT_LAYOUT_MD, sm: DEFAULT_LAYOUT_SM });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveHabitsLayout({ lg: layouts.lg });
    } finally {
      setSaving(false);
      setEditMode(false);
    }
  }

  function handleCancel() {
    setLayouts({
      lg: props.habitsLayout?.lg
        ? mergeLayout(props.habitsLayout.lg, DEFAULT_LAYOUT_LG) as RGLItem[]
        : DEFAULT_LAYOUT_LG as RGLItem[],
      md: DEFAULT_LAYOUT_MD as RGLItem[],
      sm: DEFAULT_LAYOUT_SM as RGLItem[],
    });
    setEditMode(false);
  }

  // ─── render ─────────────────────────────────────────────────────────────────

  // Pre-mount skeleton avoids WidthProvider SSR mismatch
  const gridContent = !mounted ? (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      <div className="h-96 rounded-r5 border border-border bg-bg-surface" />
      <div className="h-96 rounded-r5 border border-border bg-bg-surface" />
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
        {SECTION_IDS.map((id) => (
          <div key={id} className="rgl-drag-handle">
            <div className={`relative h-full group ${editMode ? "overflow-auto" : "overflow-hidden"}`}>
              {renderSection(id, props)}
              {editMode && (
                <div className="absolute inset-0 rounded-r5 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
              )}
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">Habits</h1>
          <p className="text-13 text-text-secondary mt-0.5">These aren&apos;t tasks — they&apos;re practices that define who you&apos;re becoming.</p>
        </div>

        <div className="flex items-center gap-2 mt-1 flex-shrink-0">
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
      </div>

      {gridContent}
    </div>
  );
}
