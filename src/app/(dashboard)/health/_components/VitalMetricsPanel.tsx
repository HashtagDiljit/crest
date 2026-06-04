"use client";

import { useState } from "react";
import { Activity, ChevronDown, ChevronUp, Wind, Thermometer, Hand, Heart } from "lucide-react";
import { logHealthMetric } from "../actions";
import type { MetricRow, VitalMetricRow } from "../actions";

interface Props {
  bpMetrics: VitalMetricRow[];
  gripMetrics: MetricRow[];
  tempMetrics: MetricRow[];
  respMetrics: MetricRow[];
  gutMetrics: MetricRow[];
}

function FieldRow({ label, value, unit, children }: { label: string; value: string | null; unit?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-13 text-text-secondary">{label}</span>
      <div className="flex items-center gap-2">
        {value !== null ? (
          <span className="text-13 font-semibold text-text-primary tabular-nums">{value}{unit ? <span className="text-11 font-normal text-text-muted ml-0.5">{unit}</span> : null}</span>
        ) : (
          <span className="text-12 text-text-disabled">—</span>
        )}
        {children}
      </div>
    </div>
  );
}

const GUT_LABELS = ["—", "Excellent", "Good", "Fair", "Poor", "Bad"];
const GUT_COLOURS = ["", "var(--color-success)", "var(--color-success)", "var(--color-warning)", "var(--color-error)", "var(--color-error)"];

const HYDRATION_LABELS = ["", "Pale yellow", "Light yellow", "Yellow", "Dark yellow", "Amber"];

function bpCategory(sys: number, dia: number): { label: string; color: string } {
  if (sys < 120 && dia < 80) return { label: "Optimal", color: "var(--color-success)" };
  if (sys < 130 && dia < 80) return { label: "Elevated", color: "var(--color-warning)" };
  if (sys < 140 || dia < 90) return { label: "High stage 1", color: "var(--color-warning)" };
  return { label: "High stage 2", color: "var(--color-error)" };
}

export function VitalMetricsPanel({ bpMetrics, gripMetrics, tempMetrics, respMetrics, gutMetrics }: Props) {
  const [open, setOpen] = useState(false);
  const [logOpen, setLogOpen] = useState<string | null>(null);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [bp, setBp] = useState({ sys: "", dia: "" });
  const [grip, setGrip] = useState("");
  const [temp, setTemp] = useState("");
  const [resp, setResp] = useState("");
  const [gut, setGut] = useState("3");
  const [hydration, setHydration] = useState("2");

  const latestBpSys = bpMetrics.find((m) => m.metric_type === "bp_systolic")?.value ?? null;
  const latestBpDia = bpMetrics.find((m) => m.metric_type === "bp_diastolic")?.value ?? null;
  const latestGrip = gripMetrics[0]?.value ?? null;
  const latestTemp = tempMetrics[0]?.value ?? null;
  const latestResp = respMetrics[0]?.value ?? null;
  const latestGut = gutMetrics[0]?.value ?? null;

  async function save(type: string) {
    setSaving(true);
    try {
      if (type === "bp") {
        const sys = parseFloat(bp.sys);
        const dia = parseFloat(bp.dia);
        if (!isNaN(sys) && !isNaN(dia)) {
          await logHealthMetric("bp_systolic", sys, "mmHg");
          await logHealthMetric("bp_diastolic", dia, "mmHg");
        }
      } else if (type === "grip") {
        const v = parseFloat(grip);
        if (!isNaN(v)) await logHealthMetric("grip_strength_kg", v, "kg");
      } else if (type === "temp") {
        const v = parseFloat(temp);
        if (!isNaN(v)) await logHealthMetric("body_temp_c", v, "°C");
      } else if (type === "resp") {
        const v = parseFloat(resp);
        if (!isNaN(v)) await logHealthMetric("respiratory_rate", v, "bpm");
      } else if (type === "gut") {
        await logHealthMetric("gut_score", parseInt(gut));
        await logHealthMetric("hydration_colour", parseInt(hydration));
      }
    } finally {
      setSaving(false);
      setLogOpen(null);
    }
  }

  return (
    <div className="rounded-r5 border border-border bg-bg-surface overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-bg-elevated transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Activity size={16} className="text-text-muted" />
          <span className="font-display text-15 font-semibold text-text-primary">Vital metrics</span>
          {latestBpSys && latestBpDia && (
            <span className="text-12 text-text-muted ml-1">{latestBpSys}/{latestBpDia} mmHg</span>
          )}
        </div>
        {open ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
      </button>

      {open && (
        <div className="px-5 pb-5 flex flex-col gap-4">
          {/* Blood pressure */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Heart size={13} className="text-text-muted" />
                <span className="text-12 font-semibold text-text-muted uppercase tracking-widest">Blood pressure</span>
              </div>
              <button onClick={() => setLogOpen(logOpen === "bp" ? null : "bp")} className="text-11 text-accent hover:text-accent-hover transition-colors">Log</button>
            </div>
            <FieldRow
              label="Latest reading"
              value={latestBpSys && latestBpDia ? `${latestBpSys}/${latestBpDia}` : null}
              unit={latestBpSys ? "mmHg" : undefined}
            >
              {latestBpSys && latestBpDia && (
                <span className="text-11 font-medium px-2 py-0.5 rounded-pill" style={{ color: bpCategory(latestBpSys, latestBpDia).color, background: "var(--color-bg-elevated)" }}>
                  {bpCategory(latestBpSys, latestBpDia).label}
                </span>
              )}
            </FieldRow>
            {logOpen === "bp" && (
              <div className="mt-2 flex gap-2 items-end">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-10 text-text-muted uppercase tracking-widest">Systolic</label>
                  <input type="number" value={bp.sys} onChange={(e) => setBp({ ...bp, sys: e.target.value })} placeholder="120" className="rounded-r3 border border-border bg-bg-base px-3 py-2 text-13 text-text-primary outline-none focus:border-accent" />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-10 text-text-muted uppercase tracking-widest">Diastolic</label>
                  <input type="number" value={bp.dia} onChange={(e) => setBp({ ...bp, dia: e.target.value })} placeholder="80" className="rounded-r3 border border-border bg-bg-base px-3 py-2 text-13 text-text-primary outline-none focus:border-accent" />
                </div>
                <button onClick={() => save("bp")} disabled={saving} className="px-3 py-2 rounded-r3 bg-accent text-white text-12 font-semibold transition-colors disabled:opacity-50">Save</button>
              </div>
            )}
          </div>

          {/* Grip strength */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Hand size={13} className="text-text-muted" />
                <span className="text-12 font-semibold text-text-muted uppercase tracking-widest">Grip strength</span>
              </div>
              <button onClick={() => setLogOpen(logOpen === "grip" ? null : "grip")} className="text-11 text-accent hover:text-accent-hover transition-colors">Log</button>
            </div>
            <FieldRow label="Latest" value={latestGrip !== null ? String(latestGrip) : null} unit="kg" />
            <p className="text-11 text-text-disabled mt-0.5">Measured with a hand dynamometer. Strong grip correlates with all-cause longevity.</p>
            {logOpen === "grip" && (
              <div className="mt-2 flex gap-2">
                <input type="number" step="0.5" value={grip} onChange={(e) => setGrip(e.target.value)} placeholder="40" className="flex-1 rounded-r3 border border-border bg-bg-base px-3 py-2 text-13 text-text-primary outline-none focus:border-accent" />
                <span className="flex items-center text-13 text-text-muted">kg</span>
                <button onClick={() => save("grip")} disabled={saving} className="px-3 py-2 rounded-r3 bg-accent text-white text-12 font-semibold transition-colors disabled:opacity-50">Save</button>
              </div>
            )}
          </div>

          {/* Body temperature */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Thermometer size={13} className="text-text-muted" />
                <span className="text-12 font-semibold text-text-muted uppercase tracking-widest">Body temperature</span>
              </div>
              <button onClick={() => setLogOpen(logOpen === "temp" ? null : "temp")} className="text-11 text-accent hover:text-accent-hover transition-colors">Log</button>
            </div>
            <FieldRow label="Latest" value={latestTemp !== null ? String(latestTemp) : null} unit="°C" />
            <p className="text-11 text-text-disabled mt-0.5">Normal range 36.1–37.2°C. Trends more useful than single readings.</p>
            {logOpen === "temp" && (
              <div className="mt-2 flex gap-2">
                <input type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="36.6" className="flex-1 rounded-r3 border border-border bg-bg-base px-3 py-2 text-13 text-text-primary outline-none focus:border-accent" />
                <span className="flex items-center text-13 text-text-muted">°C</span>
                <button onClick={() => save("temp")} disabled={saving} className="px-3 py-2 rounded-r3 bg-accent text-white text-12 font-semibold transition-colors disabled:opacity-50">Save</button>
              </div>
            )}
          </div>

          {/* Respiratory rate */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Wind size={13} className="text-text-muted" />
                <span className="text-12 font-semibold text-text-muted uppercase tracking-widest">Respiratory rate</span>
              </div>
              <button onClick={() => setLogOpen(logOpen === "resp" ? null : "resp")} className="text-11 text-accent hover:text-accent-hover transition-colors">Log</button>
            </div>
            <FieldRow label="Breaths / min" value={latestResp !== null ? String(latestResp) : null} unit="bpm" />
            <p className="text-11 text-text-disabled mt-0.5">Count breaths for 60s at rest. Normal: 12–20. Elevated may signal stress or illness.</p>
            {logOpen === "resp" && (
              <div className="mt-2 flex gap-2">
                <input type="number" value={resp} onChange={(e) => setResp(e.target.value)} placeholder="14" className="flex-1 rounded-r3 border border-border bg-bg-base px-3 py-2 text-13 text-text-primary outline-none focus:border-accent" />
                <span className="flex items-center text-13 text-text-muted">bpm</span>
                <button onClick={() => save("resp")} disabled={saving} className="px-3 py-2 rounded-r3 bg-accent text-white text-12 font-semibold transition-colors disabled:opacity-50">Save</button>
              </div>
            )}
          </div>

          {/* Gut health */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-12 font-semibold text-text-muted uppercase tracking-widest">Gut health</span>
              <button onClick={() => setLogOpen(logOpen === "gut" ? null : "gut")} className="text-11 text-accent hover:text-accent-hover transition-colors">Log</button>
            </div>
            <FieldRow label="Gut comfort score" value={latestGut !== null ? GUT_LABELS[latestGut] : null}>
              {latestGut !== null && (
                <span className="w-2 h-2 rounded-full" style={{ background: GUT_COLOURS[latestGut] }} />
              )}
            </FieldRow>
            {logOpen === "gut" && (
              <div className="mt-2 flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-11 text-text-muted uppercase tracking-widest">Gut comfort (1 = excellent, 5 = bad)</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setGut(String(v))}
                        className={`flex-1 py-1.5 rounded-r3 border text-12 font-semibold transition-colors ${gut === String(v) ? "bg-accent text-white border-accent" : "border-border text-text-secondary hover:bg-bg-elevated"}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-11 text-text-muted uppercase tracking-widest">Urine colour (1 = pale, 5 = dark amber)</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setHydration(String(v))}
                        title={HYDRATION_LABELS[v]}
                        className={`flex-1 py-1.5 rounded-r3 border text-12 font-semibold transition-colors ${hydration === String(v) ? "bg-accent text-white border-accent" : "border-border text-text-secondary hover:bg-bg-elevated"}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <p className="text-10 text-text-disabled">Target: 1–2 (well-hydrated)</p>
                </div>
                <button onClick={() => save("gut")} disabled={saving} className="w-full py-2 rounded-r3 bg-accent text-white text-12 font-semibold transition-colors disabled:opacity-50">Save</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
