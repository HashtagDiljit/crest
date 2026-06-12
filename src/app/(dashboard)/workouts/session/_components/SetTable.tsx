import type { SessionSetRow } from "../../actions";

type LoggingType = "weight_reps" | "time_distance" | "time_reps" | "time_weight";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  warmup:  { label: "W", color: "text-warning" },
  working: { label: "S", color: "text-accent" },
  dropset: { label: "D", color: "text-success" },
  failure: { label: "F", color: "text-danger" },
};

interface Props {
  sets: SessionSetRow[];
  targetSets: number;
  currentSetIdx: number;
  loggingType?: LoggingType;
}

function fmtDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null) return "—";
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function SetTable({ sets, targetSets, currentSetIdx, loggingType = "weight_reps" }: Props) {
  const rows = Array.from({ length: targetSets }, (_, i) => sets[i] ?? null);

  const showWeight = loggingType === "weight_reps" || loggingType === "time_weight";
  const showReps = loggingType === "weight_reps";
  const showDuration = loggingType !== "weight_reps";
  const showDistance = loggingType === "time_distance";

  return (
    <div className="rounded-r4 border border-border overflow-hidden">
      <table className="w-full text-12">
        <thead>
          <tr className="border-b border-border bg-bg-elevated">
            <th className="py-2 px-3 text-left font-mono text-10 text-text-muted tracking-widest uppercase">Set</th>
            <th className="py-2 px-2 text-center font-mono text-10 text-text-muted tracking-widest uppercase">Type</th>
            {showDuration && (
              <th className="py-2 px-3 text-right font-mono text-10 text-text-muted tracking-widest uppercase">Duration</th>
            )}
            {showDistance && (
              <th className="py-2 px-3 text-right font-mono text-10 text-text-muted tracking-widest uppercase">Distance</th>
            )}
            {showWeight && (
              <th className="py-2 px-3 text-right font-mono text-10 text-text-muted tracking-widest uppercase">Weight</th>
            )}
            {showReps && (
              <th className="py-2 px-3 text-right font-mono text-10 text-text-muted tracking-widest uppercase">Reps</th>
            )}
            <th className="py-2 px-3 text-center font-mono text-10 text-text-muted tracking-widest uppercase">✓</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((set, i) => {
            const isDone = set !== null;
            const isActive = i === currentSetIdx && !isDone;
            const typeInfo = isDone ? (TYPE_LABELS[set.set_type ?? "working"] ?? TYPE_LABELS.working) : null;
            return (
              <tr
                key={i}
                className={`border-b border-border last:border-0 transition-colors ${isDone ? "opacity-60" : ""}`}
                style={isActive ? { background: "var(--color-accent-soft)" } : undefined}
              >
                <td className="py-2.5 px-3 font-mono text-text-secondary">{i + 1}</td>
                <td className="py-2.5 px-2 text-center">
                  {typeInfo ? (
                    <span className={`font-mono text-10 font-bold ${typeInfo.color}`}>{typeInfo.label}</span>
                  ) : (
                    <span className="text-text-disabled">—</span>
                  )}
                </td>
                {showDuration && (
                  <td className="py-2.5 px-3 text-right font-mono text-text-primary">
                    {isDone ? fmtDuration(set.duration_seconds) : "—"}
                  </td>
                )}
                {showDistance && (
                  <td className="py-2.5 px-3 text-right font-mono text-text-primary">
                    {isDone ? `${set.distance_km ?? 0}km` : "—"}
                  </td>
                )}
                {showWeight && (
                  <td className="py-2.5 px-3 text-right font-mono text-text-primary">
                    {isDone ? `${set.weight_kg ?? 0}kg` : "—"}
                  </td>
                )}
                {showReps && (
                  <td className="py-2.5 px-3 text-right font-mono text-text-primary">
                    {isDone ? (set.reps ?? "—") : "—"}
                  </td>
                )}
                <td className="py-2.5 px-3 text-center">
                  {isDone ? (
                    <span className="text-success font-bold">✓</span>
                  ) : (
                    <span className="text-text-disabled">○</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
