"use client";

import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, LabelList,
} from "recharts";

interface Props {
  data: {
    sleepMoodPoints: Array<{ sleepHrs: number; mood: number; date: string }>;
    trainingMoodData: Array<{ name: string; avgMood: number; count: number }>;
    sleepConsistency: { stdDevMinutes: number; avgBedtimeStr: string };
    topHabitCorrelations: Array<{ habitName: string; avgMoodWith: number; avgMoodWithout: number; completionDays: number }>;
    dataPointCount: number;
  };
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-4">
      <div>
        <h2 className="font-display text-15 font-semibold text-text-primary">{title}</h2>
        {subtitle && <p className="text-12 text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Finding({ text }: { text: string }) {
  return (
    <p className="text-13 text-text-secondary leading-relaxed px-3 py-2.5 rounded-r3 bg-bg-elevated border border-border">
      {text}
    </p>
  );
}

export function CorrelationsContent({ data }: Props) {
  const { sleepMoodPoints, trainingMoodData, sleepConsistency, topHabitCorrelations } = data;

  // Sleep→mood finding
  let sleepFinding: string | null = null;
  if (sleepMoodPoints.length >= 7) {
    const over7 = sleepMoodPoints.filter((p) => p.sleepHrs >= 7);
    const under7 = sleepMoodPoints.filter((p) => p.sleepHrs < 7);
    if (over7.length >= 3 && under7.length >= 3) {
      const avgOver = over7.reduce((s, p) => s + p.mood, 0) / over7.length;
      const avgUnder = under7.reduce((s, p) => s + p.mood, 0) / under7.length;
      const diff = Math.round((avgOver - avgUnder) * 10) / 10;
      if (Math.abs(diff) >= 0.3) {
        sleepFinding = diff > 0
          ? `On nights with 7+ hours, your mood averaged ${avgOver.toFixed(1)} vs ${avgUnder.toFixed(1)} on shorter nights. More sleep appears to correlate with better mood.`
          : `On nights with under 7 hours, your mood was actually similar or higher. Your mood may not be strongly sleep-dependent.`;
      }
    }
  }

  // Training→mood finding
  const [trainDay, restDay] = trainingMoodData;
  let trainingFinding: string | null = null;
  if (trainDay.count >= 3 && restDay.count >= 3) {
    const diff = Math.round((trainDay.avgMood - restDay.avgMood) * 10) / 10;
    if (Math.abs(diff) >= 0.2) {
      trainingFinding = diff > 0
        ? `Your mood averages ${trainDay.avgMood} on training days vs ${restDay.avgMood} on rest days. Exercise appears to lift your mood.`
        : `Your mood averages ${restDay.avgMood} on rest days vs ${trainDay.avgMood} on training days. Rest may be what your mind needs most.`;
    } else {
      trainingFinding = `Your mood is similar on training (${trainDay.avgMood}) and rest days (${restDay.avgMood}). No strong relationship yet.`;
    }
  }

  // Consistency finding
  const { stdDevMinutes, avgBedtimeStr } = sleepConsistency;
  let consistencyFinding: string | null = null;
  if (stdDevMinutes > 0) {
    consistencyFinding = stdDevMinutes <= 30
      ? `Your bedtime varies by about ${stdDevMinutes} minutes — highly consistent. Average bedtime is ${avgBedtimeStr}.`
      : stdDevMinutes <= 60
      ? `Your bedtime varies by about ${stdDevMinutes} minutes around ${avgBedtimeStr}. Some inconsistency may affect sleep quality.`
      : `Your bedtime varies by ${stdDevMinutes} minutes — high variability around ${avgBedtimeStr}. A consistent schedule could improve recovery.`;
  }

  const consistencyColor = stdDevMinutes <= 30 ? "var(--color-success)" : stdDevMinutes <= 60 ? "var(--color-warning)" : "var(--color-danger)";

  return (
    <div className="flex flex-col gap-5">
      {/* Sleep → Mood scatter */}
      {sleepMoodPoints.length >= 7 && (
        <SectionCard
          title="Sleep duration vs mood"
          subtitle={`${sleepMoodPoints.length} overlapping days`}
        >
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="sleepHrs"
                type="number"
                name="Sleep"
                unit="h"
                domain={["auto", "auto"]}
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                label={{ value: "Sleep (hrs)", position: "insideBottom", offset: -2, fontSize: 11, fill: "var(--color-text-muted)" }}
              />
              <YAxis
                dataKey="mood"
                type="number"
                name="Mood"
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: 12 }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(val: any, name: any) => [name === "mood" ? `${val}/5` : `${val}h`, name === "mood" ? "Mood" : "Sleep"]}
              />
              <ReferenceLine x={7} stroke="var(--color-accent)" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Scatter data={sleepMoodPoints} fill="var(--color-accent)" opacity={0.7} r={4} />
            </ScatterChart>
          </ResponsiveContainer>
          {sleepFinding && <Finding text={sleepFinding} />}
          <p className="text-11 text-text-disabled">Dashed line at 7 hours. Correlation ≠ causation.</p>
        </SectionCard>
      )}

      {/* Training vs Rest mood */}
      {trainDay.count >= 3 && restDay.count >= 3 && (
        <SectionCard
          title="Mood on training vs rest days"
          subtitle={`${trainDay.count} training days · ${restDay.count} rest days`}
        >
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={trainingMoodData} barSize={48} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: 12 }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(val: any) => [`${val}/5`, "Avg mood"]}
              />
              <Bar dataKey="avgMood" radius={[6, 6, 0, 0]}>
                {trainingMoodData.map((entry, i) => (
                  <Cell key={i} fill={i === 0 ? "var(--color-accent)" : "var(--color-bg-elevated)"} stroke={i === 0 ? "var(--color-accent)" : "var(--color-border)"} />
                ))}
                <LabelList dataKey="avgMood" position="top" style={{ fontSize: 12, fill: "var(--color-text-primary)", fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {trainingFinding && <Finding text={trainingFinding} />}
        </SectionCard>
      )}

      {/* Sleep consistency */}
      {stdDevMinutes > 0 && (
        <SectionCard title="Bedtime consistency">
          <div className="flex items-center gap-4">
            <div className="rounded-r4 border border-border bg-bg-elevated p-4 flex flex-col gap-0.5 flex-shrink-0">
              <span className="font-mono text-28 font-semibold" style={{ color: consistencyColor }}>
                ±{stdDevMinutes}m
              </span>
              <span className="text-11 text-text-muted">Variation</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-13 text-text-muted">Average bedtime</span>
                <span className="font-mono text-13 font-semibold text-text-primary">{avgBedtimeStr}</span>
              </div>
              <div className="h-2 rounded-pill bg-bg-elevated overflow-hidden w-48">
                <div
                  className="h-full rounded-pill transition-all"
                  style={{
                    width: `${Math.min(100, (stdDevMinutes / 120) * 100)}%`,
                    background: consistencyColor,
                  }}
                />
              </div>
              <span className="text-11 text-text-disabled">0 = perfect · 120m = high variance</span>
            </div>
          </div>
          {consistencyFinding && <Finding text={consistencyFinding} />}
        </SectionCard>
      )}

      {/* Habit → mood correlations */}
      {topHabitCorrelations.length > 0 && (
        <SectionCard
          title="Habits and mood"
          subtitle="Days you completed each habit vs days you didn't"
        >
          <div className="flex flex-col gap-3">
            {topHabitCorrelations.map((h) => {
              const diff = Math.round((h.avgMoodWith - h.avgMoodWithout) * 10) / 10;
              const positive = diff >= 0;
              return (
                <div key={h.habitName} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-13 font-medium text-text-primary">{h.habitName}</span>
                    <span className={`font-mono text-12 font-semibold ${positive ? "text-[var(--color-success)]" : "text-orange-400"}`}>
                      {positive ? "+" : ""}{diff} mood
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-r3 bg-bg-elevated border border-border px-3 py-2 flex flex-col gap-0.5">
                      <span className="font-mono text-14 font-semibold text-text-primary">{h.avgMoodWith}/5</span>
                      <span className="text-11 text-text-muted">Done ({h.completionDays}d)</span>
                    </div>
                    <div className="rounded-r3 bg-bg-elevated border border-border px-3 py-2 flex flex-col gap-0.5">
                      <span className="font-mono text-14 font-semibold text-text-primary">{h.avgMoodWithout}/5</span>
                      <span className="text-11 text-text-muted">Skipped</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-11 text-text-disabled">These are associations, not causes. Other factors may explain mood differences.</p>
        </SectionCard>
      )}
    </div>
  );
}
