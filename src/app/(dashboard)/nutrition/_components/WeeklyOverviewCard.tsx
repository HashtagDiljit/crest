"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from "recharts";
import type { NutritionSettings, SupplementLogRow } from "../types";
import type { UserSupplement } from "../supplement-actions";

interface WeeklyTotal { date: string; protein_g: number }

function fmtDay(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short" });
}

function supplementStreak(logs: SupplementLogRow[], name: string): number {
  const dates = logs
    .filter((l) => l.supplement_name === name)
    .map((l) => l.logged_date)
    .sort()
    .reverse();

  if (!dates.length) return 0;

  let streak = 0;
  let cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  for (let i = 0; i < 60; i++) {
    const d = cursor.toISOString().split("T")[0];
    if (dates.includes(d)) {
      streak++;
    } else if (i > 0) {
      break;
    }
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
}

function supplementWeekCount(logs: SupplementLogRow[], name: string): number {
  const since7 = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];
  return logs.filter((l) => l.supplement_name === name && l.logged_date >= since7).length;
}

export function WeeklyOverviewCard({
  weeklyTotals,
  supplementLogs,
  settings,
  userSupplements,
}: {
  weeklyTotals: WeeklyTotal[];
  supplementLogs: SupplementLogRow[];
  settings: NutritionSettings;
  userSupplements?: UserSupplement[];
}) {
  const target = settings.protein_target;
  const daysHit = weeklyTotals.filter((d) => d.protein_g >= target).length;

  const chartData = weeklyTotals.map((d) => ({
    day: fmtDay(d.date),
    protein_g: d.protein_g,
    hit: d.protein_g >= target,
  }));

  const activeSupplements = userSupplements
    ? userSupplements.filter(s => s.enabled).map(s => s.name)
    : Object.entries(settings.supplements).filter(([, on]) => on).map(([name]) => name);

  return (
    <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-16 font-semibold text-text-primary">This week</h2>
        <span className="text-12 text-text-muted">
          Target hit <span className="font-semibold text-text-primary">{daysHit} / 7</span> days
        </span>
      </div>

      {/* Bar chart */}
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: -20 }} barCategoryGap="25%">
            <XAxis
              dataKey="day"
              tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={[0, Math.max(target * 1.2, 20)]}
            />
            <Tooltip
              cursor={{ fill: "var(--color-bg-elevated)" }}
              contentStyle={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(val: any) => [`${val}g protein`, ""]}
              labelStyle={{ color: "var(--color-text-secondary)" }}
            />
            <ReferenceLine
              y={target}
              stroke="var(--color-accent)"
              strokeDasharray="4 3"
              strokeOpacity={0.6}
            />
            <Bar dataKey="protein_g" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.hit ? "var(--color-accent)" : "var(--color-bg-elevated)"}
                  stroke={entry.hit ? "none" : "var(--color-border)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Supplement adherence */}
      {activeSupplements.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-12 font-semibold uppercase tracking-[0.08em] text-text-muted">Supplement adherence (7 days)</h3>
          <div className="flex flex-col gap-2">
            {activeSupplements.map((name) => {
              const count = supplementWeekCount(supplementLogs, name);
              const streak = supplementStreak(supplementLogs, name);
              const pct = Math.round((count / 7) * 100);
              return (
                <div key={name} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-12">
                    <span className="text-text-secondary">{name}</span>
                    <div className="flex items-center gap-2">
                      {streak > 0 && (
                        <span className="text-11 text-text-muted">🔥 {streak}d streak</span>
                      )}
                      <span className="font-semibold text-text-primary">{count}/7</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-pill bg-bg-elevated overflow-hidden">
                    <div
                      className="h-full rounded-pill transition-all"
                      style={{
                        width: `${pct}%`,
                        background: pct === 100 ? "var(--color-success)" : "var(--color-accent)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
