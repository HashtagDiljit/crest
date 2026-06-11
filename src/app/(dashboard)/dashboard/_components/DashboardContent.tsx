"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WidthProvider, ResponsiveReactGridLayout, type LayoutItem as RGLItem, type ResponsiveLayouts } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import {
  Flame,
  Moon,
  Heart,
  Dumbbell,
  BarChart2,
  Sparkles,
  Activity,
  EyeOff,
  X,
  Droplets,
  Utensils,
  Target,
  TrendingUp,
  BookOpen,
  Weight,
  Plus,
} from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { FocusBanner } from "@/components/FocusBanner";
import { saveDashboardLayout } from "../actions";

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

export interface DashboardData {
  username: string;
  streak: number;
  setupPct: number;
  dashboardLayout: { lg: LayoutItem[]; hidden: string[] } | null;
  workoutCount: number;
  workoutTarget: number;
  habitTotal: number;
  habitLogs: number;
  habitsTodayDone?: number;
  sleepNights7hrs: number;
  moodDaysThisWeek: number;
  lastSleepDuration: number | null;
  lastSleepQuality: number | null;
  sleepSparkline: number[];
  restingHR: number | null;
  hrv: number | null;
  workoutDates: string[];
  aiInsight: { title: string; body: string; category: string } | null;
  lastWeekDigest: { workouts: number; sleepAvg: number | null; habitPct: number | null; moodAvg: number | null };
  lastSession: { date: string; templateName: string | null } | null;
  weeklyVolume: number[];
  currentFocus?: string | null;
  focusStartDate?: string | null;
  focusEndDate?: string | null;
  waterToday?: number;
  proteinToday?: number;
  proteinTarget?: number;
  weightTrend?: number[];
  journalDays30?: number;
  activeGoalCount?: number;
  nextWorkoutName?: string | null;
}

// ─── constants ────────────────────────────────────────────────────────────────

const BREAKPOINTS = { lg: 1200, md: 768, sm: 0 };
const COLS = { lg: 12, md: 4, sm: 2 };
const ROW_HEIGHT = 80;
const MARGIN: [number, number] = [16, 16];

const DEFAULT_CARDS = [
  "weekly-ring", "streak", "sleep", "resting-hr", "workouts",
  "heatmap", "ai-insight", "hrv", "water-today", "nutrition-summary",
  "next-workout", "focus-widget", "weight-trend", "goals-progress",
  "journal-streak", "weekly-volume",
];

const CARD_META: Record<string, { label: string; Icon: React.ElementType }> = {
  "weekly-ring":       { label: "Weekly progress",   Icon: Activity   },
  streak:              { label: "Streak",             Icon: Flame      },
  sleep:               { label: "Sleep",              Icon: Moon       },
  "resting-hr":        { label: "Resting HR",         Icon: Heart      },
  workouts:            { label: "Workouts",           Icon: Dumbbell   },
  heatmap:             { label: "Activity heatmap",   Icon: BarChart2  },
  "ai-insight":        { label: "AI insight",         Icon: Sparkles   },
  hrv:                 { label: "HRV",                Icon: Activity   },
  "water-today":       { label: "Water intake",       Icon: Droplets   },
  "nutrition-summary": { label: "Nutrition summary",  Icon: Utensils   },
  "next-workout":      { label: "Next workout",       Icon: Dumbbell   },
  "focus-widget":      { label: "90-day focus",       Icon: Target     },
  "weight-trend":      { label: "Body weight trend",  Icon: Weight     },
  "goals-progress":    { label: "Goals progress",     Icon: Target     },
  "journal-streak":    { label: "Journal streak",     Icon: BookOpen   },
  "weekly-volume":     { label: "Training volume",    Icon: TrendingUp },
};

const DEFAULT_LAYOUT_LG: LayoutItem[] = [
  { i: "weekly-ring",       x: 0,  y: 0,  w: 6,  h: 3 },
  { i: "streak",            x: 6,  y: 0,  w: 3,  h: 2 },
  { i: "sleep",             x: 9,  y: 0,  w: 3,  h: 2 },
  { i: "resting-hr",        x: 6,  y: 2,  w: 3,  h: 2 },
  { i: "workouts",          x: 9,  y: 2,  w: 3,  h: 2 },
  { i: "heatmap",           x: 0,  y: 4,  w: 12, h: 3 },
  { i: "ai-insight",        x: 0,  y: 7,  w: 8,  h: 2 },
  { i: "hrv",               x: 8,  y: 7,  w: 4,  h: 2 },
  { i: "water-today",       x: 0,  y: 9,  w: 3,  h: 2 },
  { i: "nutrition-summary", x: 3,  y: 9,  w: 4,  h: 2 },
  { i: "next-workout",      x: 7,  y: 9,  w: 5,  h: 2 },
  { i: "focus-widget",      x: 0,  y: 11, w: 6,  h: 3 },
  { i: "weight-trend",      x: 6,  y: 11, w: 3,  h: 2 },
  { i: "goals-progress",    x: 9,  y: 11, w: 3,  h: 3 },
  { i: "journal-streak",    x: 0,  y: 14, w: 4,  h: 2 },
  { i: "weekly-volume",     x: 4,  y: 14, w: 4,  h: 2 },
];

const DEFAULT_LAYOUT_MD: LayoutItem[] = [
  { i: "weekly-ring",       x: 0, y: 0,  w: 4, h: 3 },
  { i: "streak",            x: 0, y: 3,  w: 2, h: 2 },
  { i: "sleep",             x: 2, y: 3,  w: 2, h: 2 },
  { i: "resting-hr",        x: 0, y: 5,  w: 2, h: 2 },
  { i: "workouts",          x: 2, y: 5,  w: 2, h: 2 },
  { i: "heatmap",           x: 0, y: 7,  w: 4, h: 3 },
  { i: "ai-insight",        x: 0, y: 10, w: 4, h: 2 },
  { i: "hrv",               x: 0, y: 12, w: 2, h: 2 },
  { i: "water-today",       x: 2, y: 12, w: 2, h: 2 },
  { i: "nutrition-summary", x: 0, y: 14, w: 2, h: 2 },
  { i: "next-workout",      x: 2, y: 14, w: 2, h: 2 },
  { i: "focus-widget",      x: 0, y: 16, w: 4, h: 3 },
  { i: "weight-trend",      x: 0, y: 19, w: 2, h: 2 },
  { i: "goals-progress",    x: 2, y: 19, w: 2, h: 3 },
  { i: "journal-streak",    x: 0, y: 22, w: 4, h: 2 },
  { i: "weekly-volume",     x: 0, y: 24, w: 4, h: 2 },
];

const DEFAULT_LAYOUT_SM: LayoutItem[] = DEFAULT_CARDS.map((id, i) => ({
  i: id, x: 0, y: i * 2, w: 2, h: 2,
}));

// ─── base card ────────────────────────────────────────────────────────────────

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative h-full rounded-r5 border border-border bg-bg-surface overflow-hidden ${className}`}
      style={{
        boxShadow: "var(--card-inner-glow, inset 0 1px 0 rgba(255,255,255,0.06))",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
        style={{ background: "color-mix(in oklab, var(--color-accent) 60%, transparent)" }}
        aria-hidden
      />
      {children}
    </div>
  );
}

// ─── icon badge ──────────────────────────────────────────────────────────────

function IconBadge({ icon: Icon, color, size = 14 }: { icon: React.ElementType; color: string; size?: number }) {
  return (
    <span
      className="w-8 h-8 rounded-pill flex items-center justify-center flex-shrink-0"
      style={{ background: `color-mix(in oklab, ${color} 15%, transparent)` }}
    >
      <Icon size={size} style={{ color }} />
    </span>
  );
}

// ─── sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ data, color = "var(--color-accent)" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 80;
  const H = 28;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 2) - 1;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── weekly ring card ─────────────────────────────────────────────────────────

function WeeklyRingCard({ d }: { d: DashboardData }) {
  const workoutPct = Math.min((d.workoutCount / d.workoutTarget) * 100, 100);
  const habitPct =
    d.habitTotal > 0
      ? Math.min((d.habitLogs / (d.habitTotal * 7)) * 100, 100)
      : 0;
  const sleepPct = Math.min((d.sleepNights7hrs / 7) * 100, 100);
  const moodPct = Math.min((d.moodDaysThisWeek / 7) * 100, 100);

  const rings = [
    { label: "Workouts",   pct: workoutPct, color: "var(--color-accent)",   val: `${d.workoutCount}/${d.workoutTarget}`, r: 50 },
    { label: "Habits",     pct: habitPct,   color: "var(--color-success)",  val: `${d.habitLogs}/${d.habitTotal * 7}`,   r: 39 },
    { label: "Sleep ≥ 7hr",pct: sleepPct,   color: "var(--color-warning)",  val: `${d.sleepNights7hrs}/7`,               r: 28 },
    { label: "Mood ≥ 3",   pct: moodPct,    color: "var(--color-info)",     val: `${d.moodDaysThisWeek}/7`,              r: 17 },
  ];

  return (
    <Card className="p-4 md:p-5 flex items-center gap-5">
      <svg width="120" height="120" viewBox="0 0 120 120" className="flex-shrink-0" aria-hidden>
        {rings.map((ring) => {
          const circ = 2 * Math.PI * ring.r;
          const offset = circ - (ring.pct / 100) * circ;
          return (
            <g key={ring.label}>
              <circle cx="60" cy="60" r={ring.r} fill="none" stroke="var(--color-bg-elevated)" strokeWidth="6" />
              {ring.pct > 0 && (
                <circle cx="60" cy="60" r={ring.r} fill="none" stroke={ring.color} strokeWidth="6"
                  strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 60 60)" />
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex flex-col gap-2.5 flex-1 min-w-0">
        {rings.map((ring) => (
          <div key={ring.label} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ring.color }} />
            <span className="text-13 text-text-secondary truncate">{ring.label}</span>
            <span className="ml-auto font-mono text-11 text-text-muted flex-shrink-0">{ring.val}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── streak card ──────────────────────────────────────────────────────────────

function StreakCard({ streak }: { streak: number }) {
  return (
    <Card className="p-4 md:p-5 flex flex-col items-center justify-center gap-2">
      <Flame size={28} style={{ color: streak > 0 ? "var(--color-streak)" : "var(--color-text-disabled)" }} />
      <span className="font-mono text-40 font-semibold leading-none" style={{ color: streak > 0 ? "var(--color-text-primary)" : "var(--color-text-disabled)" }}>
        {streak}
      </span>
      <span className="text-11 text-text-muted">day streak</span>
    </Card>
  );
}

// ─── sleep card ───────────────────────────────────────────────────────────────

function SleepCard({ duration, quality, sparkline }: { duration: number | null; quality: number | null; sparkline: number[] }) {
  const qualityLabel = quality === null ? null : quality >= 4 ? "Great" : quality >= 3 ? "Good" : quality >= 2 ? "Fair" : "Poor";
  return (
    <Card className="p-4 md:p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">Sleep</span>
        <IconBadge icon={Moon} color="#38BDF8" />
      </div>
      <div className="flex items-end justify-between">
        <div className="flex items-end gap-1.5">
          {duration !== null ? (
            <>
              <span className="font-mono text-28 md:text-32 font-medium text-text-primary leading-none">{duration.toFixed(1)}</span>
              <span className="text-13 text-text-muted mb-0.5">hrs</span>
            </>
          ) : (
            <div className="shimmer w-16 h-8 rounded-r2" aria-hidden />
          )}
        </div>
        {sparkline.length >= 2 && <Sparkline data={sparkline} color="var(--color-warning)" />}
      </div>
      {qualityLabel ? (
        <span className="text-11 text-text-muted">{qualityLabel} quality</span>
      ) : (
        <div className="h-1.5 rounded-pill bg-bg-elevated" />
      )}
    </Card>
  );
}

// ─── stat card ────────────────────────────────────────────────────────────────

const STAT_TOOLTIPS: Record<string, string> = {
  HRV: "Heart Rate Variability — higher values generally indicate better recovery. Track your trend over time, not the absolute number.",
  "Resting HR": "Resting heart rate. Lower typically indicates better cardiovascular fitness (normal range: 60–100 bpm).",
};

function StatCard({ label, value, unit, Icon }: { label: string; value: number | null; unit: string; Icon: React.ElementType }) {
  return (
    <Card className="p-4 md:p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted flex items-center gap-1">
          {label}
          {STAT_TOOLTIPS[label] && <InfoTooltip text={STAT_TOOLTIPS[label]} size={10} />}
        </span>
        <IconBadge icon={Icon} color="var(--color-danger)" />
      </div>
      <div className="flex items-end gap-1.5">
        {value !== null ? (
          <>
            <span className="font-mono text-28 md:text-32 font-medium text-text-primary leading-none">{Math.round(value)}</span>
            <span className="text-13 text-text-muted mb-0.5">{unit}</span>
          </>
        ) : (
          <>
            <div className="shimmer w-12 h-8 rounded-r2" aria-hidden />
            <span className="text-13 text-text-muted mb-0.5">{unit}</span>
          </>
        )}
      </div>
      <div className="h-1.5 rounded-pill bg-bg-elevated" />
    </Card>
  );
}

// ─── workouts card ────────────────────────────────────────────────────────────

function WorkoutsCard({ count, target, lastSession, weeklyVolume }: { count: number; target: number; lastSession: DashboardData["lastSession"]; weeklyVolume: number[] }) {
  const pct = Math.min((count / target) * 100, 100);
  const hasVolume = weeklyVolume.some((v) => v > 0);
  return (
    <Card className="p-4 md:p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">Workouts</span>
        <IconBadge icon={Dumbbell} color="#2DD4BF" />
      </div>
      <div className="flex items-end justify-between">
        <div className="flex items-end gap-1.5">
          <span className="font-mono text-28 md:text-32 font-medium leading-none" style={{ color: count > 0 ? "var(--color-text-primary)" : "var(--color-text-disabled)" }}>
            {count}
          </span>
          <span className="text-13 text-text-muted mb-0.5">/ {target} wk</span>
        </div>
        {hasVolume && <Sparkline data={weeklyVolume} color="var(--color-accent)" />}
      </div>
      <div className="flex flex-col gap-1">
        <div className="h-1.5 rounded-pill bg-bg-elevated overflow-hidden">
          <div className="h-full rounded-pill bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
        {lastSession && (
          <span className="text-10 text-text-disabled truncate">
            Last: {lastSession.templateName ?? "Ad-hoc"} · {new Date(lastSession.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
    </Card>
  );
}

// ─── heatmap card ─────────────────────────────────────────────────────────────

const HEATMAP_WEEKS = 26;
const HEATMAP_GAP = 4;
const MIN_SQUARE = 8;
const MAX_SQUARE = 20;

function HeatmapCard({ workoutDates }: { workoutDates: string[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [squareSize, setSquareSize] = useState(MAX_SQUARE);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const recalc = (width: number) => {
      const raw = (width - HEATMAP_GAP * (HEATMAP_WEEKS - 1)) / HEATMAP_WEEKS;
      setSquareSize(Math.max(MIN_SQUARE, Math.min(MAX_SQUARE, Math.floor(raw))));
    };

    recalc(el.clientWidth);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        recalc(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysToMonday);
  thisMonday.setHours(0, 0, 0, 0);
  const startDate = new Date(thisMonday);
  startDate.setDate(thisMonday.getDate() - (HEATMAP_WEEKS - 1) * 7);

  const countMap = new Map<string, number>();
  for (const d of workoutDates) countMap.set(d, (countMap.get(d) ?? 0) + 1);

  const weeks: Array<Array<{ date: string; count: number }>> = [];
  const cursor = new Date(startDate);
  for (let w = 0; w < HEATMAP_WEEKS; w++) {
    const week: Array<{ date: string; count: number }> = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = cursor.toISOString().split("T")[0];
      week.push({ date: dateStr, count: countMap.get(dateStr) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  const todayStr = today.toISOString().split("T")[0];

  return (
    <Card className="p-4 md:p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">Activity · 6 months</span>
        <BarChart2 size={14} className="text-text-muted" />
      </div>
      <div ref={containerRef} className="flex-1 min-h-0 overflow-x-auto">
        <div
          className="grid h-full"
          style={{
            gridTemplateColumns: `repeat(${HEATMAP_WEEKS}, ${squareSize}px)`,
            gridTemplateRows: `repeat(7, ${squareSize}px)`,
            gridAutoFlow: "column",
            gap: HEATMAP_GAP,
          }}
        >
          {weeks.map((week, wi) =>
            week.map((day) => {
              const isFuture = day.date > todayStr;
              return (
                <div
                  key={`${wi}-${day.date}`}
                  className="rounded-r1"
                  style={{
                    width: squareSize,
                    height: squareSize,
                    background: isFuture ? "transparent" : day.count === 0 ? "var(--color-bg-elevated)" : "var(--color-accent)",
                    opacity: isFuture ? 0 : day.count === 1 ? 0.5 : 1,
                  }}
                  title={isFuture ? undefined : `${day.date}: ${day.count} workout${day.count !== 1 ? "s" : ""}`}
                />
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── AI insight card ──────────────────────────────────────────────────────────

function AIInsightCard({ insight }: { insight: { title: string; body: string; category: string } | null }) {
  return (
    <Card className="p-4 md:p-5 flex items-start gap-4">
      <div className="w-8 h-8 rounded-r3 bg-accent/15 flex items-center justify-center flex-shrink-0">
        <Sparkles size={15} className="text-accent" />
      </div>
      {insight ? (
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-11 font-semibold uppercase tracking-widest text-accent">{insight.category}</span>
          <p className="text-13 font-semibold text-text-primary">{insight.title}</p>
          <p className="text-13 text-text-secondary line-clamp-3">{insight.body}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className="text-13 font-semibold text-text-secondary">AI insights will appear here</span>
          <p className="text-13 text-text-muted">Log workouts, sleep, mood, and habits for a week — your first insight will surface automatically.</p>
        </div>
      )}
    </Card>
  );
}

// ─── water today card ────────────────────────────────────────────────────────

const WATER_TARGET_ML = 3000;

function WaterTodayCard({ ml }: { ml: number }) {
  const pct = Math.min(100, (ml / WATER_TARGET_ML) * 100);
  const glasses = Math.round(ml / 250);
  return (
    <Card className="p-4 md:p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">Water</span>
        <Droplets size={14} className="text-[var(--color-info)]" />
      </div>
      <div className="flex items-end justify-between">
        <div className="flex items-end gap-1.5">
          <span className="font-mono text-28 font-medium leading-none" style={{ color: pct >= 100 ? "var(--color-success)" : "var(--color-info)" }}>
            {ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`}
          </span>
        </div>
        <div className="text-right">
          <p className="text-11 text-text-muted">{WATER_TARGET_ML / 1000}L target</p>
          <p className="text-11 text-text-muted">{glasses} glasses</p>
        </div>
      </div>
      <div className="h-1.5 rounded-pill bg-bg-elevated overflow-hidden">
        <div className="h-full rounded-pill bg-[var(--color-info)] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </Card>
  );
}

// ─── nutrition summary card ───────────────────────────────────────────────────

function NutritionSummaryCard({ protein, target }: { protein: number; target: number }) {
  const pct = Math.min(100, (protein / target) * 100);
  return (
    <Card className="p-4 md:p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">Protein today</span>
        <IconBadge icon={Utensils} color="var(--color-success)" />
      </div>
      <div className="flex items-end gap-1.5">
        <span className="font-mono text-28 md:text-32 font-medium leading-none" style={{ color: pct >= 100 ? "var(--color-success)" : "var(--color-text-primary)" }}>
          {protein}
        </span>
        <span className="text-13 text-text-muted mb-0.5">/ {target}g</span>
      </div>
      <div className="h-1.5 rounded-pill bg-bg-elevated overflow-hidden">
        <div className="h-full rounded-pill transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? "var(--color-success)" : "var(--color-accent)" }} />
      </div>
    </Card>
  );
}

// ─── next workout card ────────────────────────────────────────────────────────

function NextWorkoutCard({ name }: { name: string | null | undefined }) {
  return (
    <Card className="p-4 md:p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">Next workout</span>
        <IconBadge icon={Dumbbell} color="#2DD4BF" />
      </div>
      <div className="flex-1 flex items-center">
        {name ? (
          <p className="text-14 font-semibold text-text-primary leading-snug">{name}</p>
        ) : (
          <p className="text-13 text-text-muted">No templates yet</p>
        )}
      </div>
      <a href="/workouts" className="text-12 text-accent hover:text-accent-hover transition-colors">Go to workouts →</a>
    </Card>
  );
}

// ─── focus widget card ────────────────────────────────────────────────────────

function FocusWidgetCard({ focus, startDate, endDate }: { focus?: string | null; startDate?: string | null; endDate?: string | null }) {
  if (!focus || !startDate || !endDate) {
    return (
      <Card className="p-4 md:p-5 flex items-center gap-4">
        <div className="w-8 h-8 rounded-r3 bg-bg-elevated flex items-center justify-center flex-shrink-0">
          <IconBadge icon={Target} color="var(--color-accent)" />
        </div>
        <div>
          <p className="text-13 font-semibold text-text-secondary">No 90-day focus set</p>
          <a href="/goals" className="text-12 text-accent hover:text-accent-hover transition-colors">Set your focus →</a>
        </div>
      </Card>
    );
  }
  const dayElapsed = Math.max(0, Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000));
  const dayLeft = Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));
  const pct = Math.min(100, Math.round((dayElapsed / 90) * 100));
  return (
    <Card className="p-4 md:p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Target size={13} className="text-accent flex-shrink-0" />
        <span className="text-11 font-semibold uppercase tracking-widest text-accent">90-day focus · day {dayElapsed}</span>
      </div>
      <p className="text-14 font-semibold text-text-primary leading-snug flex-1">{focus}</p>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-11 text-text-muted">
          <span>{pct}% complete</span>
          <span>{dayLeft} days left</span>
        </div>
        <div className="h-1.5 rounded-pill bg-bg-elevated overflow-hidden">
          <div className="h-full rounded-pill bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Card>
  );
}

// ─── weight trend card ────────────────────────────────────────────────────────

function WeightTrendCard({ trend }: { trend: number[] }) {
  const latest = trend[trend.length - 1] ?? null;
  const prev = trend[trend.length - 2] ?? null;
  const delta = latest !== null && prev !== null ? Math.round((latest - prev) * 10) / 10 : null;
  return (
    <Card className="p-4 md:p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">Body weight</span>
        <IconBadge icon={Weight} color="var(--color-text-secondary)" />
      </div>
      <div className="flex items-end justify-between">
        <div className="flex items-end gap-1.5">
          {latest !== null ? (
            <>
              <span className="font-mono text-28 md:text-32 font-medium leading-none text-text-primary">{latest.toFixed(1)}</span>
              <span className="text-13 text-text-muted mb-0.5">kg</span>
            </>
          ) : (
            <span className="text-13 text-text-muted">No data</span>
          )}
        </div>
        {trend.length >= 2 && <Sparkline data={trend} color={delta !== null && delta > 0 ? "var(--color-warning)" : "var(--color-success)"} />}
      </div>
      {delta !== null && (
        <p className="text-11 text-text-muted">{delta > 0 ? `+${delta}` : delta}kg vs last weigh-in</p>
      )}
    </Card>
  );
}

// ─── goals progress card ──────────────────────────────────────────────────────

function GoalsProgressCard({ count }: { count: number }) {
  return (
    <Card className="p-4 md:p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">Active goals</span>
        <IconBadge icon={Target} color="var(--color-accent)" />
      </div>
      <div className="flex items-end gap-1.5">
        <span className="font-mono text-40 font-medium leading-none text-text-primary">{count}</span>
        <span className="text-13 text-text-muted mb-1">goal{count !== 1 ? "s" : ""}</span>
      </div>
      <a href="/goals" className="text-12 text-accent hover:text-accent-hover transition-colors">View goals →</a>
    </Card>
  );
}

// ─── journal streak card ──────────────────────────────────────────────────────

function JournalStreakCard({ days30 }: { days30: number }) {
  const pct = Math.round((days30 / 30) * 100);
  return (
    <Card className="p-4 md:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">Journal (30 days)</span>
        <IconBadge icon={BookOpen} color="var(--color-warning)" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-28 md:text-32 font-medium text-text-primary leading-none">{days30}</span>
        <span className="text-13 text-text-muted">/ 30 days</span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="h-1.5 rounded-pill bg-bg-elevated overflow-hidden">
          <div className="h-full rounded-pill bg-[#A39CFF] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-11 text-text-muted">{pct}% consistency this month</p>
      </div>
    </Card>
  );
}

// ─── weekly volume card ───────────────────────────────────────────────────────

function WeeklyVolumeCard({ weeklyVolume }: { weeklyVolume: number[] }) {
  const thisWeek = weeklyVolume[3] ?? 0;
  const lastWeek = weeklyVolume[2] ?? 0;
  const delta = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null;
  const fmt = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);
  return (
    <Card className="p-4 md:p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">Volume this week</span>
        <IconBadge icon={TrendingUp} color="var(--color-accent)" />
      </div>
      <div className="flex items-end justify-between">
        <div className="flex items-end gap-1.5">
          <span className="font-mono text-28 font-medium leading-none text-text-primary">{fmt(thisWeek)}</span>
          <span className="text-13 text-text-muted mb-0.5">kg</span>
        </div>
        {weeklyVolume.some((v) => v > 0) && <Sparkline data={weeklyVolume} color="var(--color-accent)" />}
      </div>
      {delta !== null ? (
        <p className="text-11 text-text-muted">{delta >= 0 ? "+" : ""}{delta}% vs last week</p>
      ) : <p className="text-11 text-text-muted">4-week training load</p>}
    </Card>
  );
}

// ─── setup card ───────────────────────────────────────────────────────────────

function SetupCard({ pct }: { pct: number }) {
  const steps = [
    { label: "Stats saved",               href: "/settings#account" },
    { label: "Goals added",               href: "/goals" },
    { label: "Habits created",            href: "/habits" },
    { label: "Workout split configured",  href: "/settings#training" },
  ];
  const done = Math.floor((pct / 100) * steps.length);
  return (
    <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-3" style={{ borderLeftColor: "var(--color-accent)", borderLeftWidth: 3 }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-13 font-semibold text-text-primary">Your setup is {pct}% complete</p>
          <p className="text-12 text-text-muted mt-0.5">Finish setting up Arc to unlock all features.</p>
        </div>
        <span className="font-mono text-22 font-bold" style={{ color: pct >= 75 ? "var(--color-success)" : "var(--color-accent)" }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-pill bg-bg-elevated overflow-hidden">
        <div className="h-full rounded-pill bg-accent transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {steps.map((s, i) => (
          <a key={s.label} href={s.href} className={`flex items-center gap-1.5 text-11 transition-colors ${i < done ? "text-success" : "text-text-muted hover:text-text-secondary"}`}>
            <span className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center ${i < done ? "bg-success border-success" : "border-border"}`}>
              {i < done && <span className="text-[8px] text-white font-bold">✓</span>}
            </span>
            {s.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function WeeklyDigestCard({ digest, onDismiss }: { digest: DashboardData["lastWeekDigest"]; onDismiss: () => void }) {
  const items: Array<{ label: string; value: string | null }> = [
    { label: "Workouts",          value: `${digest.workouts} sessions` },
    { label: "Sleep avg",         value: digest.sleepAvg !== null ? `${digest.sleepAvg}h` : null },
    { label: "Habit completion",  value: digest.habitPct !== null ? `${digest.habitPct}%` : null },
    { label: "Avg mood",          value: digest.moodAvg !== null ? `${digest.moodAvg}/5` : null },
  ].filter((i) => i.value !== null);

  const focusSuggestion = digest.habitPct !== null && digest.habitPct < 50
    ? "Your habit completion was below 50% — pick one habit and protect it this week."
    : digest.sleepAvg !== null && digest.sleepAvg < 6.5
    ? "Sleep was under 6.5h last week. Prioritise an earlier bedtime tonight."
    : digest.workouts === 0
    ? "No workouts logged last week. Even one session this week builds momentum."
    : digest.moodAvg !== null && digest.moodAvg < 3
    ? "Low mood week — be intentional about recovery and connection this week."
    : null;

  return (
    <div className="rounded-r5 border border-border bg-bg-surface flex overflow-hidden">
      <div className="w-1 flex-shrink-0" style={{ background: "#2DD4BF" }} />
      <div className="flex-1 p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-11 font-semibold uppercase tracking-widest" style={{ color: "#2DD4BF" }}>Last week</p>
            <h3 className="font-display text-15 font-semibold text-text-primary mt-0.5">Weekly recap</h3>
          </div>
          <button onClick={onDismiss} className="w-7 h-7 flex items-center justify-center rounded-pill hover:bg-bg-elevated text-text-disabled hover:text-text-muted transition-colors flex-shrink-0" aria-label="Dismiss">
            <X size={13} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {items.map((item) => (
            <div key={item.label} className="rounded-r3 bg-bg-elevated border border-border px-3 py-2">
              <p className="font-mono text-15 font-semibold text-text-primary">{item.value}</p>
              <p className="text-10 text-text-muted mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
        {focusSuggestion && (
          <p className="text-12 text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary">This week: </span>{focusSuggestion}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── render card by ID ────────────────────────────────────────────────────────

function renderCard(id: string, d: DashboardData): React.ReactNode {
  switch (id) {
    case "weekly-ring":      return <WeeklyRingCard d={d} />;
    case "streak":           return <StreakCard streak={d.streak} />;
    case "sleep":            return <SleepCard duration={d.lastSleepDuration} quality={d.lastSleepQuality} sparkline={d.sleepSparkline} />;
    case "resting-hr":       return <StatCard label="Resting HR" value={d.restingHR} unit="bpm" Icon={Heart} />;
    case "workouts":         return <WorkoutsCard count={d.workoutCount} target={d.workoutTarget} lastSession={d.lastSession} weeklyVolume={d.weeklyVolume} />;
    case "heatmap":          return <HeatmapCard workoutDates={d.workoutDates} />;
    case "ai-insight":       return <AIInsightCard insight={d.aiInsight} />;
    case "hrv":              return <StatCard label="HRV" value={d.hrv} unit="ms" Icon={Activity} />;
    case "water-today":      return <WaterTodayCard ml={d.waterToday ?? 0} />;
    case "nutrition-summary":return <NutritionSummaryCard protein={d.proteinToday ?? 0} target={d.proteinTarget ?? 150} />;
    case "next-workout":     return <NextWorkoutCard name={d.nextWorkoutName} />;
    case "focus-widget":     return <FocusWidgetCard focus={d.currentFocus} startDate={d.focusStartDate} endDate={d.focusEndDate} />;
    case "weight-trend":     return <WeightTrendCard trend={d.weightTrend ?? []} />;
    case "goals-progress":   return <GoalsProgressCard count={d.activeGoalCount ?? 0} />;
    case "journal-streak":   return <JournalStreakCard days30={d.journalDays30 ?? 0} />;
    case "weekly-volume":    return <WeeklyVolumeCard weeklyVolume={d.weeklyVolume} />;
    default:                 return null;
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function getISOWeekNumber(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function mergeLayout(saved: LayoutItem[], defaults: LayoutItem[]): LayoutItem[] {
  const map = new Map(saved.map((it) => [it.i, it]));
  return defaults.map((d) => map.get(d.i) ?? d);
}

// ─── main export ──────────────────────────────────────────────────────────────

export function DashboardContent(props: DashboardData) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [layouts, setLayouts] = useState<{ lg: RGLItem[]; md: RGLItem[]; sm: RGLItem[] }>({
    lg: props.dashboardLayout?.lg
      ? mergeLayout(props.dashboardLayout.lg, DEFAULT_LAYOUT_LG) as RGLItem[]
      : DEFAULT_LAYOUT_LG as RGLItem[],
    md: DEFAULT_LAYOUT_MD as RGLItem[],
    sm: DEFAULT_LAYOUT_SM as RGLItem[],
  });
  const [hiddenCards, setHiddenCards] = useState<string[]>(props.dashboardLayout?.hidden ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => setMounted(true), []);

  // Real-time refresh on habit/workout changes
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "habit_logs" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "workout_sessions" }, () => router.refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [router]);

  const [digestDismissed, setDigestDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`weekly-digest-dismissed-${getISOWeekNumber()}`) === "1";
  });

  function dismissDigest() {
    localStorage.setItem(`weekly-digest-dismissed-${getISOWeekNumber()}`, "1");
    setDigestDismissed(true);
  }

  const isMonday = new Date().getDay() === 1;
  const showDigest = isMonday && !digestDismissed &&
    (props.lastWeekDigest.workouts > 0 || props.lastWeekDigest.sleepAvg !== null || props.lastWeekDigest.habitPct !== null);

  // ─── greeting ──────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting =
    hour >= 5 && hour < 12 ? "Good morning"
    : hour < 17           ? "Good afternoon"
    : hour < 21           ? "Good evening"
    :                       "Late night";

  // ─── contextual subtitle (priority order) ──────────────────────────────────
  function getSubtitle(): string {
    if (editMode) return "Drag to reorder, resize, or hide widgets.";
    if (props.workoutCount === 0) return "You haven't trained yet this week.";
    if (props.streak > 0) return `Day ${props.streak} streak. Keep it going.`;
    const todayDone = props.habitsTodayDone ?? 0;
    const remaining = props.habitTotal - todayDone;
    if (props.habitTotal > 0 && remaining > 0) return `You have ${remaining} habit${remaining > 1 ? "s" : ""} left to complete.`;
    if (props.habitTotal > 0 && remaining === 0) return "All habits done today. Strong work.";
    if (props.lastSleepDuration !== null && props.lastSleepDuration < 7)
      return `You got ${props.lastSleepDuration.toFixed(1)}hrs last night. Aim for 7+ tonight.`;
    return "Here's your day at a glance.";
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
      await saveDashboardLayout({ lg: layouts.lg, hidden: hiddenCards });
    } finally {
      setSaving(false);
      setEditMode(false);
    }
  }

  function handleCancel() {
    setLayouts({
      lg: props.dashboardLayout?.lg
        ? mergeLayout(props.dashboardLayout.lg, DEFAULT_LAYOUT_LG) as RGLItem[]
        : DEFAULT_LAYOUT_LG as RGLItem[],
      md: DEFAULT_LAYOUT_MD as RGLItem[],
      sm: DEFAULT_LAYOUT_SM as RGLItem[],
    });
    setHiddenCards(props.dashboardLayout?.hidden ?? []);
    setEditMode(false);
  }

  const visibleIds = DEFAULT_CARDS.filter((id) => !hiddenCards.includes(id));
  const hiddenIds = DEFAULT_CARDS.filter((id) => hiddenCards.includes(id));

  // ─── render ─────────────────────────────────────────────────────────────────

  // Pre-mount skeleton avoids WidthProvider SSR mismatch
  const gridContent = !mounted ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              {renderCard(id, props)}
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
    <div className="flex flex-col gap-4 md:gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">
            {greeting}, {props.username}.
          </h1>
          <p className="text-13 text-text-secondary">{getSubtitle()}</p>
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

      {props.currentFocus && props.focusStartDate && props.focusEndDate && (
        <FocusBanner focus={props.currentFocus} startDate={props.focusStartDate} endDate={props.focusEndDate} />
      )}

      {showDigest && (
        <WeeklyDigestCard digest={props.lastWeekDigest} onDismiss={dismissDigest} />
      )}

      {props.setupPct < 100 && (
        <SetupCard pct={props.setupPct} />
      )}

      {gridContent}
    </div>
  );
}
