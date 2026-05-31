import {
  Dumbbell,
  Flame,
  Moon,
  Heart,
  BarChart2,
  Sparkles,
  Activity,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <DashboardGreeting />
      <DashboardGrid />
    </div>
  );
}

function DashboardGreeting() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">
        Welcome to Crest.
      </h1>
      <p className="text-13 text-text-secondary">
        Start logging to see your stats here.
      </p>
    </div>
  );
}

function DashboardGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="sm:col-span-2">
        <WeeklyRingEmpty />
      </div>
      <StreakCardEmpty />

      <StatCardEmpty label="Sleep" unit="hrs" icon={Moon} />
      <StatCardEmpty label="Resting HR" unit="bpm" icon={Heart} />
      <StatCardEmpty label="Workouts" unit="/ wk" icon={Dumbbell} />

      <div className="sm:col-span-3">
        <HeatmapEmpty />
      </div>

      <div className="sm:col-span-2">
        <AIInsightEmpty />
      </div>

      <StatCardEmpty label="HRV" unit="ms" icon={Activity} />
    </div>
  );
}

function EmptyCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-r5 border border-border bg-bg-surface ${className}`}>
      {children}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="text-11 text-text-muted">{text}</p>
  );
}

function WeeklyRingEmpty() {
  const rings = [
    { label: "Workouts", color: "var(--color-accent)" },
    { label: "Habits", color: "var(--color-success)" },
    { label: "Sleep ≥ 7 hr", color: "var(--color-warning)" },
    { label: "Mood ≥ 3", color: "var(--color-info)" },
  ];

  return (
    <EmptyCard className="p-5 h-48 flex items-center gap-6">
      <div className="w-32 h-32 rounded-full border-4 border-bg-elevated flex-shrink-0 flex items-center justify-center">
        <span className="font-mono text-13 text-text-muted">0%</span>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {rings.map((r) => (
          <div key={r.label} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0 opacity-30"
              style={{ background: r.color }}
            />
            <span className="text-13 text-text-muted">{r.label}</span>
            <span className="ml-auto font-mono text-11 text-text-disabled">— / —</span>
          </div>
        ))}
      </div>
    </EmptyCard>
  );
}

function StreakCardEmpty() {
  return (
    <EmptyCard className="p-5 h-48 flex flex-col items-center justify-center gap-3">
      <Flame size={28} className="text-text-disabled" />
      <span className="font-mono text-32 font-medium text-text-disabled">0</span>
      <EmptyHint text="Log daily to build your streak" />
    </EmptyCard>
  );
}

interface StatCardEmptyProps {
  label: string;
  unit: string;
  icon: React.ElementType;
}

function StatCardEmpty({ label, unit, icon: Icon }: StatCardEmptyProps) {
  return (
    <EmptyCard className="p-5 h-36 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">
          {label}
        </span>
        <Icon size={14} className="text-text-disabled" />
      </div>
      <div className="flex items-end gap-1.5">
        <span className="font-mono text-32 font-medium text-text-disabled">—</span>
        <span className="text-13 text-text-muted mb-1">{unit}</span>
      </div>
      <div className="h-1.5 rounded-pill bg-bg-elevated" />
    </EmptyCard>
  );
}

function HeatmapEmpty() {
  return (
    <EmptyCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">
          Activity · 6 months
        </span>
        <BarChart2 size={14} className="text-text-disabled" />
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 26 }).map((_, w) => (
          <div key={w} className="flex flex-col gap-1 flex-1">
            {Array.from({ length: 7 }).map((_, d) => (
              <div
                key={d}
                className="aspect-square rounded-r1 bg-bg-elevated"
              />
            ))}
          </div>
        ))}
      </div>
    </EmptyCard>
  );
}

function AIInsightEmpty() {
  return (
    <EmptyCard className="p-5 flex items-start gap-4">
      <div className="w-8 h-8 rounded-r3 bg-bg-elevated flex items-center justify-center flex-shrink-0">
        <Sparkles size={15} className="text-text-disabled" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-13 font-semibold text-text-secondary">
          AI insights will appear here
        </span>
        <p className="text-13 text-text-muted">
          Log workouts, sleep, mood, and habits for a week — your first insight
          will surface automatically.
        </p>
      </div>
    </EmptyCard>
  );
}
