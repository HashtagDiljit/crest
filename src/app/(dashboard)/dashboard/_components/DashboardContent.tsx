"use client";

import { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  Flame,
  Moon,
  Heart,
  Dumbbell,
  BarChart2,
  Sparkles,
  Activity,
  GripVertical,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { saveDashboardLayout } from "../actions";

// ─── types ───────────────────────────────────────────────────────────────────

export interface DashboardData {
  username: string;
  streak: number;
  dashboardLayout: { cards: string[]; hidden: string[] } | null;
  workoutCount: number;
  workoutTarget: number;
  habitTotal: number;
  habitLogs: number;
  sleepNights7hrs: number;
  moodDaysThisWeek: number;
  lastSleepDuration: number | null;
  lastSleepQuality: number | null;
  sleepSparkline: number[];
  restingHR: number | null;
  hrv: number | null;
  workoutDates: string[];
  aiInsight: { title: string; body: string; category: string } | null;
}

// ─── constants ────────────────────────────────────────────────────────────────

const DEFAULT_CARDS = [
  "weekly-ring",
  "streak",
  "sleep",
  "resting-hr",
  "workouts",
  "heatmap",
  "ai-insight",
  "hrv",
];

const CARD_META: Record<string, { label: string; Icon: React.ElementType; span: number }> = {
  "weekly-ring": { label: "Weekly progress", Icon: Activity, span: 2 },
  streak:        { label: "Streak",          Icon: Flame,    span: 1 },
  sleep:         { label: "Sleep",           Icon: Moon,     span: 1 },
  "resting-hr":  { label: "Resting HR",      Icon: Heart,    span: 1 },
  workouts:      { label: "Workouts",        Icon: Dumbbell, span: 1 },
  heatmap:       { label: "Activity heatmap",Icon: BarChart2,span: 3 },
  "ai-insight":  { label: "AI insight",      Icon: Sparkles, span: 2 },
  hrv:           { label: "HRV",             Icon: Activity, span: 1 },
};

// ─── base card ────────────────────────────────────────────────────────────────

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-r5 border border-border bg-bg-surface ${className}`}>
      {children}
    </div>
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
    {
      label: "Workouts",
      pct: workoutPct,
      color: "var(--color-accent)",
      val: `${d.workoutCount}/${d.workoutTarget}`,
      r: 50,
    },
    {
      label: "Habits",
      pct: habitPct,
      color: "var(--color-success)",
      val: `${d.habitLogs}/${d.habitTotal * 7}`,
      r: 39,
    },
    {
      label: "Sleep ≥ 7hr",
      pct: sleepPct,
      color: "var(--color-warning)",
      val: `${d.sleepNights7hrs}/7`,
      r: 28,
    },
    {
      label: "Mood ≥ 3",
      pct: moodPct,
      color: "var(--color-info)",
      val: `${d.moodDaysThisWeek}/7`,
      r: 17,
    },
  ];

  return (
    <Card className="p-5 flex items-center gap-5 min-h-[12rem]">
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        className="flex-shrink-0"
        aria-hidden
      >
        {rings.map((ring) => {
          const circ = 2 * Math.PI * ring.r;
          const offset = circ - (ring.pct / 100) * circ;
          return (
            <g key={ring.label}>
              <circle
                cx="60"
                cy="60"
                r={ring.r}
                fill="none"
                stroke="var(--color-bg-elevated)"
                strokeWidth="6"
              />
              {ring.pct > 0 && (
                <circle
                  cx="60"
                  cy="60"
                  r={ring.r}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  transform="rotate(-90 60 60)"
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex flex-col gap-2.5 flex-1 min-w-0">
        {rings.map((ring) => (
          <div key={ring.label} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: ring.color }}
            />
            <span className="text-13 text-text-secondary truncate">
              {ring.label}
            </span>
            <span className="ml-auto font-mono text-11 text-text-muted flex-shrink-0">
              {ring.val}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── streak card ──────────────────────────────────────────────────────────────

function StreakCard({ streak }: { streak: number }) {
  return (
    <Card className="p-5 h-48 flex flex-col items-center justify-center gap-2">
      <Flame
        size={28}
        style={{ color: streak > 0 ? "var(--color-streak)" : "var(--color-text-disabled)" }}
      />
      <span
        className="font-mono text-40 font-semibold leading-none"
        style={{ color: streak > 0 ? "var(--color-text-primary)" : "var(--color-text-disabled)" }}
      >
        {streak}
      </span>
      <span className="text-11 text-text-muted">
        {streak === 1 ? "day streak" : "day streak"}
      </span>
    </Card>
  );
}

// ─── sleep card ───────────────────────────────────────────────────────────────

function SleepCard({
  duration,
  quality,
  sparkline,
}: {
  duration: number | null;
  quality: number | null;
  sparkline: number[];
}) {
  const qualityLabel =
    quality === null
      ? null
      : quality >= 4
      ? "Great"
      : quality >= 3
      ? "Good"
      : quality >= 2
      ? "Fair"
      : "Poor";

  return (
    <Card className="p-5 h-36 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">
          Sleep
        </span>
        <Moon size={14} className="text-text-disabled" />
      </div>
      <div className="flex items-end justify-between">
        <div className="flex items-end gap-1.5">
          {duration !== null ? (
            <>
              <span className="font-mono text-32 font-medium text-text-primary leading-none">
                {duration.toFixed(1)}
              </span>
              <span className="text-13 text-text-muted mb-0.5">hrs</span>
            </>
          ) : (
            <span className="font-mono text-32 font-medium text-text-disabled leading-none">
              —
            </span>
          )}
        </div>
        {sparkline.length >= 2 && (
          <Sparkline data={sparkline} color="var(--color-warning)" />
        )}
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

function StatCard({
  label,
  value,
  unit,
  Icon,
}: {
  label: string;
  value: number | null;
  unit: string;
  Icon: React.ElementType;
}) {
  return (
    <Card className="p-5 h-36 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">
          {label}
        </span>
        <Icon size={14} className="text-text-disabled" />
      </div>
      <div className="flex items-end gap-1.5">
        {value !== null ? (
          <>
            <span className="font-mono text-32 font-medium text-text-primary leading-none">
              {Math.round(value)}
            </span>
            <span className="text-13 text-text-muted mb-0.5">{unit}</span>
          </>
        ) : (
          <>
            <span className="font-mono text-32 font-medium text-text-disabled leading-none">
              —
            </span>
            <span className="text-13 text-text-muted mb-0.5">{unit}</span>
          </>
        )}
      </div>
      <div className="h-1.5 rounded-pill bg-bg-elevated" />
    </Card>
  );
}

// ─── workouts card ────────────────────────────────────────────────────────────

function WorkoutsCard({
  count,
  target,
}: {
  count: number;
  target: number;
}) {
  const pct = Math.min((count / target) * 100, 100);
  return (
    <Card className="p-5 h-36 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">
          Workouts
        </span>
        <Dumbbell size={14} className="text-text-disabled" />
      </div>
      <div className="flex items-end gap-1.5">
        <span
          className="font-mono text-32 font-medium leading-none"
          style={{ color: count > 0 ? "var(--color-text-primary)" : "var(--color-text-disabled)" }}
        >
          {count}
        </span>
        <span className="text-13 text-text-muted mb-0.5">/ {target} wk</span>
      </div>
      <div className="h-1.5 rounded-pill bg-bg-elevated overflow-hidden">
        <div
          className="h-full rounded-pill bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Card>
  );
}

// ─── heatmap card ─────────────────────────────────────────────────────────────

function HeatmapCard({ workoutDates }: { workoutDates: string[] }) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysToMonday);
  thisMonday.setHours(0, 0, 0, 0);

  const startDate = new Date(thisMonday);
  startDate.setDate(thisMonday.getDate() - 25 * 7);

  const countMap = new Map<string, number>();
  for (const d of workoutDates) {
    countMap.set(d, (countMap.get(d) ?? 0) + 1);
  }

  const weeks: Array<Array<{ date: string; count: number }>> = [];
  const cursor = new Date(startDate);

  for (let w = 0; w < 26; w++) {
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
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">
          Activity · 6 months
        </span>
        <BarChart2 size={14} className="text-text-muted" />
      </div>
      <div className="flex gap-1 overflow-x-auto">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1 flex-1 min-w-[10px]">
            {week.map((day) => {
              const isFuture = day.date > todayStr;
              return (
                <div
                  key={day.date}
                  className="aspect-square rounded-r1"
                  style={{
                    background: isFuture
                      ? "transparent"
                      : day.count === 0
                      ? "var(--color-bg-elevated)"
                      : "var(--color-accent)",
                    opacity: isFuture ? 0 : day.count === 1 ? 0.5 : 1,
                  }}
                  title={
                    isFuture
                      ? undefined
                      : `${day.date}: ${day.count} workout${day.count !== 1 ? "s" : ""}`
                  }
                />
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── AI insight card ──────────────────────────────────────────────────────────

function AIInsightCard({
  insight,
}: {
  insight: { title: string; body: string; category: string } | null;
}) {
  return (
    <Card className="p-5 flex items-start gap-4">
      <div className="w-8 h-8 rounded-r3 bg-accent/15 flex items-center justify-center flex-shrink-0">
        <Sparkles size={15} className="text-accent" />
      </div>
      {insight ? (
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-11 font-semibold uppercase tracking-widest text-accent">
              {insight.category}
            </span>
          </div>
          <p className="text-13 font-semibold text-text-primary">
            {insight.title}
          </p>
          <p className="text-13 text-text-secondary line-clamp-3">{insight.body}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className="text-13 font-semibold text-text-secondary">
            AI insights will appear here
          </span>
          <p className="text-13 text-text-muted">
            Log workouts, sleep, mood, and habits for a week — your first
            insight will surface automatically.
          </p>
        </div>
      )}
    </Card>
  );
}

// ─── render card by ID ────────────────────────────────────────────────────────

function renderCard(id: string, d: DashboardData): React.ReactNode {
  switch (id) {
    case "weekly-ring":
      return <WeeklyRingCard d={d} />;
    case "streak":
      return <StreakCard streak={d.streak} />;
    case "sleep":
      return (
        <SleepCard
          duration={d.lastSleepDuration}
          quality={d.lastSleepQuality}
          sparkline={d.sleepSparkline}
        />
      );
    case "resting-hr":
      return (
        <StatCard
          label="Resting HR"
          value={d.restingHR}
          unit="bpm"
          Icon={Heart}
        />
      );
    case "workouts":
      return <WorkoutsCard count={d.workoutCount} target={d.workoutTarget} />;
    case "heatmap":
      return <HeatmapCard workoutDates={d.workoutDates} />;
    case "ai-insight":
      return <AIInsightCard insight={d.aiInsight} />;
    case "hrv":
      return <StatCard label="HRV" value={d.hrv} unit="ms" Icon={Activity} />;
    default:
      return null;
  }
}

// ─── dashboard grid (normal mode) ─────────────────────────────────────────────

function DashboardGrid({
  visibleCards,
  d,
}: {
  visibleCards: string[];
  d: DashboardData;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {visibleCards.map((id) => {
        const meta = CARD_META[id];
        if (!meta) return null;
        const spanClass =
          meta.span === 3
            ? "sm:col-span-3"
            : meta.span === 2
            ? "sm:col-span-2"
            : "";
        return (
          <div key={id} className={spanClass}>
            {renderCard(id, d)}
          </div>
        );
      })}
    </div>
  );
}

// ─── edit panel (DnD mode) ────────────────────────────────────────────────────

function EditPanel({
  cardOrder,
  hiddenCards,
  onDragEnd,
  onToggleHide,
}: {
  cardOrder: string[];
  hiddenCards: string[];
  onDragEnd: (result: DropResult) => void;
  onToggleHide: (id: string) => void;
}) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="cards">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex flex-col gap-2"
          >
            {cardOrder.map((id, index) => {
              const meta = CARD_META[id];
              if (!meta) return null;
              const hidden = hiddenCards.includes(id);
              const { Icon } = meta;
              return (
                <Draggable key={id} draggableId={id} index={index}>
                  {(drag, snapshot) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      className={`flex items-center gap-3 p-3 rounded-r3 border transition-colors select-none ${
                        snapshot.isDragging
                          ? "border-border-strong bg-bg-elevated shadow-lg"
                          : "border-border bg-bg-surface hover:bg-bg-elevated"
                      } ${hidden ? "opacity-50" : ""}`}
                    >
                      <div
                        {...drag.dragHandleProps}
                        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-text-disabled hover:text-text-muted"
                      >
                        <GripVertical size={16} />
                      </div>
                      <Icon size={16} className="flex-shrink-0 text-text-muted" />
                      <span className="text-13 text-text-secondary flex-1">
                        {meta.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleHide(id)}
                        className="flex-shrink-0 p-1 rounded-r2 text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
                        aria-label={hidden ? "Show card" : "Hide card"}
                      >
                        {hidden ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

// ─── main export ──────────────────────────────────────────────────────────────

export function DashboardContent(props: DashboardData) {
  const [editMode, setEditMode] = useState(false);
  const [cardOrder, setCardOrder] = useState<string[]>(
    props.dashboardLayout?.cards ?? DEFAULT_CARDS
  );
  const [hiddenCards, setHiddenCards] = useState<string[]>(
    props.dashboardLayout?.hidden ?? []
  );
  const [saving, setSaving] = useState(false);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const next = [...cardOrder];
    const [removed] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, removed);
    setCardOrder(next);
  }

  function toggleHide(id: string) {
    setHiddenCards((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );
  }

  function handleReset() {
    setCardOrder(DEFAULT_CARDS);
    setHiddenCards([]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveDashboardLayout({ cards: cardOrder, hidden: hiddenCards });
    } finally {
      setSaving(false);
      setEditMode(false);
    }
  }

  function handleCancel() {
    setCardOrder(props.dashboardLayout?.cards ?? DEFAULT_CARDS);
    setHiddenCards(props.dashboardLayout?.hidden ?? []);
    setEditMode(false);
  }

  const visibleCards = cardOrder.filter((id) => !hiddenCards.includes(id));

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">
            {greeting}, {props.username}.
          </h1>
          <p className="text-13 text-text-secondary">
            {editMode
              ? "Drag to reorder. Toggle the eye icon to show/hide cards."
              : "Here’s your overview for today."}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-1 flex-shrink-0">
          {editMode ? (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="text-13 text-text-muted hover:text-text-secondary transition-colors px-2 py-1.5"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1.5 rounded-r2 text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
                aria-label="Cancel"
              >
                <X size={16} />
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-medium transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Done"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="px-3 py-1.5 rounded-r3 border border-border text-13 text-text-secondary hover:bg-bg-elevated transition-colors"
            >
              Edit layout
            </button>
          )}
        </div>
      </div>

      {editMode ? (
        <EditPanel
          cardOrder={cardOrder}
          hiddenCards={hiddenCards}
          onDragEnd={onDragEnd}
          onToggleHide={toggleHide}
        />
      ) : (
        <DashboardGrid visibleCards={visibleCards} d={props} />
      )}
    </div>
  );
}
