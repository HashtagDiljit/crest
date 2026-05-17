"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, X, Dumbbell } from "lucide-react";
import { createCustomExercise } from "../../actions";
import type { ExerciseRow } from "../../actions";

const MUSCLE_FILTERS: Array<{ label: string; values: string[] | null }> = [
  { label: "All", values: null },
  { label: "Chest", values: ["chest"] },
  { label: "Back", values: ["back"] },
  { label: "Legs", values: ["quadriceps", "hamstrings", "glutes", "calves"] },
  { label: "Shoulders", values: ["shoulders"] },
  { label: "Arms", values: ["biceps", "triceps"] },
  { label: "Core", values: ["core"] },
  { label: "Cardio", values: ["cardio"] },
  { label: "Mobility", values: ["flexibility", "full_body"] },
];

const EQUIPMENT_FILTERS: Array<{ label: string; value: string | null }> = [
  { label: "All", value: null },
  { label: "Barbell", value: "barbell" },
  { label: "Dumbbell", value: "dumbbell" },
  { label: "Machine", value: "machine" },
  { label: "Bodyweight", value: "bodyweight" },
  { label: "Cable", value: "cable" },
];

const CATEGORY_OPTIONS = ["barbell", "dumbbell", "machine", "bodyweight", "cardio", "mobility"];
const MUSCLE_OPTIONS = ["chest", "back", "shoulders", "biceps", "triceps", "quadriceps", "hamstrings", "glutes", "core", "calves", "cardio", "full_body", "flexibility"];
const EQUIPMENT_OPTIONS = ["barbell", "dumbbell", "machine", "bodyweight", "cable", "kettlebell", "cardio_machine", "none"];

interface Props {
  exercises: ExerciseRow[];
}

export function ExerciseLibrary({ exercises }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<string[] | null>(null);
  const [equipFilter, setEquipFilter] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const q = query.toLowerCase();
      if (q && !ex.name.toLowerCase().includes(q)) return false;
      if (muscleFilter && !muscleFilter.includes(ex.muscle_primary ?? "")) return false;
      if (equipFilter && ex.equipment !== equipFilter) return false;
      return true;
    });
  }, [exercises, query, muscleFilter, equipFilter]);

  async function handleAddExercise(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const result = await createCustomExercise(new FormData(e.currentTarget));
    if ("error" in result) {
      setFormError(result.error);
      setSaving(false);
    } else {
      setShowAddForm(false);
      setSaving(false);
      router.refresh();
    }
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
        <FilterRow
          label="Muscle"
          filters={MUSCLE_FILTERS.map((f) => ({ label: f.label, active: muscleFilter === f.values, onClick: () => setMuscleFilter(f.values) }))}
        />
        <FilterRow
          label="Equipment"
          filters={EQUIPMENT_FILTERS.map((f) => ({ label: f.label, active: equipFilter === f.value, onClick: () => setEquipFilter(f.value) }))}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-11 text-text-muted">{filtered.length} results</span>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-r3 border text-13 font-medium transition-colors"
          style={{ background: "var(--color-accent-soft)", borderColor: "var(--color-accent-ring)", color: "var(--color-accent)" }}
        >
          {showAddForm ? <X size={13} /> : <Plus size={13} />}
          {showAddForm ? "Cancel" : "Add custom exercise"}
        </button>
      </div>

      {showAddForm && (
        <AddExerciseForm onSubmit={handleAddExercise} error={formError} saving={saving} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((ex) => (
          <ExerciseCard key={ex.id} exercise={ex} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 flex flex-col items-center gap-2 py-12 text-center">
            <Dumbbell size={24} className="text-text-disabled" />
            <p className="text-13 text-text-muted">No exercises match your filters.</p>
          </div>
        )}
      </div>
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

function ExerciseCard({ exercise }: { exercise: ExerciseRow }) {
  return (
    <div className="rounded-r4 border border-border bg-bg-surface hover:border-border-strong transition-colors p-4 flex flex-col gap-2">
      <p className="font-display text-14 font-semibold text-text-primary leading-tight">{exercise.name}</p>
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
    </div>
  );
}

function AddExerciseForm({
  onSubmit,
  error,
  saving,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  error: string | null;
  saving: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-r4 border border-border bg-bg-surface p-5 flex flex-col gap-4">
      <h3 className="font-display text-15 font-semibold text-text-primary">Add custom exercise</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Name</label>
          <input name="name" required placeholder="e.g. Paused squat" className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors" />
        </div>
        <SelectField name="category" label="Category" options={CATEGORY_OPTIONS} />
        <SelectField name="muscle_primary" label="Primary muscle" options={MUSCLE_OPTIONS} />
        <SelectField name="equipment" label="Equipment" options={EQUIPMENT_OPTIONS} />
      </div>
      {error && <p className="text-13 text-danger">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="self-start px-5 py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save exercise"}
      </button>
    </form>
  );
}

function SelectField({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">{label}</label>
      <select
        name={name}
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
