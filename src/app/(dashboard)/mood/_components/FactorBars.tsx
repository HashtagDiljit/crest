import { Moon, Dumbbell } from "lucide-react";
import type { MoodCorrelation } from "../actions";

interface Props {
  correlation: MoodCorrelation;
}

export function FactorBars({ correlation }: Props) {
  const { sleepLift, workoutLift, sleepDayCount, workoutDayCount } = correlation;

  if (sleepLift === null && workoutLift === null) {
    return (
      <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-3">
        <h2 className="font-display text-15 font-semibold text-text-primary">What lifts your mood</h2>
        <p className="text-13 text-text-secondary">Log mood, sleep, and workouts for a few weeks to see correlations.</p>
      </div>
    );
  }

  return (
    <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-4">
      <h2 className="font-display text-15 font-semibold text-text-primary">What lifts your mood</h2>
      <div className="flex flex-col gap-3">
        {sleepLift !== null && (
          <FactorBar
            icon={<Moon size={14} className="text-info" />}
            label="Sleep ≥ 7hr"
            lift={sleepLift}
            days={sleepDayCount}
          />
        )}
        {workoutLift !== null && (
          <FactorBar
            icon={<Dumbbell size={14} className="text-accent" />}
            label="Workout day"
            lift={workoutLift}
            days={workoutDayCount}
          />
        )}
      </div>
      <p className="text-11 text-text-muted">Based on last 90 days. Positive % = mood above your baseline on those days.</p>
    </div>
  );
}

function FactorBar({
  icon,
  label,
  lift,
  days,
}: {
  icon: React.ReactNode;
  label: string;
  lift: number;
  days: number;
}) {
  const isPositive = lift >= 0;
  const barWidth = Math.min(Math.abs(lift), 100);
  const barColor = isPositive ? "var(--color-success)" : "var(--color-danger)";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-13 font-medium text-text-primary">{label}</span>
          <span className="font-mono text-11 text-text-muted">({days}d)</span>
        </div>
        <span
          className="font-mono text-13 font-semibold"
          style={{ color: barColor }}
        >
          {isPositive ? "+" : ""}{lift}%
        </span>
      </div>
      <div className="h-2 rounded-pill bg-bg-elevated overflow-hidden">
        <div
          className="h-full rounded-pill transition-all duration-700"
          style={{ width: `${barWidth}%`, background: barColor }}
        />
      </div>
    </div>
  );
}
