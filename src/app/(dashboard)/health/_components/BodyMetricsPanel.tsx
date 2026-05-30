"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { logBodyweight, logMeasurements, logSteps } from "../actions";
import type { BodyMeasurementRow } from "../actions";

const PRIORITY_FIELDS: Array<{ key: keyof BodyMeasurementRow; label: string }> = [
  { key: "neck_cm", label: "Neck" },
  { key: "forearm_cm", label: "Forearm" },
  { key: "calf_cm", label: "Calf" },
];

const SECONDARY_FIELDS: Array<{ key: keyof BodyMeasurementRow; label: string }> = [
  { key: "chest_cm", label: "Chest" },
  { key: "waist_cm", label: "Waist" },
  { key: "shoulders_cm", label: "Shoulders" },
  { key: "upper_arm_cm", label: "Upper arm" },
];

interface Props {
  measurements: BodyMeasurementRow[];
}

export function BodyMetricsPanel({ measurements }: Props) {
  const router = useRouter();
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showMeasModal, setShowMeasModal] = useState(false);
  const [showStepsModal, setShowStepsModal] = useState(false);

  const latest = measurements[0] ?? null;
  const prev = measurements.find((m, i) => i > 0 && m.weight_kg !== null) ?? null;

  const weightTrend = latest?.weight_kg && prev?.weight_kg
    ? latest.weight_kg - prev.weight_kg
    : null;

  // Weight chart data (last 12 weeks with at least one reading/week)
  const weightPoints = measurements.filter((m) => m.weight_kg !== null).slice(0, 12).reverse();

  return (
    <>
      <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-15 font-semibold text-text-primary">Body metrics</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowStepsModal(true)} className="text-11 text-text-muted hover:text-text-secondary transition-colors px-2.5 py-1 rounded-r3 border border-border bg-bg-elevated">Log steps</button>
            <button onClick={() => setShowMeasModal(true)} className="text-11 text-accent hover:text-accent-hover transition-colors flex items-center gap-1 px-2.5 py-1 rounded-r3 border border-[var(--color-accent-ring)] bg-[var(--color-accent-soft)]">
              <Plus size={11} /> Log measurements
            </button>
          </div>
        </div>

        {/* Bodyweight */}
        <div className="flex items-center gap-4">
          <div>
            <button onClick={() => setShowWeightModal(true)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="font-display text-40 font-bold text-text-primary leading-none">
                {latest?.weight_kg ? `${latest.weight_kg}kg` : "—"}
              </span>
              {weightTrend !== null && (
                <span className={`flex items-center gap-0.5 text-12 font-semibold ${weightTrend > 0 ? "text-warning" : weightTrend < 0 ? "text-success" : "text-text-muted"}`}>
                  {weightTrend > 0 ? <TrendingUp size={14} /> : weightTrend < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                  {weightTrend > 0 ? "+" : ""}{weightTrend.toFixed(1)}kg
                </span>
              )}
            </button>
            <p className="text-11 text-text-muted mt-0.5">{latest?.logged_date ?? "No data"}</p>
          </div>

          {/* Mini sparkline */}
          {weightPoints.length > 1 && (
            <div className="flex-1 h-10">
              <svg viewBox={`0 0 120 40`} width="100%" height="100%" preserveAspectRatio="none">
                <SparklinePath points={weightPoints.map((m, i) => ({ x: (i / (weightPoints.length - 1)) * 120, y: m.weight_kg! }))} svgH={40} />
              </svg>
            </div>
          )}
        </div>

        {/* Steps */}
        {latest?.steps !== null && latest?.steps !== undefined && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-pill bg-bg-elevated overflow-hidden">
              <div className="h-full rounded-pill bg-success" style={{ width: `${Math.min(100, (latest.steps / 10000) * 100)}%` }} />
            </div>
            <span className="font-mono text-12 text-text-primary">{latest.steps.toLocaleString()} steps</span>
            <span className="text-11 text-text-muted">/ 10k</span>
          </div>
        )}

        {/* Priority measurements */}
        <div className="flex flex-col gap-2">
          <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">Priority measurements</span>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITY_FIELDS.map(({ key, label }) => (
              <MeasureTile key={key} label={label} current={latest?.[key] as number | null} prev={prev?.[key] as number | null} />
            ))}
          </div>
        </div>

        {/* Secondary measurements */}
        {latest && (
          <div className="flex flex-col gap-2">
            <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">Other measurements</span>
            <div className="grid grid-cols-4 gap-2">
              {SECONDARY_FIELDS.map(({ key, label }) => (
                <MeasureTile key={key} label={label} current={latest?.[key] as number | null} prev={prev?.[key] as number | null} compact />
              ))}
            </div>
          </div>
        )}
      </div>

      {showWeightModal && <QuickLogModal title="Log bodyweight" label="Weight (kg)" inputName="weight" onClose={() => setShowWeightModal(false)} onSave={async (v) => { await logBodyweight(v); setShowWeightModal(false); router.refresh(); }} />}
      {showStepsModal && <QuickLogModal title="Log steps" label="Steps today" inputName="steps" onClose={() => setShowStepsModal(false)} onSave={async (v) => { await logSteps(v); setShowStepsModal(false); router.refresh(); }} />}
      {showMeasModal && <MeasurementsModal onClose={() => setShowMeasModal(false)} onSaved={() => { setShowMeasModal(false); router.refresh(); }} />}
    </>
  );
}

function MeasureTile({ label, current, prev, compact }: { label: string; current: number | null; prev: number | null; compact?: boolean }) {
  const diff = current !== null && prev !== null ? current - prev : null;
  return (
    <div className={`rounded-r4 border border-border bg-bg-elevated p-3 flex flex-col gap-0.5 ${compact ? "" : ""}`}>
      <span className="text-10 text-text-muted">{label}</span>
      <span className="font-mono text-13 font-semibold text-text-primary">{current ? `${current}cm` : "—"}</span>
      {diff !== null && (
        <span className={`text-10 font-mono ${diff > 0 ? "text-warning" : diff < 0 ? "text-success" : "text-text-muted"}`}>
          {diff > 0 ? "+" : ""}{diff.toFixed(1)}
        </span>
      )}
    </div>
  );
}

function SparklinePath({ points, svgH }: { points: Array<{ x: number; y: number }>; svgH: number }) {
  const yVals = points.map((p) => p.y);
  const minY = Math.min(...yVals);
  const maxY = Math.max(...yVals);
  const mapped = points.map((p) => ({
    x: p.x,
    y: maxY === minY ? svgH / 2 : svgH - ((p.y - minY) / (maxY - minY)) * svgH * 0.9 + svgH * 0.05,
  }));
  const d = mapped.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return <path d={d} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinejoin="round" />;
}

function QuickLogModal({ title, label, inputName, onClose, onSave }: { title: string; label: string; inputName: string; onClose: () => void; onSave: (v: number) => Promise<void> }) {
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);
  async function handle() {
    const n = parseFloat(val);
    if (isNaN(n)) return;
    setSaving(true);
    await onSave(n);
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 w-full max-w-xs rounded-r5 border border-border bg-bg-surface p-6 flex flex-col gap-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-18 font-semibold text-text-primary">{title}</h2>
        <div className="flex flex-col gap-1.5">
          <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">{label}</label>
          <input name={inputName} type="number" step="0.1" value={val} onChange={(e) => setVal(e.target.value)} autoFocus className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary outline-none focus:border-accent transition-colors" />
        </div>
        <button onClick={handle} disabled={saving || !val} className="w-full py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold disabled:opacity-50 transition-colors">{saving ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}

function MeasurementsModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fields = [...PRIORITY_FIELDS, ...SECONDARY_FIELDS, { key: "weight_kg" as const, label: "Bodyweight (kg)" }];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const result = await logMeasurements(new FormData(e.currentTarget));
    if (result.error) { setError(result.error); setSaving(false); }
    else onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="relative z-10 w-full max-w-sm rounded-r5 border border-border bg-bg-surface p-6 flex flex-col gap-4 shadow-2xl my-auto">
        <h2 className="font-display text-18 font-semibold text-text-primary">Log measurements</h2>
        <div className="grid grid-cols-2 gap-3">
          {fields.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-11 text-text-muted">{label}</label>
              <input name={key} type="number" step="0.1" placeholder="—" className="rounded-r3 border border-border bg-bg-base px-3 py-2 text-13 text-text-primary outline-none focus:border-accent transition-colors" />
            </div>
          ))}
        </div>
        {error && <p className="text-13 text-danger">{error}</p>}
        <button type="submit" disabled={saving} className="w-full py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold disabled:opacity-50 transition-colors">{saving ? "Saving…" : "Save measurements"}</button>
      </form>
    </div>
  );
}
