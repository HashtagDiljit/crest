import type { ExerciseSessionHistory } from "../../actions";

interface Props {
  history: ExerciseSessionHistory[];
  repsTarget: number;
  isDeload: boolean;
  suggestedWeight: number;
}

export function OverloadHistory({ history, repsTarget, isDeload, suggestedWeight }: Props) {
  if (history.length === 0) return null;

  const lastSession = history[0];
  const allHitTarget = lastSession.sets.every((s) => s.reps >= repsTarget);
  const lastWeight = lastSession.sets[0]?.weight_kg ?? 0;

  return (
    <div className="rounded-r4 border border-border bg-bg-inset p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-10 font-mono text-text-muted uppercase tracking-widest">Past sessions</span>
        <span
          className="text-11 font-semibold px-2.5 py-0.5 rounded-pill"
          style={{
            background: isDeload ? "rgba(245,158,11,0.12)" : "var(--color-accent-soft)",
            color: isDeload ? "var(--color-warning)" : "var(--color-accent)",
          }}
        >
          {isDeload ? `Deload: ${suggestedWeight}kg (60%)` : allHitTarget ? `Try ${suggestedWeight}kg (+2.5kg)` : `Match ${lastWeight}kg`}
        </span>
      </div>

      <table className="w-full text-11">
        <thead>
          <tr className="text-text-muted font-mono uppercase tracking-widest text-left">
            <th className="pr-3 pb-1 font-normal">Date</th>
            {lastSession.sets.map((_, i) => (
              <th key={i} className="text-right pr-1 pb-1 font-normal">S{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {history.map((session) => (
            <tr key={session.date} className="text-text-secondary">
              <td className="pr-3 py-0.5 font-mono text-text-muted">{session.date}</td>
              {session.sets.map((s, i) => (
                <td key={i} className="text-right pr-1 py-0.5 font-mono">
                  {s.weight_kg}×{s.reps}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
