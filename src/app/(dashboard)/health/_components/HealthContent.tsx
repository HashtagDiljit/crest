"use client";

import { useState, useEffect, useCallback } from "react";
import { WidthProvider, ResponsiveReactGridLayout, type LayoutItem as RGLItem, type ResponsiveLayouts } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import {
  Activity,
  Moon,
  Heart,
  Ruler,
  Sun,
  HeartPulse,
  EyeOff,
  X,
  Plus,
} from "lucide-react";
import { saveHealthLayout } from "../actions";
import { DailyOverviewCard } from "./DailyOverviewCard";
import { RecoveryPanel } from "./RecoveryPanel";
import { SleepPanel } from "./SleepPanel";
import { BodyMetricsPanel } from "./BodyMetricsPanel";
import { CircadianCard } from "./CircadianCard";
import { VitalMetricsPanel } from "./VitalMetricsPanel";
import type {
  SleepLogRow,
  ReadinessRow,
  BodyMeasurementRow,
  MetricRow,
  VitalMetricRow,
} from "../actions";

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

interface ProfileStats {
  height_cm: number | null;
  date_of_birth: string | null;
  gender: string | null;
}

export interface HealthContentProps {
  healthLayout: { lg: LayoutItem[]; hidden: string[] } | null;
  todaySleep: SleepLogRow | null;
  todayReadiness: ReadinessRow | null;
  todayMeasurement: BodyMeasurementRow | null;
  latestHr: MetricRow | null;
  sleepLogs: SleepLogRow[];
  readinessLogs: ReadinessRow[];
  hrvMetrics: MetricRow[];
  hrMetrics: MetricRow[];
  todaySoreness: Array<{ muscle_group: string; severity: string }>;
  measurements: BodyMeasurementRow[];
  profileStats: ProfileStats | null;
  bpMetrics: VitalMetricRow[];
  gripMetrics: MetricRow[];
  tempMetrics: MetricRow[];
  respMetrics: MetricRow[];
  gutMetrics: MetricRow[];
}

// ─── constants ────────────────────────────────────────────────────────────────

const BREAKPOINTS = { lg: 1200, md: 768, sm: 0 };
const COLS = { lg: 12, md: 4, sm: 2 };
const ROW_HEIGHT = 80;
const MARGIN: [number, number] = [16, 16];

const DEFAULT_CARDS = [
  "daily-overview", "recovery", "sleep", "body-metrics", "circadian", "vital-metrics",
];

const CARD_META: Record<string, { label: string; Icon: React.ElementType }> = {
  "daily-overview": { label: "Daily overview", Icon: Activity },
  recovery:         { label: "Recovery",       Icon: HeartPulse },
  sleep:            { label: "Sleep",          Icon: Moon },
  "body-metrics":   { label: "Body metrics",   Icon: Ruler },
  circadian:        { label: "Circadian",      Icon: Sun },
  "vital-metrics":  { label: "Vital metrics",  Icon: Heart },
};

// lg: 12 cols. Daily overview full width, then Recovery/Sleep side-by-side (6/6),
// then Body metrics full width, Circadian full width, then Vital metrics full width.
const DEFAULT_LAYOUT_LG: LayoutItem[] = [
  { i: "daily-overview", x: 0, y: 0,  w: 12, h: 4 },
  { i: "recovery",       x: 0, y: 4,  w: 6,  h: 7 },
  { i: "sleep",          x: 6, y: 4,  w: 6,  h: 7 },
  { i: "body-metrics",   x: 0, y: 11, w: 12, h: 6 },
  { i: "circadian",      x: 0, y: 17, w: 12, h: 6 },
  { i: "vital-metrics",  x: 0, y: 23, w: 12, h: 2 },
];

// md: 4 cols. Stack everything full width.
const DEFAULT_LAYOUT_MD: LayoutItem[] = [
  { i: "daily-overview", x: 0, y: 0,  w: 4, h: 4 },
  { i: "recovery",       x: 0, y: 4,  w: 4, h: 7 },
  { i: "sleep",          x: 0, y: 11, w: 4, h: 7 },
  { i: "body-metrics",   x: 0, y: 18, w: 4, h: 6 },
  { i: "circadian",      x: 0, y: 24, w: 4, h: 6 },
  { i: "vital-metrics",  x: 0, y: 30, w: 4, h: 2 },
];

// sm: 2 cols. Stack everything full width.
const DEFAULT_LAYOUT_SM: LayoutItem[] = [
  { i: "daily-overview", x: 0, y: 0,  w: 2, h: 4 },
  { i: "recovery",       x: 0, y: 4,  w: 2, h: 7 },
  { i: "sleep",          x: 0, y: 11, w: 2, h: 7 },
  { i: "body-metrics",   x: 0, y: 18, w: 2, h: 6 },
  { i: "circadian",      x: 0, y: 24, w: 2, h: 6 },
  { i: "vital-metrics",  x: 0, y: 30, w: 2, h: 2 },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function mergeLayout(saved: LayoutItem[], defaults: LayoutItem[]): LayoutItem[] {
  const map = new Map(saved.map((it) => [it.i, it]));
  return defaults.map((d) => map.get(d.i) ?? d);
}

// ─── render card by ID ────────────────────────────────────────────────────────

function renderCard(id: string, d: HealthContentProps): React.ReactNode {
  switch (id) {
    case "daily-overview":
      return (
        <DailyOverviewCard
          todaySleep={d.todaySleep}
          todayReadiness={d.todayReadiness}
          todayMeasurement={d.todayMeasurement}
          latestHr={d.latestHr}
        />
      );
    case "recovery":
      return (
        <RecoveryPanel
          readinessLogs={d.readinessLogs}
          hrvMetrics={d.hrvMetrics}
          hrMetrics={d.hrMetrics}
          todaySoreness={d.todaySoreness}
        />
      );
    case "sleep":
      return <SleepPanel sleepLogs={d.sleepLogs} />;
    case "body-metrics":
      return <BodyMetricsPanel measurements={d.measurements} profile={d.profileStats} />;
    case "circadian":
      return <CircadianCard sleepLogs={d.sleepLogs} />;
    case "vital-metrics":
      return (
        <VitalMetricsPanel
          bpMetrics={d.bpMetrics}
          gripMetrics={d.gripMetrics}
          tempMetrics={d.tempMetrics}
          respMetrics={d.respMetrics}
          gutMetrics={d.gutMetrics}
        />
      );
    default:
      return null;
  }
}

// ─── main export ──────────────────────────────────────────────────────────────

export function HealthContent(props: HealthContentProps) {
  const [mounted, setMounted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [layouts, setLayouts] = useState<{ lg: RGLItem[]; md: RGLItem[]; sm: RGLItem[] }>({
    lg: props.healthLayout?.lg
      ? mergeLayout(props.healthLayout.lg, DEFAULT_LAYOUT_LG) as RGLItem[]
      : DEFAULT_LAYOUT_LG as RGLItem[],
    md: DEFAULT_LAYOUT_MD as RGLItem[],
    sm: DEFAULT_LAYOUT_SM as RGLItem[],
  });
  const [hiddenCards, setHiddenCards] = useState<string[]>(props.healthLayout?.hidden ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => setMounted(true), []);

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
      await saveHealthLayout({ lg: layouts.lg, hidden: hiddenCards });
    } finally {
      setSaving(false);
      setEditMode(false);
    }
  }

  function handleCancel() {
    setLayouts({
      lg: props.healthLayout?.lg
        ? mergeLayout(props.healthLayout.lg, DEFAULT_LAYOUT_LG) as RGLItem[]
        : DEFAULT_LAYOUT_LG as RGLItem[],
      md: DEFAULT_LAYOUT_MD as RGLItem[],
      sm: DEFAULT_LAYOUT_SM as RGLItem[],
    });
    setHiddenCards(props.healthLayout?.hidden ?? []);
    setEditMode(false);
  }

  const visibleIds = DEFAULT_CARDS.filter((id) => !hiddenCards.includes(id));
  const hiddenIds = DEFAULT_CARDS.filter((id) => hiddenCards.includes(id));

  // ─── render ─────────────────────────────────────────────────────────────────

  // Pre-mount skeleton avoids WidthProvider SSR mismatch
  const gridContent = !mounted ? (
    <div className="flex flex-col gap-6">
      {visibleIds.map((id) => (
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
        {visibleIds.map((id) => (
          <div key={id} className="rgl-drag-handle">
            <div className="relative h-full group">
              <div className={`h-full ${editMode ? "overflow-auto" : "overflow-hidden"}`}>{renderCard(id, props)}</div>
              {editMode && (
                <div className="absolute inset-0 rounded-r5 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
              )}
              {editMode && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); hideCard(id); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-pill bg-bg-elevated/90 border border-border flex items-center justify-center text-text-muted hover:text-danger hover:border-danger transition-colors z-10"
                  aria-label={`Hide ${CARD_META[id]?.label ?? id}`}
                >
                  <EyeOff size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* Hidden cards panel */}
      {editMode && hiddenIds.length > 0 && (
        <div className="mt-6 p-4 rounded-r4 border border-dashed border-border bg-bg-surface">
          <p className="text-11 font-semibold uppercase tracking-widest text-text-muted mb-3">Hidden widgets — click to restore</p>
          <div className="flex flex-wrap gap-2">
            {hiddenIds.map((id) => {
              const meta = CARD_META[id];
              if (!meta) return null;
              const { Icon } = meta;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => showCard(id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-r3 border border-border bg-bg-elevated hover:bg-bg-overlay text-13 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Plus size={12} />
                  <Icon size={13} />
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">Health</h1>
          <p className="text-13 text-text-secondary mt-0.5">
            {editMode ? "Drag to reorder, resize, or hide widgets." : "Sleep, recovery, and body composition all in one place."}
          </p>
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
