"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { logReadiness, logSoreness } from "../actions";
import type { ReadinessRow, MetricRow } from "../actions";

const MUSCLE_GROUPS = ["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "core"];
const SEVERITY_OPTIONS = ["none", "mild", "moderate", "severe"] as const;
const SEVERITY_COLORS: Record<string, string> = {
  none: "var(--color-bg-elevated)",
  mild: "var(--color-warning)",
  moderate: "var(--color-streak)",
  severe: "var(--color-danger)",
};

interface Props {
  readinessLogs: ReadinessRow[];
  hrvMetrics: MetricRow[];
  hrMetrics: MetricRow[];
  todaySoreness: Array<{ muscle_group: string; severity: string }>;
}

export function RecoveryPanel({ readinessLogs, hrvMetrics, hrMetrics, todaySoreness }: Props) {
  const router = useRouter();
  const [readinessScore, setReadinessScore] = useState<number | null>(null);
  const [readinessNote, setReadinessNote] = useState("");
  const [savingReadiness, setSavingReadiness] = useState(false);
  const [sorenessMap, setSorenessMap] = useState<Record<string, string>>(
    Object.fromEntries(todaySoreness.map((s) => [s.muscle_group, s.severity]))
  );

  const todayReadiness = readinessLogs[0];
  const low2Days = readinessLogs.length >= 2 && readinessLogs[0].score < 6 && readinessLogs[1].score < 6;

  async function saveReadiness() {
    if (!readinessScore) return;
    setSavingReadiness(true);
    await logReadiness(readinessScore, readinessNote);
    setSavingReadiness(false);
    router.refresh();
  }

  async function handleSoreness(muscle: string, severity: string) {
    setSorenessMap((prev) => ({ ...prev, [muscle]: severity }));
    await logSoreness(muscle, severity);
    router.refresh();
  }

  return (
    <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-5">
      <h2 className="font-display text-15 font-semibold text-text-primary">Recovery</h2>

      {low2Days && (
        <div className="rounded-r4 border border-warning bg-[rgba(245,158,11,0.08)] px-4 py-3 flex items-start gap-2">
          <AlertTriangle size={14} className="text-warning flex-shrink-0 mt-0.5" />
          <p className="text-12 text-text-secondary">Readiness below 6 for 2 consecutive days — consider reducing session intensity today.</p>
        </div>
      )}

      {/* Readiness */}
      <div className="flex flex-col gap-2">
        <span className="text-12 font-semibold text-text-muted uppercase tracking-widest">Morning readiness</span>
        {todayReadiness ? (
          <div className="flex items-center gap-3">
            <span className="font-mono text-32 font-bold" style={{ color: todayReadiness.score >= 7 ? "var(--color-success)" : todayReadiness.score >= 5 ? "var(--color-warning)" : "var(--color-danger)" }}>{todayReadiness.score}</span>
            <span className="text-12 text-text-secondary">/10 · {todayReadiness.note ?? "No note"}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex gap-1">
              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                <button key={n} onClick={() => setReadinessScore(n)} className={`flex-1 h-8 rounded-r2 text-11 font-mono font-semibold transition-colors border ${readinessScore === n ? "bg-accent text-white border-accent" : "bg-bg-elevated border-border text-text-muted hover:border-border-strong"}`}>{n}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={readinessNote} onChange={(e) => setReadinessNote(e.target.value)} placeholder="Optional note…" className="flex-1 rounded-r3 border border-border bg-bg-base px-3 py-2 text-12 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors" />
              <button onClick={saveReadiness} disabled={!readinessScore || savingReadiness} className="px-4 py-2 rounded-r3 bg-accent text-white text-12 font-semibold disabled:opacity-40 transition-colors">{savingReadiness ? "…" : "Log"}</button>
            </div>
          </div>
        )}
      </div>

      {/* Soreness */}
      <div className="flex flex-col gap-2">
        <span className="text-12 font-semibold text-text-muted uppercase tracking-widest">Soreness</span>
        <div className="grid grid-cols-2 gap-1.5">
          {MUSCLE_GROUPS.map((muscle) => {
            const current = sorenessMap[muscle] ?? "none";
            return (
              <div key={muscle} className="flex items-center gap-2 rounded-r3 border border-border bg-bg-elevated px-3 py-2">
                <span className="text-12 text-text-secondary capitalize flex-1">{muscle}</span>
                <div className="flex gap-1">
                  {SEVERITY_OPTIONS.map((sev) => (
                    <button
                      key={sev}
                      onClick={() => handleSoreness(muscle, sev)}
                      title={sev}
                      className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${current === sev ? "border-transparent scale-110" : "border-border"}`}
                      style={{ background: current === sev ? SEVERITY_COLORS[sev] : "var(--color-bg-overlay)" }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-10 text-text-disabled">Dots: none · mild · moderate · severe</p>
      </div>

      {/* HRV & HR mini charts */}
      {(hrvMetrics.length > 0 || hrMetrics.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {hrvMetrics.length > 0 && <MiniLineChart label="HRV (7d)" data={hrvMetrics} unit="ms" />}
          {hrMetrics.length > 0 && <MiniLineChart label="Resting HR (7d)" data={hrMetrics} unit="bpm" />}
        </div>
      )}
    </div>
  );
}

function MiniLineChart({ label, data, unit }: { label: string; data: MetricRow[]; unit: string }) {
  const sorted = [...data].sort((a, b) => a.logged_date.localeCompare(b.logged_date));
  const vals = sorted.map((d) => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const W = 180; const H = 60;
  const points = sorted.map((d, i) => {
    const x = (i / Math.max(sorted.length - 1, 1)) * W;
    const y = max === min ? H / 2 : H - ((d.value - min) / (max - min)) * H;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="rounded-r4 border border-border bg-bg-elevated p-3 flex flex-col gap-2">
      <span className="text-11 font-mono text-text-muted">{label}</span>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
        <polyline points={points} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <span className="font-mono text-14 font-semibold text-text-primary">{vals[vals.length - 1]} {unit}</span>
    </div>
  );
}
