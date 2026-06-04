"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { logBodyweight, logMeasurements, logSteps } from "../actions";
import type { BodyMeasurementRow } from "../actions";
import { InfoTooltip } from "@/components/InfoTooltip";

// ─── types ────────────────────────────────────────────────────────────────────

interface ProfileStats {
  height_cm: number | null;
  date_of_birth: string | null;
  gender: string | null;
}

interface Props {
  measurements: BodyMeasurementRow[];
  profile: ProfileStats | null;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function calcBMI(weight: number | null, heightCm: number | null): number | null {
  if (!weight || !heightCm) return null;
  const h = heightCm / 100;
  return Math.round((weight / (h * h)) * 10) / 10;
}

function bfCategory(bf: number, gender: string | null): string {
  const isMale = gender === "male";
  if (isMale) {
    if (bf < 6) return "Essential";
    if (bf < 14) return "Athletic";
    if (bf < 18) return "Fit";
    if (bf < 25) return "Average";
    return "Above avg";
  }
  if (bf < 14) return "Essential";
  if (bf < 21) return "Athletic";
  if (bf < 25) return "Fit";
  if (bf < 32) return "Average";
  return "Above avg";
}

function bfColor(bf: number, gender: string | null): string {
  const isMale = gender === "male";
  const athletic = isMale ? [6, 13] : [14, 20];
  const fit = isMale ? [14, 17] : [21, 24];
  const avg = isMale ? [18, 24] : [25, 31];
  if (bf >= athletic[0] && bf <= athletic[1]) return "var(--color-success)";
  if (bf >= fit[0] && bf <= fit[1]) return "var(--color-info)";
  if (bf >= avg[0] && bf <= avg[1]) return "var(--color-warning)";
  return "var(--color-danger)";
}

// ─── stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  sub,
  subColor,
  tooltip,
}: {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  tooltip?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3 rounded-r4 border border-border bg-bg-elevated">
      <span className="text-10 font-semibold uppercase tracking-widest text-text-muted flex items-center gap-1">
        {label}
        {tooltip && <InfoTooltip text={tooltip} size={10} />}
      </span>
      <span className="font-mono text-18 font-semibold text-text-primary leading-none">
        {value}
      </span>
      {sub && (
        <span className="text-10 font-medium" style={{ color: subColor ?? "var(--color-text-muted)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

// ─── trend indicator ──────────────────────────────────────────────────────────

function Trend({ diff, unit }: { diff: number | null; unit: string }) {
  if (diff === null) return null;
  const abs = Math.abs(diff).toFixed(1);
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono text-10 ${
        diff > 0 ? "text-warning" : diff < 0 ? "text-success" : "text-text-muted"
      }`}
    >
      {diff > 0 ? <TrendingUp size={10} /> : diff < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
      {diff > 0 ? "+" : "−"}{abs}{unit}
    </span>
  );
}

// ─── sparkline ────────────────────────────────────────────────────────────────

function SparklinePath({
  points,
  svgH,
}: {
  points: Array<{ x: number; y: number }>;
  svgH: number;
}) {
  const yVals = points.map((p) => p.y);
  const minY = Math.min(...yVals);
  const maxY = Math.max(...yVals);
  const mapped = points.map((p) => ({
    x: p.x,
    y:
      maxY === minY
        ? svgH / 2
        : svgH - ((p.y - minY) / (maxY - minY)) * svgH * 0.9 + svgH * 0.05,
  }));
  const d = mapped.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return (
    <path
      d={d}
      fill="none"
      stroke="var(--color-accent)"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  );
}

// ─── measurements history table ───────────────────────────────────────────────

const COL_FIELDS: Array<{ key: keyof BodyMeasurementRow; label: string; unit: string }> = [
  { key: "neck_cm", label: "Neck", unit: "cm" },
  { key: "chest_cm", label: "Chest", unit: "cm" },
  { key: "waist_cm", label: "Waist", unit: "cm" },
  { key: "hip_cm", label: "Hip", unit: "cm" },
  { key: "shoulders_cm", label: "Shoulders", unit: "cm" },
  { key: "upper_arm_cm", label: "Arm", unit: "cm" },
  { key: "forearm_cm", label: "Forearm", unit: "cm" },
  { key: "calf_cm", label: "Calf", unit: "cm" },
  { key: "bf_percentage", label: "Body fat", unit: "%" },
];

function MeasurementsTable({
  measurements,
}: {
  measurements: BodyMeasurementRow[];
}) {
  const rows = measurements.filter((m) =>
    COL_FIELDS.some((f) => m[f.key] !== null)
  );
  if (!rows.length) return null;

  // Only show columns that have at least one value
  const activeCols = COL_FIELDS.filter((f) =>
    rows.some((r) => r[f.key] !== null)
  );

  return (
    <div className="flex flex-col gap-2">
      <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">
        Measurement history
      </span>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-12 border-collapse min-w-[480px]">
          <thead>
            <tr>
              <th className="text-left font-semibold text-text-muted px-2 py-1.5 border-b border-border">
                Date
              </th>
              {activeCols.map((c) => (
                <th
                  key={c.key}
                  className="text-right font-semibold text-text-muted px-2 py-1.5 border-b border-border whitespace-nowrap"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const prev = rows[ri + 1] ?? null;
              return (
                <tr key={row.id} className="border-b border-border/50 hover:bg-bg-elevated/50 transition-colors">
                  <td className="px-2 py-2 text-text-muted font-mono">{row.logged_date}</td>
                  {activeCols.map((col) => {
                    const val = row[col.key] as number | null;
                    const prevVal = prev ? (prev[col.key] as number | null) : null;
                    const diff = val !== null && prevVal !== null ? val - prevVal : null;
                    return (
                      <td key={col.key} className="px-2 py-2 text-right">
                        {val !== null ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="font-mono text-text-primary">
                              {val.toFixed(1)}{col.unit}
                            </span>
                            <Trend diff={diff} unit={col.unit} />
                          </div>
                        ) : (
                          <span className="text-text-disabled">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── modals ───────────────────────────────────────────────────────────────────

function QuickLogModal({
  title,
  label,
  inputName,
  onClose,
  onSave,
}: {
  title: string;
  label: string;
  inputName: string;
  onClose: () => void;
  onSave: (v: number) => Promise<void>;
}) {
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
      <div
        className="relative z-10 w-full max-w-xs rounded-r5 border border-border bg-bg-surface p-6 flex flex-col gap-4"
        style={{ boxShadow: "var(--shadow-3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-18 font-semibold text-text-primary">{title}</h2>
        <div className="flex flex-col gap-1.5">
          <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">
            {label}
          </label>
          <input
            name={inputName}
            type="number"
            step="0.1"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            autoFocus
            className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary outline-none focus:border-accent transition-colors"
          />
        </div>
        <button
          onClick={handle}
          disabled={saving || !val}
          className="w-full py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

const MEAS_FIELDS: Array<{ key: string; label: string }> = [
  { key: "neck_cm", label: "Neck (cm)" },
  { key: "chest_cm", label: "Chest (cm)" },
  { key: "waist_cm", label: "Waist (cm)" },
  { key: "hip_cm", label: "Hip (cm)" },
  { key: "shoulders_cm", label: "Shoulders (cm)" },
  { key: "upper_arm_cm", label: "Upper arm (cm)" },
  { key: "forearm_cm", label: "Forearm (cm)" },
  { key: "calf_cm", label: "Calf (cm)" },
  { key: "weight_kg", label: "Bodyweight (kg)" },
];

function MeasurementsModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const result = await logMeasurements(new FormData(e.currentTarget));
    if (result.error) {
      setError(result.error);
      setSaving(false);
    } else {
      onSaved();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-sm rounded-r5 border border-border bg-bg-surface p-6 flex flex-col gap-4 my-auto"
        style={{ boxShadow: "var(--shadow-3)" }}
      >
        <h2 className="font-display text-18 font-semibold text-text-primary">
          Log measurements
        </h2>
        <p className="text-12 text-text-muted -mt-2">
          Waist + neck (+ hip for females) auto-calculates body fat % via the US Navy method.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {MEAS_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-11 text-text-muted">{label}</label>
              <input
                name={key}
                type="number"
                step="0.1"
                placeholder="—"
                className="rounded-r3 border border-border bg-bg-base px-3 py-2 text-13 text-text-primary outline-none focus:border-accent transition-colors"
              />
            </div>
          ))}
        </div>
        {error && <p className="text-13 text-danger">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save measurements"}
        </button>
      </form>
    </div>
  );
}

// ─── body fat trend sparkline ─────────────────────────────────────────────────

function BFTrend({ measurements }: { measurements: BodyMeasurementRow[] }) {
  const bfData = measurements
    .filter((m) => m.bf_percentage !== null)
    .slice(0, 12)
    .reverse();

  if (bfData.length < 2) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">
        Body fat trend
      </span>
      <div className="h-12 w-full">
        <svg
          viewBox="0 0 200 48"
          width="100%"
          height="100%"
          preserveAspectRatio="none"
        >
          <SparklinePath
            points={bfData.map((m, i) => ({
              x: (i / (bfData.length - 1)) * 200,
              y: m.bf_percentage!,
            }))}
            svgH={48}
          />
        </svg>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function BodyMetricsPanel({ measurements, profile }: Props) {
  const router = useRouter();
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showMeasModal, setShowMeasModal] = useState(false);
  const [showStepsModal, setShowStepsModal] = useState(false);

  const latest = measurements[0] ?? null;
  const prev = measurements.find((m, i) => i > 0 && m.weight_kg !== null) ?? null;
  const weightTrend =
    latest?.weight_kg && prev?.weight_kg
      ? latest.weight_kg - prev.weight_kg
      : null;

  const weightPoints = measurements
    .filter((m) => m.weight_kg !== null)
    .slice(0, 12)
    .reverse();

  const age = calcAge(profile?.date_of_birth ?? null);
  const bmi = calcBMI(latest?.weight_kg ?? null, profile?.height_cm ?? null);
  const bf = latest?.bf_percentage ?? null;
  const leanMass =
    latest?.weight_kg && bf !== null
      ? Math.round(latest.weight_kg * (1 - bf / 100) * 10) / 10
      : null;

  return (
    <>
      <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-display text-15 font-semibold text-text-primary">
            Body metrics
          </h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowStepsModal(true)}
              className="text-11 text-text-muted hover:text-text-secondary transition-colors px-2.5 py-1 rounded-r3 border border-border bg-bg-elevated"
            >
              Log steps
            </button>
            <button
              onClick={() => setShowWeightModal(true)}
              className="text-11 text-text-muted hover:text-text-secondary transition-colors px-2.5 py-1 rounded-r3 border border-border bg-bg-elevated"
            >
              Log weight
            </button>
            <button
              onClick={() => setShowMeasModal(true)}
              className="text-11 text-accent hover:text-accent-hover transition-colors flex items-center gap-1 px-2.5 py-1 rounded-r3 border border-[var(--color-accent-ring)] bg-[var(--color-accent-soft)]"
            >
              <Plus size={11} /> Log measurements
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <StatTile
            label="Height"
            value={profile?.height_cm ? `${profile.height_cm} cm` : "—"}
          />
          <div className="flex flex-col gap-0.5 px-4 py-3 rounded-r4 border border-border bg-bg-elevated">
            <span className="text-10 font-semibold uppercase tracking-widest text-text-muted">
              Weight
            </span>
            <div className="flex items-baseline gap-1.5">
              <button
                onClick={() => setShowWeightModal(true)}
                className="font-mono text-18 font-semibold text-text-primary leading-none hover:text-accent transition-colors"
              >
                {latest?.weight_kg ? `${latest.weight_kg} kg` : "—"}
              </button>
              {weightTrend !== null && (
                <Trend diff={weightTrend} unit="kg" />
              )}
            </div>
          </div>
          <StatTile
            label="BMI"
            value={bmi ? String(bmi) : "—"}
            sub={
              bmi
                ? bmi < 18.5
                  ? "Underweight"
                  : bmi < 25
                  ? "Normal"
                  : bmi < 30
                  ? "Overweight"
                  : "Obese"
                : undefined
            }
          />
          <StatTile
            label="Est. body fat"
            value={bf !== null ? `${bf.toFixed(1)}%` : "—"}
            sub={
              bf !== null && profile?.gender
                ? bfCategory(bf, profile.gender)
                : undefined
            }
            subColor={
              bf !== null && profile?.gender
                ? bfColor(bf, profile.gender)
                : undefined
            }
            tooltip="Estimated using the US Navy tape method. This is a trend indicator, not a clinical measurement — accuracy ±3–4%."
          />
          <StatTile label="Age" value={age !== null ? `${age} yrs` : "—"} />
        </div>

        {/* Lean mass + steps if available */}
        {(leanMass !== null || (latest?.steps !== null && latest?.steps !== undefined)) && (
          <div className="flex flex-wrap gap-3">
            {leanMass !== null && (
              <div className="flex items-center gap-2">
                <span className="text-11 text-text-muted">Lean mass</span>
                <span className="font-mono text-13 font-semibold text-text-primary">
                  {leanMass} kg
                </span>
              </div>
            )}
            {latest?.steps !== null && latest?.steps !== undefined && (
              <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                <div className="flex-1 h-1.5 rounded-pill bg-bg-elevated overflow-hidden">
                  <div
                    className="h-full rounded-pill bg-success"
                    style={{ width: `${Math.min(100, (latest.steps / 10000) * 100)}%` }}
                  />
                </div>
                <span className="font-mono text-12 text-text-primary">
                  {latest.steps.toLocaleString()} steps
                </span>
                <span className="text-11 text-text-muted">/ 10k</span>
              </div>
            )}
          </div>
        )}

        {/* Weight sparkline */}
        {weightPoints.length > 1 && (
          <div className="h-10 -mt-2">
            <svg
              viewBox="0 0 120 40"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
            >
              <SparklinePath
                points={weightPoints.map((m, i) => ({
                  x: (i / (weightPoints.length - 1)) * 120,
                  y: m.weight_kg!,
                }))}
                svgH={40}
              />
            </svg>
          </div>
        )}

        {/* Body fat trend */}
        <BFTrend measurements={measurements} />

        {/* Measurements history table */}
        <MeasurementsTable measurements={measurements} />
      </div>

      {showWeightModal && (
        <QuickLogModal
          title="Log bodyweight"
          label="Weight (kg)"
          inputName="weight"
          onClose={() => setShowWeightModal(false)}
          onSave={async (v) => {
            await logBodyweight(v);
            setShowWeightModal(false);
            router.refresh();
          }}
        />
      )}
      {showStepsModal && (
        <QuickLogModal
          title="Log steps"
          label="Steps today"
          inputName="steps"
          onClose={() => setShowStepsModal(false)}
          onSave={async (v) => {
            await logSteps(v);
            setShowStepsModal(false);
            router.refresh();
          }}
        />
      )}
      {showMeasModal && (
        <MeasurementsModal
          onClose={() => setShowMeasModal(false)}
          onSaved={() => {
            setShowMeasModal(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
