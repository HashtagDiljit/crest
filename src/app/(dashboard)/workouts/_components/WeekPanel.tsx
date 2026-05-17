import type { HistorySession } from "../actions";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function getWeekDays(): Date[] {
  const today = new Date();
  const day = today.getDay(); // 0 = Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

interface Props {
  sessions: HistorySession[];
}

export function WeekPanel({ sessions }: Props) {
  const weekDays = getWeekDays();
  const today = new Date();

  const sessionDays = new Set(
    sessions.map((s) => new Date(s.started_at).toDateString())
  );

  const totalSets = sessions.reduce((acc, s) => acc + s.sets_count, 0);
  const totalWorkouts = sessions.length;

  return (
    <div className="rounded-r5 border border-border bg-bg-surface">
      <div className="px-5 py-4 border-b border-border">
        <span className="font-display text-15 font-semibold text-text-primary">This week</span>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* 7-day grid */}
        <div className="flex items-end gap-2">
          {weekDays.map((day, i) => {
            const hasSession = sessionDays.has(day.toDateString());
            const isToday = isSameDay(day, today);
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-full h-8 rounded-r3 transition-colors ${
                    hasSession
                      ? "bg-success"
                      : isToday
                      ? "border-2 border-accent bg-bg-elevated"
                      : "bg-bg-elevated"
                  }`}
                />
                <span
                  className={`font-mono text-10 ${
                    isToday ? "text-accent font-bold" : "text-text-muted"
                  }`}
                >
                  {DAY_LABELS[i]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Volume summary */}
        <div className="flex flex-col gap-3">
          <SummaryRow label="Workouts" value={String(totalWorkouts)} />
          <SummaryRow label="Total sets" value={String(totalSets)} />
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-12 text-text-secondary">{label}</span>
      <span className="font-mono text-13 font-semibold text-text-primary">{value}</span>
    </div>
  );
}
