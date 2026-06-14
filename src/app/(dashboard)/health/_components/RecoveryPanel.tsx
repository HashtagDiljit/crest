"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus, Heart, Activity } from "lucide-react";
import { logReadiness, logSoreness, logHealthMetric } from "../actions";
import type { ReadinessRow, MetricRow } from "../actions";
import { InfoTooltip } from "@/components/InfoTooltip";

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
  const [logMetric, setLogMetric] = useState<"hrv" | "resting_hr" | null>(null);
  const [hrvValue, setHrvValue] = useState("");
  const [hrValue, setHrValue] = useState("");
  const [savingMetric, setSavingMetric] = useState(false);

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

  async function saveMetric(type: "hrv" | "resting_hr") {
    const raw = type === "hrv" ? hrvValue : hrValue;
    const v = parseFloat(raw);
    if (isNaN(v)) return;
    setSavingMetric(true);
    try {
      await logHealthMetric(type, v, type === "hrv" ? "ms" : "bpm");
      if (type === "hrv") setHrvValue(""); else setHrValue("");
      setLogMetric(null);
      router.refresh();
    } finally {
      setSavingMetric(false);
    }
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
        <span className="text-12 font-semibold text-text-muted uppercase tracking-widest flex items-center gap-1">Morning readiness <InfoTooltip text="Your subjective readiness score (1–10). Self-reported — how recovered and energised you feel this morning." /></span>
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
      <div className="grid grid-cols-2 gap-3">
        {hrvMetrics.length > 0 ? (
          <MiniLineChart label="HRV (7d)" data={hrvMetrics} unit="ms" />
        ) : (
          <EmptyMetricCard
            icon={<Activity size={13} className="text-text-muted" />}
            label="HRV (7d)"
            promptLabel="Log your first HRV reading"
            open={logMetric === "hrv"}
            onToggle={() => setLogMetric(logMetric === "hrv" ? null : "hrv")}
            value={hrvValue}
            onChange={setHrvValue}
            onSave={() => saveMetric("hrv")}
            saving={savingMetric}
            unit="ms"
            placeholder="55"
          />
        )}
        {hrMetrics.length > 0 ? (
          <MiniLineChart label="Resting HR (7d)" data={hrMetrics} unit="bpm" />
        ) : (
          <EmptyMetricCard
            icon={<Heart size={13} className="text-text-muted" />}
            label="Resting HR (7d)"
            promptLabel="Log your first heart rate reading"
            open={logMetric === "resting_hr"}
            onToggle={() => setLogMetric(logMetric === "resting_hr" ? null : "resting_hr")}
            value={hrValue}
            onChange={setHrValue}
            onSave={() => saveMetric("resting_hr")}
            saving={savingMetric}
            unit="bpm"
            placeholder="60"
          />
        )}
      </div>
    </div>
  );
}

function EmptyMetricCard({
  icon,
  label,
  promptLabel,
  open,
  onToggle,
  value,
  onChange,
  onSave,
  saving,
  unit,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  promptLabel: string;
  open: boolean;
  onToggle: () => void;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  unit: string;
  placeholder: string;
}) {
  return (
    <div className="rounded-r4 border border-border bg-bg-elevated p-3 flex flex-col gap-2">
      <span className="text-11 font-mono text-text-muted flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      {open ? (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="number"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              autoFocus
              className="flex-1 w-0 rounded-r3 border border-border bg-bg-base px-2.5 py-1.5 text-13 text-text-primary outline-none focus:border-accent"
            />
            <span className="flex items-center text-12 text-text-muted">{unit}</span>
          </div>
          <button
            onClick={onSave}
            disabled={saving || !value}
            className="w-full py-1.5 rounded-r3 bg-accent text-white text-12 font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      ) : (
        <button
          onClick={onToggle}
          className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 text-center group"
        >
          <span className="w-6 h-6 rounded-full bg-bg-overlay flex items-center justify-center text-text-muted group-hover:text-accent group-hover:border-accent border border-border transition-colors">
            <Plus size={13} />
          </span>
          <span className="text-11 text-text-muted group-hover:text-text-secondary transition-colors">{promptLabel}</span>
        </button>
      )}
    </div>
  );
}

const METRIC_TOOLTIPS: Record<string, string> = {
  "HRV (7d)": "Heart Rate Variability — higher values generally indicate better recovery. Varies widely between individuals; track your own trend, not absolute numbers.",
  "Resting HR (7d)": "Resting heart rate measured at rest. Lower is generally better for aerobic fitness, though normal range is 60–100 bpm.",
};

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
      <span className="text-11 font-mono text-text-muted flex items-center gap-1">
        {label}
        {METRIC_TOOLTIPS[label] && <InfoTooltip text={METRIC_TOOLTIPS[label]} size={10} />}
      </span>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
        <polyline points={points} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <span className="font-mono text-14 font-semibold text-text-primary">{vals[vals.length - 1]} {unit}</span>
    </div>
  );
}
