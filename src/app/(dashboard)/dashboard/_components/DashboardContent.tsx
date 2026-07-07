"use client";

import { useState, useEffect, useCallback, useMemo, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WidthProvider, ResponsiveReactGridLayout, type LayoutItem as RGLItem, type ResponsiveLayouts } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import {
  Flame, Moon, Heart, Dumbbell, BarChart2, Sparkles, Activity, EyeOff, X,
  Droplets, Utensils, Target, TrendingUp, BookOpen, Weight, Plus, Zap, CheckCircle2,
} from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { FocusBanner } from "@/components/FocusBanner";
import { saveDashboardLayout } from "../actions";
import { ShareableWeekCard } from "./ShareableWeekCard";
import { quickLogWater } from "@/app/(dashboard)/quick-log-actions";
import { trackEvent } from "@/lib/analytics";

// ─── types ────────────────────────────────────────────────────────────────────

export interface LayoutItem {
  i: string; x: number; y: number; w: number; h: number;
  minW?: number; maxW?: number; minH?: number; maxH?: number;
}

const ResponsiveGridLayout = WidthProvider(ResponsiveReactGridLayout);

export interface DashboardData {
  username: string; streak: number; setupPct: number;
  dashboardLayout: { lg: LayoutItem[]; hidden: string[] } | null;
  workoutCount: number; workoutTarget: number;
  habitTotal: number; habitLogs: number; habitsTodayDone?: number;
  sleepNights7hrs: number; moodDaysThisWeek: number;
  lastSleepDuration: number | null; lastSleepQuality: number | null; sleepSparkline: number[];
  restingHR: number | null; hrv: number | null; workoutDates: string[];
  aiInsight: { title: string; body: string; category: string } | null;
  lastWeekDigest: { workouts: number; sleepAvg: number | null; habitPct: number | null; moodAvg: number | null };
  lastSession: { date: string; templateName: string | null } | null;
  weeklyVolume: number[]; currentFocus?: string | null;
  focusStartDate?: string | null; focusEndDate?: string | null;
  waterToday?: number; proteinToday?: number; proteinTarget?: number;
  weightTrend?: number[]; journalDays30?: number; activeGoalCount?: number;
  topGoals?: Array<{ id: string; title: string; progress: number; category: string | null }>;
  nextWorkoutName?: string | null; readinessScore?: number | null;
  readinessLabel?: string | null; readinessColor?: string | null;
  readinessSleepPts?: number; readinessHrvPts?: number;
  readinessRhrPts?: number; readinessTrainingPts?: number;
  momentumScore?: number;
  momentumDomains?: { workout: boolean; sleep: boolean; mood: boolean; nutrition: boolean; habits: boolean };
}

// ─── constants ────────────────────────────────────────────────────────────────

const LAYOUT_VERSION = 3;
const LS_KEY = "kairos-dashboard-layout";
const DEFAULT_HIDDEN = ["journal-streak", "next-workout", "focus-widget"];
const BREAKPOINTS = { lg: 1200, md: 768, sm: 0 };
const COLS = { lg: 12, md: 4, sm: 2 };
const MARGIN: [number, number] = [12, 12];

const DEFAULT_CARDS = [
  "readiness", "weekly-ring", "momentum",
  "sleep", "resting-hr", "hrv",
  "workouts", "streak", "water-today",
  "heatmap", "weight-trend", "nutrition-summary",
  "goals-progress", "weekly-volume", "ai-insight",
  "journal-streak", "next-workout", "focus-widget",
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
  "nutrition-summary": { label: "Nutrition",          Icon: Utensils   },
  "next-workout":      { label: "Next workout",       Icon: Dumbbell   },
  "focus-widget":      { label: "90-day focus",       Icon: Target     },
  "weight-trend":      { label: "Body weight",        Icon: Weight     },
  "goals-progress":    { label: "Goals progress",     Icon: Target     },
  "journal-streak":    { label: "Journal streak",     Icon: BookOpen   },
  "weekly-volume":     { label: "Training volume",    Icon: TrendingUp },
  readiness:           { label: "Daily readiness",    Icon: Activity   },
  momentum:            { label: "Today's momentum",   Icon: Zap        },
};

// Optimised layout: readiness first, then weekly trackers, then vitals, activity, heatmap, context, ai
const DEFAULT_LAYOUT_LG: LayoutItem[] = [
  { i: "readiness",         x: 0,  y: 0,  w: 12, h: 4,  minW: 12, maxW: 12, minH: 3, maxH: 5 },
  { i: "weekly-ring",       x: 0,  y: 4,  w: 6,  h: 4,  minW: 4,  maxW: 12, minH: 3, maxH: 5 },
  { i: "momentum",          x: 6,  y: 4,  w: 6,  h: 4,  minW: 4,  maxW: 12, minH: 3, maxH: 5 },
  { i: "sleep",             x: 0,  y: 8,  w: 4,  h: 2,  minW: 3,  maxW: 6,  minH: 2, maxH: 4 },
  { i: "resting-hr",        x: 4,  y: 8,  w: 4,  h: 2,  minW: 3,  maxW: 6,  minH: 2, maxH: 4 },
  { i: "hrv",               x: 8,  y: 8,  w: 4,  h: 2,  minW: 3,  maxW: 6,  minH: 2, maxH: 4 },
  { i: "workouts",          x: 0,  y: 10, w: 4,  h: 2,  minW: 3,  maxW: 6,  minH: 2, maxH: 4 },
  { i: "streak",            x: 4,  y: 10, w: 4,  h: 2,  minW: 3,  maxW: 4,  minH: 2, maxH: 3 },
  { i: "water-today",       x: 8,  y: 10, w: 4,  h: 2,  minW: 3,  maxW: 6,  minH: 2, maxH: 4 },
  { i: "heatmap",           x: 0,  y: 12, w: 12, h: 3,  minW: 12, maxW: 12, minH: 3, maxH: 4 },
  { i: "weight-trend",      x: 0,  y: 15, w: 6,  h: 2,  minW: 4,  maxW: 12, minH: 2, maxH: 4 },
  { i: "nutrition-summary", x: 6,  y: 15, w: 6,  h: 2,  minW: 4,  maxW: 8,  minH: 2, maxH: 4 },
  { i: "goals-progress",    x: 0,  y: 17, w: 8,  h: 3,  minW: 6,  maxW: 12, minH: 2, maxH: 5 },
  { i: "weekly-volume",     x: 8,  y: 17, w: 4,  h: 2,  minW: 3,  maxW: 6,  minH: 2, maxH: 4 },
  { i: "ai-insight",        x: 0,  y: 20, w: 12, h: 2,  minW: 6,  maxW: 12, minH: 2, maxH: 3 },
  { i: "journal-streak",    x: 0,  y: 22, w: 4,  h: 2,  minW: 3,  maxW: 6,  minH: 2, maxH: 3 },
  { i: "next-workout",      x: 4,  y: 22, w: 4,  h: 2,  minW: 3,  maxW: 12, minH: 2, maxH: 3 },
  { i: "focus-widget",      x: 8,  y: 22, w: 4,  h: 2,  minW: 3,  maxW: 12, minH: 2, maxH: 4 },
];

const DEFAULT_LAYOUT_MD: LayoutItem[] = [
  { i: "readiness",         x: 0, y: 0,  w: 4, h: 4 },
  { i: "weekly-ring",       x: 0, y: 4,  w: 4, h: 4 },
  { i: "momentum",          x: 0, y: 8,  w: 4, h: 4 },
  { i: "sleep",             x: 0, y: 12, w: 2, h: 2 },
  { i: "resting-hr",        x: 2, y: 12, w: 2, h: 2 },
  { i: "hrv",               x: 0, y: 14, w: 2, h: 2 },
  { i: "workouts",          x: 2, y: 14, w: 2, h: 2 },
  { i: "streak",            x: 0, y: 16, w: 2, h: 2 },
  { i: "water-today",       x: 2, y: 16, w: 2, h: 2 },
  { i: "heatmap",           x: 0, y: 18, w: 4, h: 3 },
  { i: "weight-trend",      x: 0, y: 21, w: 4, h: 2 },
  { i: "nutrition-summary", x: 0, y: 23, w: 4, h: 2 },
  { i: "goals-progress",    x: 0, y: 25, w: 4, h: 3 },
  { i: "weekly-volume",     x: 0, y: 28, w: 4, h: 2 },
  { i: "ai-insight",        x: 0, y: 30, w: 4, h: 2 },
  { i: "journal-streak",    x: 0, y: 32, w: 4, h: 2 },
  { i: "next-workout",      x: 0, y: 34, w: 4, h: 2 },
  { i: "focus-widget",      x: 0, y: 36, w: 4, h: 2 },
];

const DEFAULT_LAYOUT_SM: LayoutItem[] = (() => {
  const tall = new Set(["readiness", "weekly-ring", "momentum"]);
  const medium = new Set(["heatmap", "goals-progress"]);
  let y = 0;
  return DEFAULT_CARDS.map((id) => {
    const h = tall.has(id) ? 4 : medium.has(id) ? 3 : 2;
    const item: LayoutItem = { i: id, x: 0, y, w: 2, h };
    y += h;
    return item;
  });
})();

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadFromLS(): { lg: LayoutItem[]; hidden: string[]; v: number } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.v !== LAYOUT_VERSION) return null;
    return parsed;
  } catch { return null; }
}

function saveToLS(payload: { lg: LayoutItem[]; hidden: string[]; v: number }) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(payload)); } catch { /* ignore */ }
}

// ─── size tier ────────────────────────────────────────────────────────────────

function sizeTier(w: number, h: number) {
  const isFull = w > 6 || h >= 4;
  const isSmall = !isFull && (w <= 3 || h <= 2);
  const isMid = !isFull && !isSmall;
  return { isFull, isMid, isSmall };
}

function metricFontSize(w: number, h: number): number {
  const { isFull, isMid } = sizeTier(w, h);
  return isFull ? 48 : isMid ? 36 : 28;
}

// ─── base card ────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative h-full rounded-r5 overflow-hidden ${className}`}
      style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", boxShadow: "var(--card-shadow, none)" }}>
      {children}
    </div>
  );
}

function IconBadge({ icon: Icon, color, size = 14 }: { icon: React.ElementType; color: string; size?: number }) {
  return (
    <span className="w-7 h-7 rounded-pill flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in oklab, ${color} 15%, transparent)` }}>
      <Icon size={size} style={{ color }} />
    </span>
  );
}

function Sparkline({ data, color = "var(--color-accent)" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1); const min = Math.min(...data);
  const range = max - min || 1;
  const W = 72; const H = 24;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 2) - 1;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProgressBar({ pct, color = "var(--color-accent)" }: { pct: number; color?: string }) {
  return (
    <div className="h-[3px] rounded-pill overflow-hidden flex-shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
      <div className="h-full rounded-pill transition-all" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  );
}

// ─── weekly ring card ─────────────────────────────────────────────────────────

function WeeklyRingCard({ d, w, h }: { d: DashboardData; w: number; h: number }) {
  const { isFull, isSmall } = sizeTier(w, h);
  const rings = [
    { label: "Workouts",    pct: Math.min((d.workoutCount / d.workoutTarget) * 100, 100), color: "var(--color-accent)",   val: `${d.workoutCount}/${d.workoutTarget}`, r: 50 },
    { label: "Habits",      pct: d.habitTotal > 0 ? Math.min((d.habitLogs / (d.habitTotal * 7)) * 100, 100) : 0, color: "var(--color-success)", val: `${d.habitLogs}/${d.habitTotal * 7}`, r: 39 },
    { label: "Sleep ≥ 7hr", pct: Math.min((d.sleepNights7hrs / 7) * 100, 100), color: "var(--color-warning)", val: `${d.sleepNights7hrs}/7`, r: 28 },
    { label: "Mood ≥ 3",    pct: Math.min((d.moodDaysThisWeek / 7) * 100, 100), color: "var(--color-info)",    val: `${d.moodDaysThisWeek}/7`, r: 17 },
  ];
  const svgSize = isSmall ? 80 : 100;
  return (
    <Card className="p-4 flex items-center gap-4">
      <svg width={svgSize} height={svgSize} viewBox="0 0 120 120" className="flex-shrink-0" aria-hidden>
        {rings.map((ring) => {
          const circ = 2 * Math.PI * ring.r;
          const offset = circ - (ring.pct / 100) * circ;
          return (
            <g key={ring.label}>
              <circle cx="60" cy="60" r={ring.r} fill="none" stroke="var(--color-bg-elevated)" strokeWidth="6" />
              {ring.pct > 0 && <circle cx="60" cy="60" r={ring.r} fill="none" stroke={ring.color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 60 60)" />}
            </g>
          );
        })}
      </svg>
      {!isSmall && (
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {rings.map((ring) => (
            <div key={ring.label} className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ring.color }} />
              {isFull && <span className="text-12 text-text-secondary truncate overflow-hidden">{ring.label}</span>}
              <span className="ml-auto font-mono text-11 text-text-muted flex-shrink-0">{ring.val}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── streak card ──────────────────────────────────────────────────────────────

function StreakCard({ streak, w, h }: { streak: number; w: number; h: number }) {
  const { isSmall } = sizeTier(w, h);
  const active = streak > 0;
  const flameColor = active ? "var(--color-streak)" : "var(--color-text-disabled)";
  return (
    <Card className="p-4 flex flex-col justify-center items-center gap-1">
      <div className="flex items-center gap-2">
        <Flame size={isSmall ? 20 : 24} style={{ color: flameColor }} />
        <span className="font-mono font-semibold leading-none" style={{ fontSize: metricFontSize(w, h), color: active ? "var(--color-text-primary)" : "var(--color-text-disabled)" }}>{streak}</span>
      </div>
      {!isSmall && <span className="text-12 text-text-muted">day streak</span>}
    </Card>
  );
}

// ─── sleep card ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SleepCard({ duration, quality: _quality, sparkline, w, h }: { duration: number | null; quality: number | null; sparkline: number[]; w: number; h: number }) {
  const { isFull, isSmall } = sizeTier(w, h);
  const sleepPct = duration !== null ? Math.min(100, (duration / 8) * 100) : 0;

  if (duration === null) {
    return (
      <Card className="p-4 flex flex-col justify-between">
        {!isSmall && <div className="flex items-center justify-between"><span className="text-11 font-semibold uppercase tracking-widest text-text-muted truncate">Sleep</span><IconBadge icon={Moon} color="#38BDF8" /></div>}
        <a href="/health" className="flex-1 flex flex-col items-center justify-center gap-1.5 py-1 text-center group">
          <Moon size={isSmall ? 22 : 18} className="text-text-disabled group-hover:text-accent transition-colors" />
          {!isSmall && <span className="text-12 text-text-muted group-hover:text-accent transition-colors truncate overflow-hidden">Tap to log sleep</span>}
        </a>
        {!isSmall && <ProgressBar pct={0} color="#38BDF8" />}
      </Card>
    );
  }

  return (
    <Card className="p-4 flex flex-col justify-between">
      {!isSmall && <div className="flex items-center justify-between"><span className="text-11 font-semibold uppercase tracking-widest text-text-muted truncate">Sleep</span><IconBadge icon={Moon} color="#38BDF8" /></div>}
      <div className="flex items-end justify-between gap-2">
        <div className="flex items-end gap-1">
          <span className="font-mono font-medium text-text-primary leading-none" style={{ fontSize: metricFontSize(w, h) }}>{duration.toFixed(1)}</span>
          {!isSmall && <span className="text-13 text-text-muted mb-0.5">hrs</span>}
        </div>
        {isFull && sparkline.length >= 2 && <Sparkline data={sparkline} color="#38BDF8" />}
      </div>
      {!isSmall && <ProgressBar pct={sleepPct} color="#38BDF8" />}
    </Card>
  );
}

// ─── stat card (resting HR / HRV) ─────────────────────────────────────────────

const STAT_TOOLTIPS: Record<string, string> = {
  HRV: "Heart Rate Variability — higher values generally indicate better recovery.",
  "Resting HR": "Resting heart rate. Lower typically indicates better cardiovascular fitness.",
};

function StatCard({ label, value, unit, Icon, w, h, progressPct = 0, progressColor = "var(--color-accent)" }: {
  label: string; value: number | null; unit: string; Icon: React.ElementType;
  w: number; h: number; progressPct?: number; progressColor?: string;
}) {
  const { isFull, isSmall } = sizeTier(w, h);

  if (value === null) {
    return (
      <Card className="p-4 flex flex-col justify-between">
        {!isSmall && <div className="flex items-center justify-between"><span className="text-11 font-semibold uppercase tracking-widest text-text-muted flex items-center gap-1 truncate">{label}{STAT_TOOLTIPS[label] && <InfoTooltip text={STAT_TOOLTIPS[label]} size={10} />}</span><IconBadge icon={Icon} color="var(--color-danger)" /></div>}
        <a href="/health" className="flex-1 flex flex-col items-center justify-center gap-1.5 py-1 text-center group">
          <Icon size={isSmall ? 22 : 18} className="text-text-disabled group-hover:text-accent transition-colors" />
          {!isSmall && <span className="text-12 text-text-muted group-hover:text-accent transition-colors truncate overflow-hidden">Tap to log</span>}
        </a>
        {!isSmall && <ProgressBar pct={0} color={progressColor} />}
      </Card>
    );
  }

  return (
    <Card className="p-4 flex flex-col justify-between">
      {!isSmall && <div className="flex items-center justify-between"><span className="text-11 font-semibold uppercase tracking-widest text-text-muted flex items-center gap-1 truncate">{label}{STAT_TOOLTIPS[label] && <InfoTooltip text={STAT_TOOLTIPS[label]} size={10} />}</span><IconBadge icon={Icon} color="var(--color-danger)" /></div>}
      <div className="flex items-end gap-1">
        <span className="font-mono font-medium text-text-primary leading-none" style={{ fontSize: metricFontSize(w, h) }}>{Math.round(value)}</span>
        {!isSmall && <span className="text-13 text-text-muted mb-0.5">{unit}</span>}
      </div>
      {!isSmall && <ProgressBar pct={progressPct} color={progressColor} />}
      {isFull && <span className="text-11 text-text-muted">{label}</span>}
    </Card>
  );
}

// ─── workouts card ────────────────────────────────────────────────────────────

function WorkoutsCard({ count, target, lastSession, weeklyVolume, w, h }: { count: number; target: number; lastSession: DashboardData["lastSession"]; weeklyVolume: number[]; w: number; h: number }) {
  const { isFull, isSmall } = sizeTier(w, h);
  const pct = Math.min((count / target) * 100, 100);
  const daysSince = lastSession ? Math.floor((Date.now() - new Date(lastSession.date).getTime()) / 86400000) : null;
  const lastLabel = daysSince === null ? null : daysSince === 0 ? "Last: today" : daysSince === 1 ? "Last: yesterday" : `Last: ${daysSince} days ago`;
  return (
    <Card className="p-4 flex flex-col justify-between">
      {!isSmall && <div className="flex items-center justify-between"><span className="text-11 font-semibold uppercase tracking-widest text-text-muted truncate">Workouts</span><IconBadge icon={Dumbbell} color="#64b4a0" /></div>}
      <div className="flex items-end justify-between gap-2">
        <div className="flex items-end gap-1">
          <span className="font-mono font-medium leading-none" style={{ fontSize: metricFontSize(w, h), color: count > 0 ? "var(--color-text-primary)" : "var(--color-text-disabled)" }}>{count}</span>
          {!isSmall && <span className="text-13 text-text-muted mb-0.5">/ {target} wk</span>}
        </div>
        {isFull && weeklyVolume.some(v => v > 0) && <Sparkline data={weeklyVolume} color="var(--color-accent)" />}
      </div>
      {!isSmall && <ProgressBar pct={pct} color="var(--color-accent)" />}
      {!isSmall && lastLabel && <span className="text-10 text-text-disabled truncate overflow-hidden">{lastLabel}</span>}
    </Card>
  );
}

// ─── heatmap card ─────────────────────────────────────────────────────────────

const HEATMAP_GAP = 4;
const MIN_SQUARE = 6;
const MAX_SQUARE = 18;

function HeatmapCard({ workoutDates, h }: { workoutDates: string[]; w: number; h: number }) {
  const HEATMAP_WEEKS = h >= 4 ? 52 : 26;
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
    const observer = new ResizeObserver(entries => { for (const e of entries) recalc(e.contentRect.width); });
    observer.observe(el);
    return () => observer.disconnect();
  }, [HEATMAP_WEEKS]);

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
  for (let wk = 0; wk < HEATMAP_WEEKS; wk++) {
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
    <Card className="p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">Activity · {HEATMAP_WEEKS === 52 ? "12" : "6"} months</span>
        <BarChart2 size={14} className="text-text-muted" />
      </div>
      <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden">
        <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${HEATMAP_WEEKS}, ${squareSize}px)`, gridTemplateRows: `repeat(7, ${squareSize}px)`, gridAutoFlow: "column", gap: HEATMAP_GAP }}>
          {weeks.map((week, wi) =>
            week.map((day) => {
              const isFuture = day.date > todayStr;
              return (
                <div key={`${wi}-${day.date}`} className="rounded-r1"
                  style={{ width: squareSize, height: squareSize, background: isFuture ? "transparent" : day.count === 0 ? "var(--color-bg-elevated)" : "var(--color-accent)", opacity: isFuture ? 0 : day.count === 1 ? 0.5 : 1 }}
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

function AIInsightCard({ insight, w, h }: { insight: DashboardData["aiInsight"]; w: number; h: number }) {
  const { isFull, isSmall } = sizeTier(w, h);
  return (
    <Card className="p-4 flex items-start gap-3">
      <div className="w-7 h-7 rounded-r3 bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles size={13} className="text-accent" />
      </div>
      {insight ? (
        <div className="flex flex-col gap-1 min-w-0">
          {!isSmall && <span className="text-11 font-semibold uppercase tracking-widest text-accent truncate overflow-hidden">{insight.category}</span>}
          <p className="text-13 font-semibold text-text-primary truncate overflow-hidden">{insight.title}</p>
          {isFull && <p className="text-13 text-text-secondary line-clamp-2">{insight.body}</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-13 font-semibold text-text-secondary truncate overflow-hidden">AI insights will appear here</span>
          {!isSmall && <p className="text-13 text-text-muted line-clamp-2">Log workouts, sleep, mood, and habits for a week.</p>}
        </div>
      )}
    </Card>
  );
}

// ─── water today card ─────────────────────────────────────────────────────────

const WATER_TARGET_ML = 3000;

function WaterTodayCard({ ml, w, h, onAddWater }: { ml: number; w: number; h: number; onAddWater?: () => void }) {
  const { isSmall } = sizeTier(w, h);
  const pct = Math.min(100, (ml / WATER_TARGET_ML) * 100);
  const display = ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;
  return (
    <Card className="p-4 flex flex-col justify-between">
      {!isSmall && <div className="flex items-center justify-between"><span className="text-11 font-semibold uppercase tracking-widest text-text-muted truncate">Water</span><Droplets size={14} className="text-[var(--color-info)]" /></div>}
      <div className="flex items-end gap-1">
        <span className="font-mono font-medium leading-none overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: metricFontSize(w, h), color: pct >= 100 ? "var(--color-success)" : "var(--color-info)" }}>{display}</span>
      </div>
      {!isSmall && <ProgressBar pct={pct} color="var(--color-info)" />}
      {onAddWater && (
        <button type="button" onClick={onAddWater}
          className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-pill text-10 font-semibold transition-colors"
          style={{ background: "rgba(56,189,248,0.15)", color: "var(--color-info)", border: "1px solid rgba(56,189,248,0.3)", zIndex: 2 }}>
          +250ml
        </button>
      )}
    </Card>
  );
}

// ─── nutrition summary card ───────────────────────────────────────────────────

function NutritionSummaryCard({ protein, target, w, h }: { protein: number; target: number; w: number; h: number }) {
  const { isSmall } = sizeTier(w, h);
  const pct = Math.min(100, (protein / target) * 100);
  return (
    <Card className="p-4 flex flex-col justify-between">
      {!isSmall && <div className="flex items-center justify-between"><span className="text-11 font-semibold uppercase tracking-widest text-text-muted truncate">Protein today</span><IconBadge icon={Utensils} color="var(--color-success)" /></div>}
      <div className="flex items-end gap-1">
        <span className="font-mono font-medium leading-none" style={{ fontSize: metricFontSize(w, h), color: pct >= 100 ? "var(--color-success)" : "var(--color-text-primary)" }}>{protein}</span>
        {!isSmall && <span className="text-13 text-text-muted mb-0.5">/ {target}g</span>}
      </div>
      {!isSmall && <ProgressBar pct={pct} color={pct >= 100 ? "var(--color-success)" : "var(--color-accent)"} />}
    </Card>
  );
}

// ─── next workout card ────────────────────────────────────────────────────────

function NextWorkoutCard({ name, w, h }: { name: string | null | undefined; w: number; h: number }) {
  const { isFull, isSmall } = sizeTier(w, h);
  return (
    <Card className="p-4 flex flex-col justify-between">
      {!isSmall && <div className="flex items-center justify-between"><span className="text-11 font-semibold uppercase tracking-widest text-text-muted truncate">Next workout</span><IconBadge icon={Dumbbell} color="#64b4a0" /></div>}
      <div className="flex-1 flex items-center min-w-0">
        {name ? <p className="text-14 font-semibold text-text-primary leading-snug truncate overflow-hidden">{name}</p>
               : <p className="text-13 text-text-muted truncate overflow-hidden">No templates yet</p>}
      </div>
      {isFull && <a href="/workouts" className="text-12 text-accent hover:text-accent-hover transition-colors truncate overflow-hidden">Go to workouts →</a>}
    </Card>
  );
}

// ─── focus widget card ────────────────────────────────────────────────────────

function FocusWidgetCard({ focus, startDate, endDate, w, h }: { focus?: string | null; startDate?: string | null; endDate?: string | null; w: number; h: number }) {
  const { isFull, isSmall } = sizeTier(w, h);
  if (!focus || !startDate || !endDate) {
    return (
      <Card className="p-4 flex items-center gap-3">
        <IconBadge icon={Target} color="var(--color-accent)" />
        <div className="min-w-0">
          <p className="text-13 font-semibold text-text-secondary truncate overflow-hidden">No 90-day focus set</p>
          {!isSmall && <a href="/goals" className="text-12 text-accent hover:text-accent-hover transition-colors">Set focus →</a>}
        </div>
      </Card>
    );
  }
  const dayElapsed = Math.max(0, Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000));
  const dayLeft = Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));
  const pct = Math.min(100, Math.round((dayElapsed / 90) * 100));
  return (
    <Card className="p-4 flex flex-col gap-2">
      {!isSmall && <div className="flex items-center gap-2"><Target size={12} className="text-accent flex-shrink-0" /><span className="text-11 font-semibold uppercase tracking-widest text-accent truncate overflow-hidden">Focus · day {dayElapsed}</span></div>}
      <p className="text-13 font-semibold text-text-primary leading-snug line-clamp-2 flex-1 overflow-hidden">{focus}</p>
      <div className="flex flex-col gap-1">
        {isFull && <div className="flex justify-between text-11 text-text-muted"><span>{pct}% done</span><span>{dayLeft}d left</span></div>}
        <ProgressBar pct={pct} color="var(--color-accent)" />
      </div>
    </Card>
  );
}

// ─── weight trend card ────────────────────────────────────────────────────────

function WeightTrendCard({ trend, w, h }: { trend: number[]; w: number; h: number }) {
  const { isFull, isSmall } = sizeTier(w, h);
  const latest = trend[trend.length - 1] ?? null;
  const prev = trend[trend.length - 2] ?? null;
  const delta = latest !== null && prev !== null ? Math.round((latest - prev) * 10) / 10 : null;
  return (
    <Card className="p-4 flex flex-col justify-between">
      {!isSmall && <div className="flex items-center justify-between"><span className="text-11 font-semibold uppercase tracking-widest text-text-muted truncate">Body weight</span><IconBadge icon={Weight} color="var(--color-text-secondary)" /></div>}
      <div className="flex items-end justify-between gap-2">
        <div className="flex items-end gap-1">
          {latest !== null
            ? <><span className="font-mono font-medium leading-none text-text-primary" style={{ fontSize: metricFontSize(w, h) }}>{latest.toFixed(1)}</span>{!isSmall && <span className="text-13 text-text-muted mb-0.5">kg</span>}</>
            : <span className="text-13 text-text-muted">No data</span>}
        </div>
        {!isSmall && trend.length >= 2 && <Sparkline data={trend} color={delta !== null && delta > 0 ? "var(--color-warning)" : "var(--color-success)"} />}
      </div>
      {isFull && delta !== null && <p className="text-11 text-text-muted">{delta > 0 ? `+${delta}` : delta}kg vs last</p>}
    </Card>
  );
}

// ─── goals progress card ──────────────────────────────────────────────────────

function GoalsProgressCard({ count, goals, w, h }: { count: number; goals?: Array<{ id: string; title: string; progress: number; category: string | null }>; w: number; h: number }) {
  const { isFull, isMid, isSmall } = sizeTier(w, h);
  const showGoals = (isFull || isMid) && goals && goals.length > 0;
  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        {!isSmall && <span className="text-11 font-semibold uppercase tracking-widest text-text-muted truncate">Active goals</span>}
        <IconBadge icon={Target} color="var(--color-accent)" />
      </div>
      {!showGoals && (
        <div className="flex items-end gap-1">
          <span className="font-mono font-medium leading-none text-text-primary" style={{ fontSize: metricFontSize(w, h) }}>{count}</span>
          {!isSmall && <span className="text-13 text-text-muted mb-0.5">goal{count !== 1 ? "s" : ""}</span>}
        </div>
      )}
      {showGoals && (
        <div className="flex flex-col gap-2.5">
          {goals.map(g => {
            const pct = Math.min(100, Math.round(g.progress));
            return (
              <div key={g.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-12 text-text-primary truncate">{g.title}</span>
                  <span className="text-11 text-text-muted flex-shrink-0 ml-2">{pct}%</span>
                </div>
                <ProgressBar pct={pct} color="var(--color-accent)" />
              </div>
            );
          })}
        </div>
      )}
      {isFull && <a href="/goals" className="text-12 text-accent hover:text-accent-hover transition-colors">View all →</a>}
    </Card>
  );
}

// ─── journal streak card ──────────────────────────────────────────────────────

function JournalStreakCard({ days30, w, h }: { days30: number; w: number; h: number }) {
  const { isFull, isSmall } = sizeTier(w, h);
  const pct = Math.round((days30 / 30) * 100);
  return (
    <Card className="p-4 flex flex-col gap-2">
      {!isSmall && <div className="flex items-center justify-between"><span className="text-11 font-semibold uppercase tracking-widest text-text-muted truncate">Journal (30d)</span><IconBadge icon={BookOpen} color="var(--color-warning)" /></div>}
      <div className="flex items-end gap-1">
        <span className="font-mono font-medium text-text-primary leading-none" style={{ fontSize: metricFontSize(w, h) }}>{days30}</span>
        {!isSmall && <span className="text-13 text-text-muted mb-0.5">/ 30 days</span>}
      </div>
      {!isSmall && <ProgressBar pct={pct} color="#A39CFF" />}
      {isFull && <p className="text-11 text-text-muted">{pct}% consistency</p>}
    </Card>
  );
}

// ─── weekly volume card ───────────────────────────────────────────────────────

function WeeklyVolumeCard({ weeklyVolume, w, h }: { weeklyVolume: number[]; w: number; h: number }) {
  const { isFull, isSmall } = sizeTier(w, h);
  const thisWeek = weeklyVolume[3] ?? 0;
  const lastWeek = weeklyVolume[2] ?? 0;
  const delta = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null;
  const fmt = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);
  return (
    <Card className="p-4 flex flex-col justify-between">
      {!isSmall && <div className="flex items-center justify-between"><span className="text-11 font-semibold uppercase tracking-widest text-text-muted truncate">Volume this wk</span><IconBadge icon={TrendingUp} color="var(--color-accent)" /></div>}
      <div className="flex items-end justify-between gap-2">
        <div className="flex items-end gap-1">
          <span className="font-mono font-medium leading-none text-text-primary" style={{ fontSize: metricFontSize(w, h) }}>{fmt(thisWeek)}</span>
          {!isSmall && <span className="text-13 text-text-muted mb-0.5">kg</span>}
        </div>
        {!isSmall && weeklyVolume.some(v => v > 0) && <Sparkline data={weeklyVolume} color="var(--color-accent)" />}
      </div>
      {isFull && (delta !== null ? <p className="text-11 text-text-muted">{delta >= 0 ? "+" : ""}{delta}% vs last week</p> : <p className="text-11 text-text-muted">4-week training load</p>)}
    </Card>
  );
}

// ─── setup card ───────────────────────────────────────────────────────────────

function SetupCard({ pct }: { pct: number }) {
  const steps = [
    { label: "Stats saved", href: "/settings#account" },
    { label: "Goals added", href: "/goals" },
    { label: "Habits created", href: "/habits" },
    { label: "Workout split configured", href: "/settings#training" },
  ];
  const done = Math.floor((pct / 100) * steps.length);
  return (
    <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-3" style={{ borderLeftColor: "var(--color-accent)", borderLeftWidth: 3 }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-13 font-semibold text-text-primary">Your setup is {pct}% complete</p>
          <p className="text-12 text-text-muted mt-0.5">Finish setting up Kairos to unlock all features.</p>
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

// ─── weekly digest card ───────────────────────────────────────────────────────

function WeeklyDigestCard({ digest, onDismiss, username, readinessScore }: { digest: DashboardData["lastWeekDigest"]; onDismiss: () => void; username: string; readinessScore?: number | null }) {
  const items: Array<{ label: string; value: string | null }> = [
    { label: "Workouts",         value: `${digest.workouts}` },
    { label: "Sleep avg",        value: digest.sleepAvg !== null ? `${digest.sleepAvg}h` : null },
    { label: "Habit completion", value: digest.habitPct !== null ? `${digest.habitPct}%` : null },
    { label: "Avg mood",         value: digest.moodAvg !== null ? `${digest.moodAvg}/5` : null },
  ];
  const insight =
    digest.habitPct !== null && digest.habitPct < 50
      ? "Habit completion was below 50% — pick one habit and protect it this week."
      : digest.sleepAvg !== null && digest.sleepAvg < 6.5
      ? `Sleep averaged ${digest.sleepAvg}h — that's under the 7hr minimum. An earlier bedtime tonight would help.`
      : digest.workouts === 0
      ? "No workouts logged last week. Even a single session this week rebuilds the habit."
      : digest.moodAvg !== null && digest.moodAvg < 3
      ? "Low mood last week — schedule one recovery activity intentionally today."
      : digest.workouts >= 4 && (digest.habitPct ?? 0) >= 80
      ? "Strong week — 4+ workouts and great habit consistency. Carry that into this week."
      : null;
  const now = new Date(); const weekStart = new Date(now);
  const day = weekStart.getDay(); weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1) - 7);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const weekLabel = `${fmt(weekStart)} – ${fmt(weekEnd)}`;
  return (
    <div className="rounded-r5 border border-border bg-bg-surface flex overflow-hidden">
      <div className="w-1 flex-shrink-0" style={{ background: "#64b4a0" }} />
      <div className="flex-1 p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-11 font-semibold uppercase tracking-widest" style={{ color: "#64b4a0" }}>Last week</p>
            <h3 className="font-display text-15 font-semibold text-text-primary mt-0.5">Weekly recap</h3>
          </div>
          <button onClick={onDismiss} className="w-7 h-7 flex items-center justify-center rounded-pill hover:bg-bg-elevated text-text-disabled hover:text-text-muted transition-colors flex-shrink-0"><X size={13} /></button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {items.map(item => (
            <div key={item.label} className="rounded-r3 bg-bg-elevated border border-border px-3 py-2">
              {item.value !== null ? <p className="font-mono text-15 font-semibold text-text-primary">{item.value}</p> : <p className="font-mono text-15 text-text-disabled">—</p>}
              <p className="text-10 text-text-muted mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
        {insight && <p className="text-12 text-text-secondary leading-relaxed"><span className="font-semibold text-text-primary">Insight: </span>{insight}</p>}
        <div className="flex items-center gap-2 pt-1">
          <ShareableWeekCard username={username} weekLabel={weekLabel} workouts={digest.workouts} sleepAvg={digest.sleepAvg} habitPct={digest.habitPct} moodAvg={digest.moodAvg} readinessScore={readinessScore} />
        </div>
      </div>
    </div>
  );
}

// ─── readiness card ───────────────────────────────────────────────────────────

function ReadinessCard({ score, label, color, sleepPts, hrvPts, rhrPts, trainingPts, lastSleepHrs, hrv, w, h }: {
  score: number; label: string; color: string;
  sleepPts: number; hrvPts: number; rhrPts: number; trainingPts: number;
  lastSleepHrs: number | null; hrv: number | null; w: number; h: number;
}) {
  const { isFull, isMid, isSmall } = sizeTier(w, h);
  const hasData = lastSleepHrs !== null || hrv !== null;
  const R = 46; const circ = 2 * Math.PI * R; const pct = score / 100; const offset = circ - pct * circ;
  const bars = [
    { label: "Sleep",    pts: sleepPts,    max: 40 },
    { label: "HRV",      pts: hrvPts,      max: 20 },
    { label: "Resting HR", pts: rhrPts,    max: 20 },
    { label: "Recovery", pts: trainingPts, max: 20 },
  ];

  if (!hasData) {
    return (
      <Card className="p-4 flex flex-col gap-3">
        {!isSmall && <div className="flex items-center justify-between"><span className="text-11 font-semibold uppercase tracking-widest text-text-muted">Readiness</span><IconBadge icon={Activity} color="var(--color-accent)" /></div>}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-4">
          <Activity size={24} className="text-text-disabled" />
          {!isSmall && <p className="text-12 text-text-muted">Log sleep, HRV and resting HR to calculate your readiness score.</p>}
        </div>
      </Card>
    );
  }

  if (isSmall) {
    return (
      <Card className="p-4 flex items-center justify-center">
        <span className="font-mono text-36 font-semibold leading-none" style={{ color }}>{score}</span>
      </Card>
    );
  }

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-shrink-0">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">Readiness</span>
        <InfoTooltip text="Daily readiness (0–100) based on sleep, HRV, resting HR, and training load." />
      </div>
      <div className="flex items-center gap-4 flex-1 min-h-0">
        <div className="relative flex-shrink-0">
          <svg width={isMid ? 90 : 110} height={isMid ? 90 : 110} viewBox="0 0 110 110" aria-hidden>
            <circle cx="55" cy="55" r={R} fill="none" stroke="var(--color-bg-elevated)" strokeWidth="10" />
            <circle cx="55" cy="55" r={R} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 55 55)" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-28 font-semibold leading-none" style={{ color }}>{score}</span>
            <span className="text-10 font-semibold mt-0.5" style={{ color }}>{label}</span>
          </div>
        </div>
        {isFull && (
          <div className="flex flex-col gap-2.5 flex-1 min-w-0">
            {bars.map(b => (
              <div key={b.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-10 text-text-muted truncate overflow-hidden">{b.label}</span>
                  <span className="text-10 font-mono text-text-secondary flex-shrink-0">{b.pts}/{b.max}</span>
                </div>
                <ProgressBar pct={(b.pts / b.max) * 100} color={color} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── momentum card ────────────────────────────────────────────────────────────

function MomentumCard({ score, domains, w, h }: {
  score: number;
  domains: { workout: boolean; sleep: boolean; mood: boolean; nutrition: boolean; habits: boolean };
  w: number; h: number;
}) {
  const { isFull, isMid, isSmall } = sizeTier(w, h);
  const items = [
    { key: "workout",   label: "Workout",   icon: Dumbbell },
    { key: "sleep",     label: "Sleep",     icon: Moon     },
    { key: "habits",    label: "Habits",    icon: Flame    },
    { key: "nutrition", label: "Nutrition", icon: Utensils },
    { key: "mood",      label: "Mood",      icon: Sparkles },
  ] as const;
  const color = score >= 4 ? "#22C55E" : score >= 3 ? "#6C63FF" : score >= 1 ? "#F59E0B" : "var(--color-text-disabled)";
  const statusLabel = score === 5 ? "Crushing it" : score >= 3 ? "On track" : score >= 1 ? "Getting started" : "Nothing yet";

  if (isSmall) {
    return (
      <Card className="p-4 flex items-center justify-center gap-1.5">
        <span className="font-mono text-28 font-semibold leading-none" style={{ color }}>{score}</span>
        <span className="text-16 text-text-muted">/5</span>
      </Card>
    );
  }

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-shrink-0">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted truncate">Today&apos;s momentum</span>
        <InfoTooltip text="How many of your 5 key health domains you've tracked today." />
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-end gap-1">
          <span className="font-mono font-semibold leading-none" style={{ fontSize: isMid ? 36 : 48, color }}>{score}</span>
          <span className="text-16 text-text-muted mb-1">/5</span>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-13 font-semibold truncate overflow-hidden" style={{ color }}>{statusLabel}</span>
          {isFull && <span className="text-11 text-text-muted truncate overflow-hidden">{score >= 3 ? "Keep going today" : "Log 3+ domains to stay on track"}</span>}
        </div>
      </div>
      {(isFull || isMid) && (
        <div className="grid grid-cols-5 gap-1.5">
          {items.map(item => {
            const done = domains[item.key];
            const Icon = item.icon;
            return (
              <div key={item.key} className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-r3 flex items-center justify-center transition-colors"
                  style={{ background: done ? "color-mix(in oklab, var(--color-success) 15%, transparent)" : "var(--color-bg-elevated)", border: done ? "1px solid color-mix(in oklab, var(--color-success) 30%, transparent)" : "1px solid var(--color-border)" }}>
                  {done ? <CheckCircle2 size={15} style={{ color: "var(--color-success)" }} /> : <Icon size={13} className="text-text-disabled" />}
                </div>
                {isFull && <span className="text-10 text-text-muted text-center leading-tight truncate overflow-hidden w-full">{item.label}</span>}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── render card by ID ────────────────────────────────────────────────────────

function renderCard(id: string, d: DashboardData, w: number, h: number, onAddWater?: () => void): React.ReactNode {
  switch (id) {
    case "weekly-ring":      return <WeeklyRingCard d={d} w={w} h={h} />;
    case "streak":           return <StreakCard streak={d.streak} w={w} h={h} />;
    case "sleep":            return <SleepCard duration={d.lastSleepDuration} quality={d.lastSleepQuality} sparkline={d.sleepSparkline} w={w} h={h} />;
    case "resting-hr":       return <StatCard label="Resting HR" value={d.restingHR} unit="bpm" Icon={Heart} w={w} h={h}
                               progressPct={d.restingHR !== null ? Math.max(0, Math.min(100, (100 - d.restingHR) / 40 * 100)) : 0}
                               progressColor="var(--color-danger)" />;
    case "workouts":         return <WorkoutsCard count={d.workoutCount} target={d.workoutTarget} lastSession={d.lastSession} weeklyVolume={d.weeklyVolume} w={w} h={h} />;
    case "heatmap":          return <HeatmapCard workoutDates={d.workoutDates} w={w} h={h} />;
    case "ai-insight":       return <AIInsightCard insight={d.aiInsight} w={w} h={h} />;
    case "hrv":              return <StatCard label="HRV" value={d.hrv} unit="ms" Icon={Activity} w={w} h={h}
                               progressPct={d.hrv !== null ? Math.min(100, (d.hrv / 80) * 100) : 0}
                               progressColor="var(--color-success)" />;
    case "water-today":      return <WaterTodayCard ml={d.waterToday ?? 0} w={w} h={h} onAddWater={onAddWater} />;
    case "nutrition-summary":return <NutritionSummaryCard protein={d.proteinToday ?? 0} target={d.proteinTarget ?? 150} w={w} h={h} />;
    case "next-workout":     return <NextWorkoutCard name={d.nextWorkoutName} w={w} h={h} />;
    case "focus-widget":     return <FocusWidgetCard focus={d.currentFocus} startDate={d.focusStartDate} endDate={d.focusEndDate} w={w} h={h} />;
    case "weight-trend":     return <WeightTrendCard trend={d.weightTrend ?? []} w={w} h={h} />;
    case "goals-progress":   return <GoalsProgressCard count={d.activeGoalCount ?? 0} goals={d.topGoals} w={w} h={h} />;
    case "journal-streak":   return <JournalStreakCard days30={d.journalDays30 ?? 0} w={w} h={h} />;
    case "weekly-volume":    return <WeeklyVolumeCard weeklyVolume={d.weeklyVolume} w={w} h={h} />;
    case "readiness":        return <ReadinessCard score={d.readinessScore ?? 0} label={d.readinessLabel ?? "—"} color={d.readinessColor ?? "var(--color-text-muted)"} sleepPts={d.readinessSleepPts ?? 8} hrvPts={d.readinessHrvPts ?? 4} rhrPts={d.readinessRhrPts ?? 4} trainingPts={d.readinessTrainingPts ?? 20} lastSleepHrs={d.lastSleepDuration} hrv={d.hrv} w={w} h={h} />;
    case "momentum":         return <MomentumCard score={d.momentumScore ?? 0} domains={d.momentumDomains ?? { workout: false, sleep: false, mood: false, nutrition: false, habits: false }} w={w} h={h} />;
    default:                 return null;
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function getISOWeekNumber(): number {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function mergeLayout(saved: LayoutItem[], defaults: LayoutItem[]): LayoutItem[] {
  const map = new Map(saved.map(it => [it.i, it]));
  return defaults.map(d => map.get(d.i) ?? d);
}

// ─── drag indicator SVG ───────────────────────────────────────────────────────

function DragDots() {
  return (
    <svg width="20" height="4" viewBox="0 0 20 4" aria-hidden>
      <circle cx="3"  cy="2" r="1.5" fill="rgba(255,255,255,0.45)" />
      <circle cx="10" cy="2" r="1.5" fill="rgba(255,255,255,0.45)" />
      <circle cx="17" cy="2" r="1.5" fill="rgba(255,255,255,0.45)" />
    </svg>
  );
}

// ─── main export ──────────────────────────────────────────────────────────────

export function DashboardContent(props: DashboardData) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editToast, setEditToast] = useState(false);
  const [saving, setSaving] = useState(false);
  const [, startWaterTransition] = useTransition();
  const [rowHeight, setRowHeight] = useState(
    typeof window !== "undefined" && window.innerWidth < 768 ? 52 : 60
  );

  // Priority: Supabase → localStorage → defaults
  const initialLayout = useMemo((): { lg: RGLItem[]; hidden: string[] } => {
    const savedVersion = (props.dashboardLayout as Record<string, unknown> | null)?.v;
    if (props.dashboardLayout?.lg && savedVersion === LAYOUT_VERSION) {
      return {
        lg: mergeLayout(props.dashboardLayout.lg, DEFAULT_LAYOUT_LG) as RGLItem[],
        hidden: props.dashboardLayout.hidden ?? DEFAULT_HIDDEN,
      };
    }
    if (typeof window !== "undefined") {
      const ls = loadFromLS();
      if (ls) return { lg: mergeLayout(ls.lg, DEFAULT_LAYOUT_LG) as RGLItem[], hidden: ls.hidden };
    }
    return { lg: DEFAULT_LAYOUT_LG as RGLItem[], hidden: DEFAULT_HIDDEN };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [layouts, setLayouts] = useState<{ lg: RGLItem[]; md: RGLItem[]; sm: RGLItem[] }>({
    lg: initialLayout.lg,
    md: DEFAULT_LAYOUT_MD as RGLItem[],
    sm: DEFAULT_LAYOUT_SM as RGLItem[],
  });
  const [hiddenCards, setHiddenCards] = useState<string[]>(initialLayout.hidden);

  // Refs for stable callback access
  const editModeRef = useRef(editMode);
  useEffect(() => { editModeRef.current = editMode; }, [editMode]);
  const hiddenCardsRef = useRef(hiddenCards);
  useEffect(() => { hiddenCardsRef.current = hiddenCards; }, [hiddenCards]);

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

  const hour = new Date().getHours();
  const greeting = hour >= 5 && hour < 12 ? "Good morning" : hour < 19 ? "Good afternoon" : "Good evening";

  function getSubtitle(): string | null {
    if (editMode) return "Drag the top bar to move. Drag the corner arrow to resize.";
    if (props.workoutCount === 0) return "You haven't trained yet this week.";
    if (props.streak > 0) return `Day ${props.streak} streak. Keep it going.`;
    const remaining = props.habitTotal - (props.habitsTodayDone ?? 0);
    if (props.habitTotal > 0 && remaining > 0) return `You have ${remaining} habit${remaining > 1 ? "s" : ""} left to complete.`;
    if (props.habitTotal > 0 && remaining === 0) return "All habits done today. Strong work.";
    const topGoal = props.topGoals?.[0];
    if (topGoal) return `Goal: ${topGoal.title}${topGoal.progress > 0 ? ` — ${Math.round(topGoal.progress)}%` : ""}`;
    if (props.lastSleepDuration !== null && props.lastSleepDuration < 7) return `You got ${props.lastSleepDuration.toFixed(1)}hrs last night. Aim for 7+ tonight.`;
    return null;
  }
  const subtitle = getSubtitle();

  // ─── layout handlers ─────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLayoutChange = useCallback((_layout: any, allLayouts: any) => {
    const newLg = (allLayouts.lg as RGLItem[] | undefined);
    if (!newLg) return;
    setLayouts(prev => ({ ...prev, lg: newLg }));
    if (editModeRef.current) {
      saveToLS({ lg: newLg as unknown as LayoutItem[], hidden: hiddenCardsRef.current, v: LAYOUT_VERSION });
    }
  }, []);

  function hideCard(id: string) { setHiddenCards(prev => [...prev, id]); }
  function showCard(id: string) { setHiddenCards(prev => prev.filter(h => h !== id)); }

  function handleReset() {
    setLayouts({ lg: DEFAULT_LAYOUT_LG as RGLItem[], md: DEFAULT_LAYOUT_MD as RGLItem[], sm: DEFAULT_LAYOUT_SM as RGLItem[] });
    setHiddenCards(DEFAULT_HIDDEN);
    saveToLS({ lg: DEFAULT_LAYOUT_LG, hidden: DEFAULT_HIDDEN, v: LAYOUT_VERSION });
  }

  async function handleSave() {
    setSaving(true);
    const payload = { lg: layouts.lg as unknown as LayoutItem[], hidden: hiddenCards, v: LAYOUT_VERSION };
    saveToLS(payload);
    try {
      await saveDashboardLayout(payload);
    } finally {
      setSaving(false);
      setEditMode(false);
    }
  }

  function handleCancel() {
    setLayouts({ lg: initialLayout.lg, md: DEFAULT_LAYOUT_MD as RGLItem[], sm: DEFAULT_LAYOUT_SM as RGLItem[] });
    setHiddenCards(initialLayout.hidden);
    setEditMode(false);
  }

  function handleEnterEditMode() {
    setEditMode(true);
    setEditToast(true);
    trackEvent("dashboard_layout_edited");
    setTimeout(() => setEditToast(false), 3000);
  }

  function handleAddWater() {
    startWaterTransition(async () => {
      await quickLogWater(250);
      router.refresh();
    });
  }

  const visibleIds = DEFAULT_CARDS.filter(id => !hiddenCards.includes(id));
  const hiddenIds = DEFAULT_CARDS.filter(id => hiddenCards.includes(id));

  // ─── render ──────────────────────────────────────────────────────────────────

  const gridContent = !mounted ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {visibleIds.map(id => <div key={id} className="h-32 rounded-r5 border border-border bg-bg-surface" />)}
    </div>
  ) : (
    <div className={editMode ? "rgl-edit-container" : ""} style={{ pointerEvents: editMode ? undefined : "none" }}>
      <ResponsiveGridLayout
        className={editMode ? "edit-mode" : undefined}
        layouts={layouts as unknown as ResponsiveLayouts}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={rowHeight}
        margin={MARGIN}
        isDraggable={editMode}
        isResizable={editMode}
        isBounded={true}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={(bp: string) => setRowHeight(bp === "sm" ? 52 : 60)}
        draggableHandle=".widget-drag-handle"
        resizeHandles={["se"]}
        useCSSTransforms
      >
        {visibleIds.map(id => {
          const item = layouts.lg.find(l => l.i === id);
          const w = item?.w ?? 6;
          const h = item?.h ?? 2;
          return (
            <div key={id} className="rgl-drag-handle" style={{ pointerEvents: "auto" }}>
              <div className="relative h-full">
                {renderCard(id, props, w, h, handleAddWater)}

                {editMode && (
                  <>
                    {/* Semi-transparent content overlay */}
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.38)", borderRadius: 12, zIndex: 5, pointerEvents: "auto" }} />
                    {/* Dashed edit border */}
                    <div style={{ position: "absolute", inset: 0, border: "1px dashed rgba(255,255,255,0.18)", borderRadius: 12, zIndex: 6, pointerEvents: "none" }} />
                    {/* Drag handle bar */}
                    <div className="widget-drag-handle" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 24, background: "rgba(255,255,255,0.07)", borderRadius: "12px 12px 0 0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", zIndex: 10 }}>
                      <DragDots />
                    </div>
                    {/* Hide button */}
                    <button type="button" onClick={e => { e.stopPropagation(); hideCard(id); }}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-pill bg-bg-elevated/90 border border-border flex items-center justify-center text-text-muted hover:text-danger hover:border-danger transition-colors"
                      style={{ zIndex: 15 }} aria-label={`Hide ${CARD_META[id]?.label ?? id}`}>
                      <EyeOff size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </ResponsiveGridLayout>

      {editMode && hiddenIds.length > 0 && (
        <div className="mt-6 p-4 rounded-r4 border border-dashed border-border bg-bg-surface">
          <p className="text-11 font-semibold uppercase tracking-widest text-text-muted mb-3">Hidden widgets — click to restore</p>
          <div className="flex flex-wrap gap-2">
            {hiddenIds.map(id => {
              const meta = CARD_META[id];
              if (!meta) return null;
              const { Icon } = meta;
              return (
                <button key={id} type="button" onClick={() => showCard(id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-r3 border border-border bg-bg-elevated hover:bg-bg-overlay text-13 text-text-secondary hover:text-text-primary transition-colors">
                  <Plus size={12} /><Icon size={13} /><span>{meta.label}</span>
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
      {/* Edit mode instruction toast */}
      {editToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-pill bg-bg-surface border border-border shadow-2xl text-13 text-text-primary font-medium whitespace-nowrap pointer-events-none">
          Drag the top bar to move. Drag the corner arrow to resize.
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">
            {greeting}, {props.username}.
          </h1>
          {subtitle && <p className="text-13 text-text-secondary">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-shrink-0">
          {editMode ? (
            <>
              <button type="button" onClick={handleReset} className="text-13 text-text-muted hover:text-text-secondary transition-colors px-2 py-1.5">Reset</button>
              <button type="button" onClick={handleCancel} className="p-1.5 rounded-r2 text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors" aria-label="Cancel"><X size={16} /></button>
              <button type="button" onClick={handleSave} disabled={saving} className="px-3 py-1.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-medium transition-colors disabled:opacity-50">
                {saving ? "Saving…" : "Done"}
              </button>
            </>
          ) : (
            <button type="button" onClick={handleEnterEditMode} className="px-3 py-1.5 rounded-r3 border border-border text-13 text-text-secondary hover:bg-bg-elevated transition-colors">
              Edit layout
            </button>
          )}
        </div>
      </div>

      {props.currentFocus && props.focusStartDate && props.focusEndDate && (
        <FocusBanner focus={props.currentFocus} startDate={props.focusStartDate} endDate={props.focusEndDate} />
      )}

      {showDigest && (
        <WeeklyDigestCard digest={props.lastWeekDigest} onDismiss={dismissDigest} username={props.username} readinessScore={props.readinessScore} />
      )}

      {props.setupPct < 100 && <SetupCard pct={props.setupPct} />}

      {gridContent}
    </div>
  );
}
