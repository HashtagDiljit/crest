"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Plus, X, Dumbbell, Loader2, Pencil, Check, Trash2 } from "lucide-react";
import {
  createCustomExercise,
  updateCustomExercise,
  updateExerciseLoggingType,
  deleteCustomExercise,
  getExerciseStats,
} from "../../actions";
import type { ExerciseRow, ExerciseStats } from "../../actions";
import type { LoggingType } from "../../actions";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";

const MUSCLE_FILTERS: Array<{ label: string; values: string[] | null }> = [
  { label: "All", values: null },
  { label: "Back", values: ["back"] },
  { label: "Chest", values: ["chest"] },
  { label: "Shoulders", values: ["shoulders"] },
  { label: "Arms", values: ["biceps", "triceps", "forearms"] },
  { label: "Legs", values: ["quadriceps", "quads", "hamstrings", "glutes", "calves"] },
  { label: "Core", values: ["core"] },
  { label: "Cardio", values: ["cardio"] },
  { label: "Olympic", values: ["olympic"] },
  { label: "Full Body", values: ["full_body"] },
  { label: "Neck", values: ["neck"] },
];

const MUSCLE_GROUPS: Array<{ label: string; slug: string; values: string[] }> = [
  { label: "Back", slug: "back", values: ["back"] },
  { label: "Chest", slug: "chest", values: ["chest"] },
  { label: "Shoulders", slug: "shoulders", values: ["shoulders"] },
  { label: "Arms", slug: "arms", values: ["biceps", "triceps", "forearms"] },
  { label: "Legs", slug: "legs", values: ["quadriceps", "quads", "hamstrings", "glutes", "calves"] },
  { label: "Core", slug: "core", values: ["core"] },
  { label: "Cardio", slug: "cardio", values: ["cardio"] },
  { label: "Olympic", slug: "olympic", values: ["olympic"] },
  { label: "Full Body", slug: "full-body", values: ["full_body"] },
  { label: "Neck", slug: "neck", values: ["neck"] },
];

const EQUIPMENT_FILTERS: Array<{ label: string; value: string | null }> = [
  { label: "All", value: null },
  { label: "Barbell", value: "barbell" },
  { label: "Dumbbell", value: "dumbbell" },
  { label: "Machine", value: "machine" },
  { label: "Bodyweight", value: "bodyweight" },
  { label: "Cable", value: "cable" },
];

const CATEGORY_OPTIONS = ["back", "chest", "shoulders", "arms", "legs", "core", "cardio", "olympic", "full_body", "neck"];
const MUSCLE_OPTIONS = ["chest", "back", "shoulders", "biceps", "triceps", "quadriceps", "hamstrings", "glutes", "core", "calves", "cardio", "full_body", "flexibility", "forearms", "neck"];
const EQUIPMENT_OPTIONS = ["barbell", "dumbbell", "machine", "bodyweight", "cable", "kettlebell", "other"];
const LOGGING_TYPE_OPTIONS: { value: LoggingType; label: string; desc: string }[] = [
  { value: "weight_reps",   label: "Weight + Reps",   desc: "e.g. 80 kg × 8 reps" },
  { value: "time_reps",     label: "Time + Reps",     desc: "e.g. 30 s × 15 reps" },
  { value: "time_distance", label: "Time + Distance", desc: "e.g. 5 km in 25 min" },
  { value: "time_weight",   label: "Time + Weight",   desc: "e.g. 20 kg for 45 s" },
  { value: "time_floors",   label: "Time + Floors",   desc: "e.g. 10 floors in 3 min" },
];

interface Props {
  exercises: ExerciseRow[];
}

export function ExerciseLibrary({ exercises: serverExercises }: Props) {
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<string[] | null>(null);
  const [equipFilter, setEquipFilter] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [localExercises, setLocalExercises] = useState<ExerciseRow[]>([]);
  const [editedMap, setEditedMap] = useState<Map<string, ExerciseRow>>(new Map());
  const [selectedExercise, setSelectedExercise] = useState<ExerciseRow | null>(null);

  const exercises = useMemo(() => {
    const serverIds = new Set(serverExercises.map((e) => e.id));
    const merged = serverExercises.map((e) => editedMap.get(e.id) ?? e);
    const fresh = localExercises.filter((e) => !serverIds.has(e.id));
    return [...merged, ...fresh];
  }, [serverExercises, localExercises, editedMap]);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const q = query.toLowerCase();
      if (q && !ex.name.toLowerCase().includes(q)) return false;
      if (muscleFilter && !muscleFilter.includes(ex.muscle_primary ?? "") && !muscleFilter.includes(ex.category ?? "")) return false;
      if (equipFilter && ex.equipment !== equipFilter) return false;
      return true;
    });
  }, [exercises, query, muscleFilter, equipFilter]);

  const groupedByMuscle = useMemo(() => {
    const groups = MUSCLE_GROUPS.map((g) => ({ ...g, exercises: [] as ExerciseRow[] }));
    const other: ExerciseRow[] = [];
    for (const ex of filtered) {
      const group = groups.find((g) => g.values.includes(ex.muscle_primary ?? "") || g.values.includes(ex.category ?? ""));
      if (group) group.exercises.push(ex);
      else other.push(ex);
    }
    const result = groups.filter((g) => g.exercises.length > 0);
    if (other.length > 0) result.push({ label: "Other", slug: "other", values: [], exercises: other });
    return result;
  }, [filtered]);

  function handleAdded(exercise: ExerciseRow) {
    setLocalExercises((prev) => [...prev, exercise]);
    setShowModal(false);
  }

  function handleUpdated(exercise: ExerciseRow) {
    setEditedMap((prev) => new Map(Array.from(prev).concat([[exercise.id, exercise]])));
    setSelectedExercise(null);
  }

  function handleDeleted(id: string) {
    setLocalExercises((prev) => prev.filter((e) => e.id !== id));
    setEditedMap((prev) => { const m = new Map(prev); m.delete(id); return m; });
    setSelectedExercise(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-r5 border border-border bg-bg-surface p-4 flex flex-col gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search exercises…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-r3 bg-bg-base border border-border text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
          />
        </div>
        <FilterRow label="Muscle" filters={MUSCLE_FILTERS.map((f) => ({ label: f.label, active: muscleFilter === f.values, onClick: () => setMuscleFilter(f.values) }))} />
        <FilterRow label="Equipment" filters={EQUIPMENT_FILTERS.map((f) => ({ label: f.label, active: equipFilter === f.value, onClick: () => setEquipFilter(f.value) }))} />
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-11 text-text-muted">{filtered.length} results</span>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-r3 border text-13 font-medium transition-colors"
          style={{ background: "var(--color-accent-soft)", borderColor: "var(--color-accent-ring)", color: "var(--color-accent)" }}
        >
          <Plus size={13} />
          Add custom exercise
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Dumbbell size={24} className="text-text-disabled" />
          <p className="text-13 text-text-muted">No exercises match your filters.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groupedByMuscle.map((group) => (
            <CollapsibleSection
              key={group.slug}
              title={<span className="font-display text-13 font-semibold text-text-primary">{group.label}</span>}
              headerExtra={<span className="font-mono text-11 text-text-muted bg-bg-elevated px-2 py-0.5 rounded-pill">{group.exercises.length}</span>}
              storageKey={`arc-collapse-exercises-${group.slug}`}
              headerClassName="py-1.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
                {group.exercises.map((ex) => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    onSelect={() => setSelectedExercise(ex)}
                  />
                ))}
              </div>
            </CollapsibleSection>
          ))}
        </div>
      )}

      {showModal && <ExerciseModal onClose={() => setShowModal(false)} onSaved={handleAdded} />}

      {selectedExercise && (
        <ExerciseEditSheet
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
          onSaved={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}

function FilterRow({ label, filters }: { label: string; filters: Array<{ label: string; active: boolean; onClick: () => void }> }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-11 font-semibold uppercase tracking-widest text-text-muted w-16 flex-shrink-0">{label}</span>
      {filters.map((f) => (
        <button
          key={f.label}
          onClick={f.onClick}
          className={`px-3 py-1 rounded-pill text-12 font-medium transition-colors border ${
            f.active
              ? "bg-[var(--color-accent-soft)] border-[var(--color-accent-ring)] text-text-primary"
              : "bg-bg-elevated border-border text-text-muted hover:text-text-secondary"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

function ExerciseCard({ exercise, onSelect }: { exercise: ExerciseRow; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="rounded-r4 border border-border bg-bg-surface hover:border-border-strong transition-colors p-4 flex flex-col gap-2 text-left w-full"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-14 font-semibold text-text-primary leading-tight hover:text-accent transition-colors">
          {exercise.name}
        </p>
        <Pencil size={12} className="text-text-disabled flex-shrink-0 mt-0.5" />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
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
    </button>
  );
}

// ─── Full-screen bottom-sheet edit form ─────────────────────────────────────

function ExerciseEditSheet({
  exercise,
  onClose,
  onSaved,
  onDeleted,
}: {
  exercise: ExerciseRow;
  onClose: () => void;
  onSaved: (ex: ExerciseRow) => void;
  onDeleted: (id: string) => void;
}) {
  const isCustom = !!exercise.is_custom;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingType, setLoggingType] = useState<LoggingType>((exercise.logging_type as LoggingType) ?? "weight_reps");
  const [stats, setStats] = useState<ExerciseStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    getExerciseStats(exercise.id).then((s) => { setStats(s); setStatsLoading(false); });
  }, [exercise.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("logging_type", loggingType);

    let result: { error: string } | { success: true; exercise: ExerciseRow };
    if (isCustom) {
      result = await updateCustomExercise(exercise.id, fd);
    } else {
      // For default exercises: only save logging_type override
      const ltResult = await updateExerciseLoggingType(exercise.id, loggingType);
      if (ltResult && "error" in ltResult) {
        setError((ltResult as { error: string }).error);
        setSaving(false);
        return;
      }
      onSaved({ ...exercise, logging_type: loggingType });
      return;
    }

    if ("error" in result) {
      setError(result.error);
      setSaving(false);
    } else {
      onSaved(result.exercise);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteCustomExercise(exercise.id);
    if ("error" in result) {
      setError(result.error);
      setDeleting(false);
      setConfirmDelete(false);
    } else {
      onDeleted(exercise.id);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-bg-surface overflow-y-auto flex flex-col"
        style={{
          borderRadius: "20px 20px 0 0",
          maxHeight: "92vh",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-17 font-semibold text-text-primary truncate">{exercise.name}</h2>
            {!isCustom && (
              <p className="text-11 text-text-muted mt-0.5">Your personal settings for this exercise. Won&apos;t affect other users.</p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-r2 hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Name {isCustom && <span className="text-danger">*</span>}</label>
            <input
              name="name"
              required={isCustom}
              defaultValue={exercise.name}
              readOnly={!isCustom}
              className={`rounded-r3 border border-border px-3 py-2.5 text-13 text-text-primary outline-none transition-colors ${isCustom ? "bg-bg-base focus:border-accent" : "bg-bg-elevated text-text-muted cursor-default"}`}
            />
          </div>

          {/* Category + Primary muscle */}
          <div className="grid grid-cols-2 gap-3">
            {isCustom ? (
              <SelectField name="category" label="Category" options={CATEGORY_OPTIONS} defaultValue={exercise.category ?? ""} />
            ) : (
              <ReadonlyField label="Category" value={exercise.category ?? "—"} />
            )}
            {isCustom ? (
              <SelectField name="muscle_primary" label="Primary muscle" options={MUSCLE_OPTIONS} defaultValue={exercise.muscle_primary ?? ""} />
            ) : (
              <ReadonlyField label="Primary muscle" value={exercise.muscle_primary?.replace(/_/g, " ") ?? "—"} />
            )}
          </div>

          {/* Equipment */}
          {isCustom ? (
            <SelectField name="equipment" label="Equipment" options={EQUIPMENT_OPTIONS} defaultValue={exercise.equipment ?? ""} />
          ) : (
            <ReadonlyField label="Equipment" value={exercise.equipment ?? "—"} />
          )}

          {/* Logging type — always editable */}
          <div className="flex flex-col gap-2">
            <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Logging type</label>
            <div className="flex flex-col gap-1.5">
              {LOGGING_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLoggingType(opt.value)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-r3 border text-left transition-colors ${
                    loggingType === opt.value
                      ? "border-accent bg-accent/10"
                      : "border-border bg-bg-elevated hover:bg-bg-overlay"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${loggingType === opt.value ? "border-accent" : "border-border"}`}>
                    {loggingType === opt.value && <div className="w-2 h-2 rounded-full bg-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-13 font-semibold text-text-primary">{opt.label}</p>
                    <p className="text-11 text-text-muted">{opt.desc}</p>
                  </div>
                  {loggingType === opt.value && <Check size={13} className="text-accent flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Notes (custom only) */}
          {isCustom && (
            <div className="flex flex-col gap-1.5">
              <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Notes (optional)</label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Cues, variations, etc."
                className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors resize-none"
              />
            </div>
          )}

          {/* Stats summary */}
          {!statsLoading && stats && stats.totalSets > 0 && (
            <div className="rounded-r3 border border-border bg-bg-elevated p-3 flex gap-4">
              <StatMini label="Sets" value={String(stats.totalSets)} />
              <StatMini label="Reps" value={String(stats.totalReps)} />
              <StatMini label="Volume" value={stats.totalVolume >= 1000 ? `${(stats.totalVolume / 1000).toFixed(1)}t` : `${stats.totalVolume}kg`} />
              {stats.pr && <StatMini label="PR" value={`${stats.pr.weightKg}kg`} />}
            </div>
          )}

          {error && <p className="text-13 text-danger">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-r3 border border-border text-13 text-text-secondary hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              {saving ? "Saving…" : "Save"}
            </button>
          </div>

          {/* Delete (custom only) */}
          {isCustom && !confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-r3 border border-error/40 text-error text-13 font-medium transition-colors hover:bg-error/10"
            >
              <Trash2 size={14} />
              Delete exercise
            </button>
          )}
          {isCustom && confirmDelete && (
            <div className="rounded-r3 border border-error/40 bg-error/5 p-3 flex flex-col gap-2">
              <p className="text-13 text-text-secondary">Delete this exercise permanently?</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-r3 border border-border text-13 text-text-secondary transition-colors hover:bg-bg-elevated">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2 rounded-r3 bg-error hover:bg-error/90 text-white text-13 font-semibold transition-colors disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 flex-1 text-center">
      <span className="font-mono text-15 font-bold text-text-primary">{value}</span>
      <span className="text-10 text-text-muted uppercase tracking-widest">{label}</span>
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">{label}</label>
      <div className="rounded-r3 border border-border bg-bg-elevated px-3 py-2.5 text-13 text-text-muted capitalize">{value}</div>
    </div>
  );
}

// ─── Create / Edit modal (for creating new custom exercises) ─────────────────

function ExerciseModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (ex: ExerciseRow) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await createCustomExercise(fd);
    if ("error" in result) {
      setError(result.error);
      setSaving(false);
    } else {
      onSaved(result.exercise);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-r5 border border-border bg-bg-surface shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-16 font-semibold text-text-primary">Add custom exercise</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-r2 hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Name *</label>
            <input
              name="name"
              required
              placeholder="e.g. Paused squat"
              className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectField name="category" label="Category" options={CATEGORY_OPTIONS} />
            <SelectField name="muscle_primary" label="Primary muscle" options={MUSCLE_OPTIONS} />
          </div>
          <SelectField name="equipment" label="Equipment" options={EQUIPMENT_OPTIONS} />
          <div className="flex flex-col gap-1.5">
            <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Notes (optional)</label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Cues, variations, etc."
              className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors resize-none"
            />
          </div>
          {error && <p className="text-13 text-danger">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-r3 border border-border text-13 text-text-secondary hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              {saving ? "Saving…" : "Save exercise"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SelectField({ name, label, options, defaultValue }: { name: string; label: string; options: string[]; defaultValue?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary outline-none focus:border-accent transition-colors"
      >
        <option value="">— select —</option>
        {options.map((o) => (
          <option key={o} value={o}>{o.replace(/_/g, " ")}</option>
        ))}
      </select>
    </div>
  );
}
