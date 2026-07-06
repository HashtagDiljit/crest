"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Trophy, BarChart2, Clock, Calculator, Pencil, Check } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getExerciseStats, fetchAndCacheExerciseGif, updateExerciseLoggingType } from "../../actions";
import type { ExerciseRow, ExerciseStats } from "../../actions";
import type { LoggingType } from "../../actions";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

const LOGGING_TYPE_OPTIONS: { value: LoggingType; label: string; desc: string }[] = [
  { value: "weight_reps",   label: "Weight + Reps",    desc: "e.g. 80 kg × 8 reps" },
  { value: "time_reps",     label: "Time + Reps",      desc: "e.g. 30 s × 15 reps" },
  { value: "time_distance", label: "Time + Distance",  desc: "e.g. 5 km in 25 min" },
  { value: "time_weight",   label: "Time + Weight",    desc: "e.g. 20 kg for 45 s" },
  { value: "time_floors",   label: "Time + Floors",    desc: "e.g. 10 floors in 3 min" },
];

interface Props {
  exercise: ExerciseRow;
  onClose: () => void;
  onUpdate?: (updated: ExerciseRow) => void;
}

export function ExerciseDetailPanel({ exercise, onClose, onUpdate }: Props) {
  const [stats, setStats]       = useState<ExerciseStats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [gifUrl, setGifUrl]     = useState<string | null>(exercise.demo_gif_url ?? null);
  const [editMode, setEditMode] = useState(false);
  const [selectedType, setSelectedType] = useState<LoggingType>((exercise.logging_type as LoggingType) ?? "weight_reps");
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    setLoading(true);
    setEditMode(false);
    setSelectedType((exercise.logging_type as LoggingType) ?? "weight_reps");
    getExerciseStats(exercise.id).then((s) => {
      setStats(s);
      setLoading(false);
    });
    if (!exercise.demo_gif_url) {
      fetchAndCacheExerciseGif(exercise.id, exercise.name).then((url) => {
        if (url) setGifUrl(url);
      });
    }
  }, [exercise.id, exercise.name, exercise.demo_gif_url, exercise.logging_type]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateExerciseLoggingType(exercise.id, selectedType);
      onUpdate?.({ ...exercise, logging_type: selectedType });
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md flex flex-col bg-bg-surface border-l border-border shadow-2xl overflow-y-auto" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-start justify-between gap-3 flex-shrink-0">
          <div>
            <h2 className="font-display text-20 font-semibold text-text-primary leading-tight">{exercise.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {exercise.muscle_primary && (
                <span className="text-11 px-2 py-0.5 rounded-pill bg-bg-elevated border border-border text-text-secondary capitalize">
                  {exercise.muscle_primary.replace(/_/g, " ")}
                </span>
              )}
              {exercise.equipment && (
                <span className="text-11 px-2 py-0.5 rounded-pill bg-bg-elevated border border-border text-text-muted capitalize">
                  {exercise.equipment}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="w-8 h-8 flex items-center justify-center rounded-r2 hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors"
                title="Edit logging type"
              >
                <Pencil size={15} />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-r2 hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Edit mode — logging type selector */}
        {editMode && (
          <div className="px-6 py-5 border-b border-border flex-shrink-0">
            <p className="text-11 font-semibold uppercase tracking-widest text-text-muted mb-3">Logging type</p>
            <div className="flex flex-col gap-2">
              {LOGGING_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedType(opt.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-r3 border text-left transition-colors ${
                    selectedType === opt.value
                      ? "border-accent bg-accent/10 text-text-primary"
                      : "border-border bg-bg-elevated text-text-secondary hover:bg-bg-overlay"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    selectedType === opt.value ? "border-accent" : "border-border"
                  }`}>
                    {selectedType === opt.value && <div className="w-2 h-2 rounded-full bg-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-13 font-semibold">{opt.label}</p>
                    <p className="text-11 text-text-muted mt-0.5">{opt.desc}</p>
                  </div>
                  {selectedType === opt.value && <Check size={14} className="text-accent flex-shrink-0" />}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-11 rounded-r3 bg-accent hover:bg-accent-hover text-white font-semibold text-14 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setEditMode(false); setSelectedType((exercise.logging_type as LoggingType) ?? "weight_reps"); }}
                className="h-11 px-5 rounded-r3 border border-border text-text-secondary font-medium text-14 transition-colors hover:bg-bg-elevated"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Exercise demonstration GIF */}
        {gifUrl && !editMode && (
          <div className="px-6 py-4 border-b border-border flex flex-col gap-2 flex-shrink-0">
            <p className="text-11 font-semibold uppercase tracking-widest text-text-muted">Demonstration</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gifUrl}
              alt={`${exercise.name} demonstration`}
              className="rounded-r4 w-full max-h-48 object-contain bg-bg-elevated"
              loading="lazy"
            />
          </div>
        )}

        {!editMode && (
          loading ? (
            <div className="flex-1 flex items-center justify-center text-text-muted text-13">Loading…</div>
          ) : !stats || stats.totalSets === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <BarChart2 size={32} className="text-text-disabled" />
              <p className="font-display text-15 font-semibold text-text-primary">No sessions logged yet</p>
              <p className="text-13 text-text-secondary">Start a workout with this exercise to see stats here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 px-6 py-5">
              {/* PR */}
              {stats.pr && (
                <div className="rounded-r4 border border-[var(--color-warning)] bg-[rgba(245,158,11,0.08)] p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Trophy size={16} className="text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-12 font-semibold text-text-muted uppercase tracking-widest mb-1">Personal record</p>
                      <p className="font-mono text-24 font-bold text-text-primary">{stats.pr.weightKg} kg</p>
                      <p className="text-12 text-text-secondary">{stats.pr.reps} reps · set {fmtDate(stats.pr.date)}</p>
                    </div>
                  </div>
                  <Link
                    href={`/tools/1rm?weight=${stats.pr.weightKg}&reps=${stats.pr.reps}&exercise=${encodeURIComponent(exercise.name)}&exerciseId=${exercise.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-r3 border border-border bg-bg-elevated hover:bg-bg-overlay text-12 font-medium text-text-muted hover:text-text-secondary transition-colors flex-shrink-0"
                  >
                    <Calculator size={12} />
                    1RM
                  </Link>
                </div>
              )}

              {/* All-time totals */}
              <div>
                <p className="text-11 font-semibold uppercase tracking-widest text-text-muted mb-3">All-time totals</p>
                <div className="grid grid-cols-3 gap-3">
                  <StatBox label="Sets" value={String(stats.totalSets)} />
                  <StatBox label="Reps" value={String(stats.totalReps)} />
                  <StatBox label="Volume" value={`${stats.totalVolume >= 1000 ? `${(stats.totalVolume / 1000).toFixed(1)}t` : `${stats.totalVolume}kg`}`} />
                </div>
              </div>

              {/* Weight over time chart */}
              {stats.weightOverTime.length > 1 && (
                <div>
                  <p className="text-11 font-semibold uppercase tracking-widest text-text-muted mb-3">Weight over time</p>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.weightOverTime} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <XAxis
                          dataKey="date"
                          tickFormatter={fmtDate}
                          tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(v) => [`${v} kg`, "Top weight"]}
                          labelFormatter={(label) => typeof label === "string" ? fmtDate(label) : ""}
                          contentStyle={{
                            background: "var(--color-bg-elevated)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                            color: "var(--color-text-primary)",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="weight"
                          stroke="var(--color-accent)"
                          strokeWidth={2}
                          dot={{ fill: "var(--color-accent)", r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Last sessions */}
              {stats.lastSessions.length > 0 && (
                <div>
                  <p className="text-11 font-semibold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-1.5">
                    <Clock size={11} />
                    Last {stats.lastSessions.length} sessions
                  </p>
                  <div className="rounded-r4 border border-border overflow-hidden">
                    {stats.lastSessions.map((s, i) => (
                      <div key={i} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                        <span className="text-12 text-text-secondary">{fmtDateShort(s.date)}</span>
                        <div className="flex items-center gap-4 font-mono">
                          <span className="text-11 text-text-muted">{s.setsCount} sets</span>
                          <span className="text-12 font-semibold text-text-primary">{s.topWeight} kg</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-r4 border border-border bg-bg-elevated p-3 text-center">
      <p className="font-mono text-18 font-bold text-text-primary">{value}</p>
      <p className="text-10 text-text-muted uppercase tracking-widest mt-0.5">{label}</p>
    </div>
  );
}
